// Sign-in and family rules of the Worker, run in Node against an in-memory SQLite copy of
// English Star's tables. Tokens are signed with a key made here; the Worker reads the matching
// public key from a stubbed <CLERK_FAPI_URL>/.well-known/jwks.json, as it does from Clerk.
import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import worker, { _test } from '../src/worker.js';

const ISSUER = 'https://clerk.englishstarkids.com';
const env = { CLERK_FAPI_URL: ISSUER, ASSETS: { fetch: () => new Response('asset') } };

// --- a tiny D1 stand-in -------------------------------------------------------
function fakeD1() {
  _test.resetTables();
  const db = new DatabaseSync(':memory:');
  db.exec(`PRAGMA foreign_keys = ON;
    CREATE TABLE families (id TEXT PRIMARY KEY, auth_user_id TEXT NOT NULL UNIQUE, is_frozen INTEGER NOT NULL DEFAULT 0, frozen_reason TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE children (id TEXT PRIMARY KEY, family_id TEXT NOT NULL, display_name TEXT NOT NULL, avatar_object_key TEXT,
      level INTEGER NOT NULL DEFAULT 1, grade_band TEXT, instruction_language TEXT NOT NULL DEFAULT 'he',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE);`);
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    first: async () => db.prepare(sql).get(...args) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...args) }),
    run: async () => { const r = db.prepare(sql).run(...args); return { meta: { changes: Number(r.changes) } }; },
    _run: () => db.prepare(sql).run(...args)
  });
  return {
    raw: db,
    prepare: (sql) => stmt(sql),
    batch: async (list) => { db.exec('BEGIN'); try { for (const s of list) s._run(); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; } return []; }
  };
}

// --- keys and tokens ------------------------------------------------------------
const b64url = (buf) => Buffer.from(buf).toString('base64url');
async function makeKey(kid) {
  const pair = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  return { kid, privateKey: pair.privateKey, jwk: { kty: 'RSA', n: jwk.n, e: jwk.e, kid, alg: 'RS256', use: 'sig' } };
}
async function token(key, claims = {}) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: key.kid }));
  const body = b64url(JSON.stringify({ sub: 'user_prod_1', iss: ISSUER, iat: now - 5, nbf: now - 5, exp: now + 60, sid: 'sess_1', ...claims }));
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key.privateKey, new TextEncoder().encode(head + '.' + body));
  return `${head}.${body}.${b64url(sig)}`;
}

let jwksCalls = 0, jwksKeys = [], jwksDown = false;
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  if (String(url) === ISSUER + '/.well-known/jwks.json') {
    jwksCalls++;
    if (jwksDown) return new Response('down', { status: 502 });
    return Response.json({ keys: jwksKeys });
  }
  return realFetch(url, opts);
};
const resetJwks = () => { _test.jwksCache.url = ''; _test.jwksCache.at = 0; _test.jwksCache.keys.clear(); jwksCalls = 0; jwksDown = false; };

const call = (DB, path, { tok, method = 'GET', body, cookie } = {}) => worker.fetch(new Request('https://math.englishstarkids.com' + path, {
  method, headers: { ...(tok ? { authorization: 'Bearer ' + tok } : {}), ...(body ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}) },
  body: body ? JSON.stringify(body) : undefined
}), { ...env, DB }, {});

const prod = await makeKey('ins_prod_1');
const stranger = await makeKey('ins_other');

test('health is public and reports sign-in configured', async () => {
  const res = await call(fakeD1(), '/api/health');
  assert.equal(res.status, 200);
  assert.equal((await res.json()).signIn, true);
});

test('no token / garbage / unknown key / wrong issuer / expired → 401', async () => {
  resetJwks(); jwksKeys = [prod.jwk];
  const DB = fakeD1();
  assert.equal((await call(DB, '/api/math/me')).status, 401);
  assert.equal((await call(DB, '/api/math/me', { tok: 'abc.def.ghi' })).status, 401);
  assert.equal((await call(DB, '/api/math/me', { tok: await token(stranger) })).status, 401);
  assert.equal((await call(DB, '/api/math/me', { tok: await token(prod, { iss: 'https://legible-ibex-1897.clerk.accounts.dev' }) })).status, 401);
  const past = Math.floor(Date.now() / 1000) - 3600;
  assert.equal((await call(DB, '/api/math/me', { tok: await token(prod, { iat: past - 60, nbf: past - 60, exp: past }) })).status, 401);
});

test('a production sign-in with no family sees no kids and does NOT create a family', async () => {
  resetJwks(); jwksKeys = [prod.jwk];
  const DB = fakeD1();
  const res = await call(DB, '/api/math/me', { tok: await token(prod) });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { familyId: null, isFrozen: false, pinSet: false, children: [] });
  assert.equal((await call(DB, '/api/parent-pin', { tok: await token(prod) })).status, 200);
  assert.equal((await call(DB, '/api/parent-pin/lock', { tok: await token(prod), method: 'POST' })).status, 200);
  assert.equal((await call(DB, '/api/math/children/x/state', { tok: await token(prod) })).status, 404);
  assert.equal(DB.raw.prepare('SELECT COUNT(*) AS n FROM families').get().n, 0, 'no empty family may be created');
});

test('the family English Star moved to the new sign-in shows up; others stay hidden', async () => {
  resetJwks(); jwksKeys = [prod.jwk];
  const DB = fakeD1();
  DB.raw.exec(`INSERT INTO families (id, auth_user_id) VALUES ('fam1','user_prod_1'), ('fam2','user_prod_2');
    INSERT INTO children (id, family_id, display_name, grade_band) VALUES ('c1','fam1','Tal','4'), ('c2','fam2','Gil','6');`);
  const me = await (await call(DB, '/api/math/me', { tok: await token(prod) })).json();
  assert.equal(me.familyId, 'fam1');
  assert.deepEqual(me.children.map((c) => c.name ?? c.displayName ?? c.display_name), ['Tal']);
  assert.equal((await call(DB, '/api/math/children/c2/state', { tok: await token(prod) })).status, 404);
  const put = await call(DB, '/api/math/children/c1/state', { tok: await token(prod), method: 'PUT', body: { state: { xp: 10, answered: 1 } } });
  assert.equal(put.status, 200);
  const got = await (await call(DB, '/api/math/children/c1/state', { tok: await token(prod) })).json();
  assert.equal(got.state.xp, 10);
});

test('adding the first child is what creates a family', async () => {
  resetJwks(); jwksKeys = [prod.jwk];
  const DB = fakeD1();
  const res = await call(DB, '/api/math/children', { tok: await token(prod, { sub: 'user_new' }), method: 'POST', body: { displayName: 'Gil', mathGrade: '2', gender: 'm' } });
  assert.equal(res.status, 201);
  assert.equal(DB.raw.prepare("SELECT COUNT(*) AS n FROM families WHERE auth_user_id = 'user_new'").get().n, 1);
});

test('public keys are fetched once and cached; a rotated key is picked up', async () => {
  resetJwks(); jwksKeys = [prod.jwk];
  const DB = fakeD1();
  for (let i = 0; i < 3; i++) assert.equal((await call(DB, '/api/math/me', { tok: await token(prod) })).status, 200);
  assert.equal(jwksCalls, 1);
  // Clerk rotates: new kid. Cache is fresh but <60s old → refused once, then accepted after the minute.
  const rotated = await makeKey('ins_prod_2');
  jwksKeys = [prod.jwk, rotated.jwk];
  assert.equal((await call(DB, '/api/math/me', { tok: await token(rotated) })).status, 401);
  _test.jwksCache.at -= 61_000;
  assert.equal((await call(DB, '/api/math/me', { tok: await token(rotated) })).status, 200);
  assert.equal(jwksCalls, 2);
});

test('Clerk key list unreachable → 503, not a silent pass', async () => {
  resetJwks(); jwksDown = true;
  assert.equal((await call(fakeD1(), '/api/math/me', { tok: await token(prod) })).status, 503);
});

test('a pasted CLERK_JWT_KEY still works without fetching', async () => {
  resetJwks(); jwksKeys = [];
  const pem = await _test.jwkToPem(prod.jwk);
  const DB = fakeD1();
  const res = await worker.fetch(new Request('https://math.englishstarkids.com/api/math/me', { headers: { authorization: 'Bearer ' + await token(prod) } }),
    { ...env, CLERK_JWT_KEY: pem, DB }, {});
  assert.equal(res.status, 200);
  assert.equal(jwksCalls, 0);
});

// --- kid phones -------------------------------------------------------------------
const sha = async (t) => Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t))).toString('hex');
async function kidFamily() {
  const DB = fakeD1();
  DB.raw.exec(`INSERT INTO families (id, auth_user_id) VALUES ('fam1','user_prod_1'), ('fam2','user_prod_2');
    INSERT INTO children (id, family_id, display_name, avatar_object_key, grade_band) VALUES
      ('c1','fam1','Tal','char:lion','4'), ('c3','fam1','Noa','emoji:🦊','2'), ('c2','fam2','Gil',NULL,'6');`);
  // English Star made this code on its Family page (same tables, same hashing).
  DB.raw.exec(`CREATE TABLE IF NOT EXISTS kid_connect_codes (code_hash TEXT PRIMARY KEY, family_id TEXT NOT NULL, child_id TEXT NOT NULL, expires_at TEXT NOT NULL)`);
  DB.raw.prepare(`INSERT INTO kid_connect_codes VALUES (?, 'fam1', 'c1', datetime('now','+10 minutes'))`).run(await sha('kid-connect:123456'));
  DB.raw.prepare(`INSERT INTO kid_connect_codes VALUES (?, 'fam1', 'c1', datetime('now','-1 minutes'))`).run(await sha('kid-connect:999999'));
  return DB;
}
const kidCall = (DB, path, cookie, opts = {}) => worker.fetch(new Request('https://math.englishstarkids.com' + path, {
  method: opts.method || 'GET',
  headers: { authorization: 'Bearer kid-device', cookie, ...(opts.body ? { 'content-type': 'application/json' } : {}) },
  body: opts.body ? JSON.stringify(opts.body) : undefined
}), { ...env, DB }, {});

test('kid phone: a code connects once, then the phone acts as that one child only', async () => {
  const DB = await kidFamily();
  assert.equal((await call(DB, '/api/kid-connect', { method: 'POST', body: { code: '999999' } })).status, 400, 'expired code');
  const res = await call(DB, '/api/kid-connect', { method: 'POST', body: { code: '123 456' } });
  assert.equal(res.status, 200);
  assert.deepEqual((await res.json()).child, { id: 'c1', name: 'Tal' });
  const setCookie = res.headers.get('set-cookie');
  assert.match(setCookie, /^ms_kid=kd_[A-Za-z0-9_-]+; Path=\/; HttpOnly; SameSite=Lax; Max-Age=31536000; Secure$/);
  const cookie = setCookie.split(';')[0];
  assert.equal((await call(DB, '/api/kid-connect', { method: 'POST', body: { code: '123456' } })).status, 400, 'a code works once');

  const me = await (await kidCall(DB, '/api/math/me', cookie)).json();
  assert.deepEqual(me.children.map((c) => c.id), ['c1'], 'only its own child, not the sibling');
  assert.deepEqual(me.kidDevice, { childId: 'c1', name: 'Tal' });
  assert.equal(me.children[0].character, 'lion');

  assert.equal((await kidCall(DB, '/api/math/children/c1/state', cookie, { method: 'PUT', body: { state: { xp: 5, answered: 1 } } })).status, 200);
  assert.equal((await kidCall(DB, '/api/math/children/c1/state', cookie)).status, 200);
  for (const [path, method, body] of [
    ['/api/math/children/c3/state', 'GET'],
    ['/api/math/children/c2/state', 'GET'],
    ['/api/math/children', 'POST', { displayName: 'X' }],
    ['/api/math/children/c1', 'PATCH', { displayName: 'Renamed' }]
  ]) assert.equal((await kidCall(DB, path, cookie, { method, body })).status, 403, `${method} ${path} must be refused`);
  assert.equal(DB.raw.prepare("SELECT display_name FROM children WHERE id = 'c1'").get().display_name, 'Tal');
});

test('kid phone: disconnected by a parent (or itself) → kid_device_signed_out', async () => {
  const DB = await kidFamily();
  const cookie = (await call(DB, '/api/kid-connect', { method: 'POST', body: { code: '123456' } })).headers.get('set-cookie').split(';')[0];
  DB.raw.exec('UPDATE kid_devices SET revoked_at = CURRENT_TIMESTAMP'); // English Star's Family page "disconnect"
  const res = await kidCall(DB, '/api/math/me', cookie);
  assert.equal(res.status, 401);
  assert.equal((await res.json()).error, 'kid_device_signed_out');
  assert.equal((await kidCall(DB, '/api/math/me', 'ms_kid=kd_forged')).status, 401);
  assert.equal((await kidCall(DB, '/api/math/me', '')).status, 401);
});

test('kid phone: 10 wrong codes from one address → wait 15 minutes; frozen family → 423', async () => {
  const DB = await kidFamily();
  for (let i = 0; i < 10; i++) assert.equal((await call(DB, '/api/kid-connect', { method: 'POST', body: { code: '00000' + (i % 10) } })).status, 400);
  assert.equal((await call(DB, '/api/kid-connect', { method: 'POST', body: { code: '123456' } })).status, 429);
  const DB2 = await kidFamily();
  DB2.raw.exec("UPDATE families SET is_frozen = 1 WHERE id = 'fam1'");
  assert.equal((await call(DB2, '/api/kid-connect', { method: 'POST', body: { code: '123456' } })).status, 423);
});

test('character pictures from English Star reach Math Star', async () => {
  resetJwks(); jwksKeys = [prod.jwk];
  const DB = await kidFamily();
  const me = await (await call(DB, '/api/math/me', { tok: await token(prod) })).json();
  const byId = Object.fromEntries(me.children.map((c) => [c.id, c]));
  assert.equal(byId.c1.character, 'lion'); assert.equal(byId.c1.avatar, null);
  assert.equal(byId.c3.character, null); assert.equal(byId.c3.avatar, '🦊');
});
