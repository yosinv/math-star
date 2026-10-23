// Math Star Worker.
//
// Accounts follow English Star exactly and share its data:
//  - a parent signs in with Clerk (same Clerk app as English Star),
//  - the family and its children live in English Star's D1 database (families, children),
//  - the same 4-digit parent PIN (parent_pins) guards adding and editing children.
// Math progress is stored per child in its own table, math_child_state, which this Worker
// creates on first use, so no manual migration is needed and English Star's tables are
// only read, plus the same child insert/update English Star itself does.
// Without sign-in the site keeps working with progress on the device (see public/js/store.js).

import { Hono } from 'hono';
import { clerkMiddleware, getAuth } from '@hono/clerk-auth';

const app = new Hono();
const MATH_GRADES = new Set(['K', '1', '2', '3', '4', '5', '6']);
const MAX_STATE_BYTES = 300_000;

// Characters, never photos — the same set English Star offers, so a child looks the same on both sites.
const AVATAR_CHOICES = new Set(["🦸‍♀️", "🦸‍♂️", "🦹‍♀️", "🧙‍♀️", "🧙‍♂️", "🧚‍♀️", "🧜‍♀️", "🧞", "🥷", "🤖", "👽", "👸", "🤴", "🧑‍🚀", "🐶", "🐱", "🦊", "🐼", "🐨", "🦁", "🐯", "🐵", "🐸", "🐰", "🦄", "🐲", "🐬", "🦋", "🐧", "🦖", "😎", "🤩", "🥳", "🤠", "😺", "🌟"]);

app.get('/api/health', async (c) => {
  let database = false;
  try { await c.env.DB.prepare('SELECT 1 FROM families LIMIT 1').first(); database = true; } catch (_) {}
  return c.json({
    ok: database,
    service: 'math-star',
    database,
    signIn: Boolean(c.env.CLERK_SECRET_KEY && c.env.CLERK_PUBLISHABLE_KEY)
  }, database ? 200 : 503);
});

app.use('/api/*', async (c, next) => {
  if (!c.env.CLERK_SECRET_KEY) return c.json({ error: 'sign_in_not_configured' }, 503);
  return clerkMiddleware({
    secretKey: c.env.CLERK_SECRET_KEY,
    publishableKey: c.env.CLERK_PUBLISHABLE_KEY,
    // Optional: Clerk's public JWT key for networkless verification (also used by local tests).
    ...(c.env.CLERK_JWT_KEY ? { jwtKey: c.env.CLERK_JWT_KEY } : {})
  })(c, next);
});

// Signed-in parent required; frozen families are blocked (same rule as English Star).
app.use('/api/*', async (c, next) => {
  const auth = getAuth(c);
  if (!auth?.userId) return c.json({ error: 'unauthorized' }, 401);
  c.set('authUserId', auth.userId);
  try {
    const frozen = await c.env.DB.prepare('SELECT id, is_frozen, frozen_reason FROM families WHERE auth_user_id = ?').bind(auth.userId).first();
    if (frozen?.is_frozen && frozen.id !== adminFamilyId(c) && c.req.path !== '/api/math/me') {
      return c.json({ error: 'account_frozen', message: 'This account has been temporarily frozen by the administrator.' }, 423);
    }
  } catch (error) {
    if (!/no such (column|table)/i.test(String(error?.message || ''))) {
      console.error('freeze check failed', error);
      return c.json({ error: 'service_unavailable' }, 503);
    }
  }
  try { await ensureTables(c); } catch (error) {
    console.error('table setup failed', error);
    return c.json({ error: 'service_unavailable' }, 503);
  }
  await next();
});

let tablesReady = false;
async function ensureTables(c) {
  if (tablesReady) return;
  await c.env.DB.batch([
    // Same definitions English Star uses for the shared parent PIN.
    c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS parent_pins (family_id TEXT PRIMARY KEY, pin_hash TEXT NOT NULL, salt TEXT NOT NULL, failed_count INTEGER NOT NULL DEFAULT 0, locked_until TEXT, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
    c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS parent_unlocks (token_hash TEXT PRIMARY KEY, family_id TEXT NOT NULL, expires_at TEXT NOT NULL)`),
    // Math Star's own table: one row per child, removed with the child.
    c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS math_child_state (
      child_id TEXT PRIMARY KEY,
      gender TEXT CHECK (gender IN ('f','m')),
      math_grade TEXT,
      state_json TEXT,
      version INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
    )`)
  ]);
  tablesReady = true;
}

const adminFamilyId = (c) => String(c.env.ADMIN_FAMILY_ID || c.env.LEGACY_OWNER_FAMILY_ID || '');

async function getOrCreateFamily(c) {
  const authUserId = c.get('authUserId');
  let family = await c.env.DB.prepare('SELECT id, auth_user_id FROM families WHERE auth_user_id = ?').bind(authUserId).first();
  if (!family) {
    const id = crypto.randomUUID();
    await c.env.DB.prepare('INSERT OR IGNORE INTO families (id, auth_user_id) VALUES (?, ?)').bind(id, authUserId).run();
    family = await c.env.DB.prepare('SELECT id, auth_user_id FROM families WHERE auth_user_id = ?').bind(authUserId).first();
  }
  return family;
}

async function getOwnedChild(c, childId) {
  const family = await getOrCreateFamily(c);
  return c.env.DB.prepare(
    `SELECT ch.id, ch.display_name, ch.avatar_object_key, ch.grade_band, ch.family_id,
            m.gender, m.math_grade, m.state_json, m.version, m.updated_at AS math_updated_at
       FROM children ch LEFT JOIN math_child_state m ON m.child_id = ch.id
      WHERE ch.id = ? AND ch.family_id = ?`
  ).bind(String(childId || ''), family.id).first();
}

const avatarOf = (key) => (typeof key === 'string' && key.startsWith('emoji:') ? key.slice(6) : null);
const cleanName = (v) => String(v || '').trim().slice(0, 40);
const cleanGender = (v) => (v === 'm' || v === 'f' ? v : null);
const cleanGrade = (v) => (MATH_GRADES.has(String(v)) ? String(v) : null);
// English Star stores school grade as 'K', '1'…'12'. Math Star covers גן–ו׳.
function mathGradeFromBand(band) {
  const b = String(band || '').trim().toUpperCase();
  if (b === 'K') return 'K';
  const n = Number(b);
  if (Number.isInteger(n) && n >= 1) return String(Math.min(n, 6));
  return null;
}

function childView(row) {
  return {
    id: row.id,
    displayName: row.display_name,
    avatar: avatarOf(row.avatar_object_key),
    gradeBand: row.grade_band || null,
    gender: row.gender || null,
    mathGrade: row.math_grade || mathGradeFromBand(row.grade_band),
    hasProgress: Boolean(row.state_json),
    updatedAt: row.math_updated_at || null
  };
}

// ---------------------------------------------------------------------------
// Parent PIN — same tables, hashing and limits as English Star, so one PIN
// covers both sites. Setting or changing the PIN stays on English Star's
// "My Family" page; Math Star only checks it.
// ---------------------------------------------------------------------------
const PIN_UNLOCK_MINUTES = 15, PIN_MAX_FAILS = 5, PIN_LOCK_MINUTES = 15;
const b64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
async function sha256HexText(text) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function hashPin(pin, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: 100000 }, key, 256);
  return b64url(new Uint8Array(bits));
}
function sameString(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
const validPin = (pin) => typeof pin === 'string' && /^\d{4}$/.test(pin);
const sqliteNowPlus = (minutes) => new Date(Date.now() + minutes * 60000).toISOString().replace('T', ' ').slice(0, 19);
const sqliteTimeMs = (s) => Date.parse(String(s || '').replace(' ', 'T') + 'Z');

async function hasValidUnlock(c, familyId) {
  const token = c.req.header('x-parent-unlock');
  if (!token || token.length > 100) return false;
  const row = await c.env.DB.prepare('SELECT family_id, expires_at FROM parent_unlocks WHERE token_hash = ?').bind(await sha256HexText(token)).first();
  return Boolean(row && row.family_id === familyId && sqliteTimeMs(row.expires_at) > Date.now());
}
// Returns a Response when a PIN is set and this request is not unlocked; otherwise null.
async function parentGate(c, familyId) {
  const pin = await c.env.DB.prepare('SELECT family_id FROM parent_pins WHERE family_id = ?').bind(familyId).first();
  if (!pin || (await hasValidUnlock(c, familyId))) return null;
  return c.json({ error: 'parent_pin_required', message: 'Enter the parent PIN to continue.' }, 403);
}

app.get('/api/parent-pin', async (c) => {
  const family = await getOrCreateFamily(c);
  const row = await c.env.DB.prepare('SELECT locked_until FROM parent_pins WHERE family_id = ?').bind(family.id).first();
  return c.json({ isSet: Boolean(row), unlocked: row ? await hasValidUnlock(c, family.id) : true, unlockMinutes: PIN_UNLOCK_MINUTES });
});

app.post('/api/parent-pin/unlock', async (c) => {
  const family = await getOrCreateFamily(c);
  const body = await c.req.json().catch(() => ({}));
  const pin = String(body.pin ?? '');
  const row = await c.env.DB.prepare('SELECT pin_hash, salt, failed_count, locked_until FROM parent_pins WHERE family_id = ?').bind(family.id).first();
  if (!row) return c.json({ error: 'pin_not_set' }, 409);
  if (row.locked_until && sqliteTimeMs(row.locked_until) > Date.now()) {
    return c.json({ error: 'pin_locked', message: 'Too many wrong tries. Try again in a few minutes.', lockedUntil: row.locked_until }, 429);
  }
  if (validPin(pin) && sameString(await hashPin(pin, row.salt), row.pin_hash)) {
    const token = b64url(crypto.getRandomValues(new Uint8Array(32)));
    await c.env.DB.batch([
      c.env.DB.prepare('UPDATE parent_pins SET failed_count = 0, locked_until = NULL WHERE family_id = ?').bind(family.id),
      c.env.DB.prepare("DELETE FROM parent_unlocks WHERE family_id = ? AND expires_at < datetime('now')").bind(family.id),
      c.env.DB.prepare('INSERT INTO parent_unlocks (token_hash, family_id, expires_at) VALUES (?, ?, ?)').bind(await sha256HexText(token), family.id, sqliteNowPlus(PIN_UNLOCK_MINUTES))
    ]);
    return c.json({ ok: true, token, expiresInMinutes: PIN_UNLOCK_MINUTES });
  }
  const fails = Number(row.failed_count || 0) + 1;
  const lock = fails >= PIN_MAX_FAILS ? sqliteNowPlus(PIN_LOCK_MINUTES) : null;
  await c.env.DB.prepare('UPDATE parent_pins SET failed_count = ?, locked_until = ? WHERE family_id = ?').bind(lock ? 0 : fails, lock, family.id).run();
  return lock
    ? c.json({ error: 'pin_locked', message: 'Too many wrong tries.', lockedUntil: lock }, 429)
    : c.json({ error: 'wrong_pin', message: 'Wrong PIN.', triesLeft: PIN_MAX_FAILS - fails }, 401);
});

app.post('/api/parent-pin/lock', async (c) => {
  await getOrCreateFamily(c);
  const token = c.req.header('x-parent-unlock');
  if (token) await c.env.DB.prepare('DELETE FROM parent_unlocks WHERE token_hash = ?').bind(await sha256HexText(token)).run();
  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Math API
// ---------------------------------------------------------------------------
app.get('/api/math/me', async (c) => {
  const family = await getOrCreateFamily(c);
  const [kids, pin, freeze] = await Promise.all([
    c.env.DB.prepare(
      `SELECT ch.id, ch.display_name, ch.avatar_object_key, ch.grade_band,
              m.gender, m.math_grade, (m.state_json IS NOT NULL) AS state_json, m.updated_at AS math_updated_at
         FROM children ch LEFT JOIN math_child_state m ON m.child_id = ch.id
        WHERE ch.family_id = ? ORDER BY ch.created_at`
    ).bind(family.id).all(),
    c.env.DB.prepare('SELECT family_id FROM parent_pins WHERE family_id = ?').bind(family.id).first(),
    c.env.DB.prepare('SELECT is_frozen FROM families WHERE id = ?').bind(family.id).first().catch(() => null)
  ]);
  return c.json({
    familyId: family.id,
    isFrozen: Boolean(freeze?.is_frozen),
    pinSet: Boolean(pin),
    children: (kids.results || []).map((r) => childView({ ...r, state_json: r.state_json ? 1 : null }))
  });
});

app.get('/api/math/children/:id/state', async (c) => {
  const row = await getOwnedChild(c, c.req.param('id'));
  if (!row) return c.json({ error: 'not_found' }, 404);
  let state = null;
  try { state = row.state_json ? JSON.parse(row.state_json) : null; } catch (_) { state = null; }
  return c.json({ child: childView(row), state, version: row.version || 0 });
});

// Progress is saved by the child's own play — no PIN, like English Star's activity attempts.
app.put('/api/math/children/:id/state', async (c) => {
  const row = await getOwnedChild(c, c.req.param('id'));
  if (!row) return c.json({ error: 'not_found' }, 404);
  const raw = await c.req.text();
  if (raw.length > MAX_STATE_BYTES) return c.json({ error: 'too_large' }, 413);
  let body;
  try { body = JSON.parse(raw); } catch (_) { return c.json({ error: 'invalid_json' }, 400); }
  const state = body?.state;
  if (!state || typeof state !== 'object' || Array.isArray(state)) return c.json({ error: 'invalid_state' }, 400);
  const json = JSON.stringify(state);
  if (json.length > MAX_STATE_BYTES) return c.json({ error: 'too_large' }, 413);
  await c.env.DB.prepare(
    `INSERT INTO math_child_state (child_id, state_json, version, updated_at) VALUES (?, ?, 1, CURRENT_TIMESTAMP)
     ON CONFLICT(child_id) DO UPDATE SET state_json = excluded.state_json, version = math_child_state.version + 1, updated_at = CURRENT_TIMESTAMP`
  ).bind(row.id, json).run();
  const v = await c.env.DB.prepare('SELECT version FROM math_child_state WHERE child_id = ?').bind(row.id).first();
  return c.json({ ok: true, version: v?.version || 1 });
});

// Boy/girl and math grade. Filling them in the first time is open (the child does it on
// first visit); changing them later is a parent action.
app.patch('/api/math/children/:id/settings', async (c) => {
  const row = await getOwnedChild(c, c.req.param('id'));
  if (!row) return c.json({ error: 'not_found' }, 404);
  const body = await c.req.json().catch(() => ({}));
  const gender = body.gender !== undefined ? cleanGender(body.gender) : row.gender;
  const mathGrade = body.mathGrade !== undefined ? cleanGrade(body.mathGrade) : row.math_grade;
  if (body.gender !== undefined && !gender) return c.json({ error: 'invalid_gender' }, 400);
  if (body.mathGrade !== undefined && !mathGrade) return c.json({ error: 'invalid_grade' }, 400);
  const changing = (row.gender && gender !== row.gender) || (row.math_grade && mathGrade !== row.math_grade);
  if (changing) { const gate = await parentGate(c, row.family_id); if (gate) return gate; }
  await c.env.DB.prepare(
    `INSERT INTO math_child_state (child_id, gender, math_grade) VALUES (?, ?, ?)
     ON CONFLICT(child_id) DO UPDATE SET gender = excluded.gender, math_grade = excluded.math_grade, updated_at = CURRENT_TIMESTAMP`
  ).bind(row.id, gender, mathGrade).run();
  return c.json({ child: childView(await getOwnedChild(c, row.id)) });
});

// Add a child to the family (shared with English Star) — a parent action.
app.post('/api/math/children', async (c) => {
  const family = await getOrCreateFamily(c);
  const gate = await parentGate(c, family.id); if (gate) return gate;
  const body = await c.req.json().catch(() => ({}));
  const displayName = cleanName(body.displayName);
  if (!displayName) return c.json({ error: 'displayName is required' }, 400);
  const avatar = AVATAR_CHOICES.has(body.avatar) ? body.avatar : '🌟';
  const mathGrade = cleanGrade(body.mathGrade);
  const gender = cleanGender(body.gender);
  const id = crypto.randomUUID();
  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO children (id, family_id, display_name, avatar_object_key, level, grade_band, instruction_language)
       VALUES (?, ?, ?, ?, 1, ?, 'he')`
    ).bind(id, family.id, displayName, 'emoji:' + avatar, mathGrade),
    c.env.DB.prepare('INSERT INTO math_child_state (child_id, gender, math_grade) VALUES (?, ?, ?)').bind(id, gender, mathGrade)
  ]);
  return c.json({ child: childView(await getOwnedChild(c, id)) }, 201);
});

// Rename / change character — a parent action, same as editing on English Star.
app.patch('/api/math/children/:id', async (c) => {
  const row = await getOwnedChild(c, c.req.param('id'));
  if (!row) return c.json({ error: 'not_found' }, 404);
  const gate = await parentGate(c, row.family_id); if (gate) return gate;
  const body = await c.req.json().catch(() => ({}));
  const displayName = body.displayName !== undefined ? cleanName(body.displayName) : row.display_name;
  if (!displayName) return c.json({ error: 'displayName is required' }, 400);
  let avatarKey = row.avatar_object_key;
  if (body.avatar !== undefined) {
    if (!AVATAR_CHOICES.has(body.avatar)) return c.json({ error: 'invalid_avatar' }, 400);
    avatarKey = 'emoji:' + body.avatar; // a photo, if any, stays in English Star's storage until it expires
  }
  await c.env.DB.prepare('UPDATE children SET display_name = ?, avatar_object_key = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(displayName, avatarKey, row.id).run();
  return c.json({ child: childView(await getOwnedChild(c, row.id)) });
});

app.all('/api/*', (c) => c.json({ ok: false, error: 'not_found' }, 404));

app.onError((err, c) => {
  console.error('math-star api error', err);
  return c.json({ error: 'server_error' }, 500);
});

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return app.fetch(request, env, ctx);
    return env.ASSETS.fetch(request);
  }
};
