const { chromium } = require('playwright');
const assert = require('node:assert/strict');
// Kid phone end to end. Needs test/e2e/setup.sh + wrangler dev on :8799. Run: node test/e2e/kid-phone.e2e.cjs
(async () => {
  const B = 'http://127.0.0.1:8799';
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(B + '/join.html');
  await page.screenshot({ path: 'test/e2e/out/join.png' });
  await page.fill('#code', '111111'); await page.waitForTimeout(600);
  console.log('wrong code msg:', await page.textContent('#status'));
  await page.fill('#code', '123456');
  await page.waitForURL((u) => !u.pathname.includes('join'), { timeout: 8000 });
  await page.waitForSelector('.banner h1, .kid', { timeout: 15000 });
  await page.waitForTimeout(800);
  console.log('after connect h1:', (await page.textContent('.banner h1')).trim());
  assert.deepEqual(await page.$$eval('img.kid-pic', (a) => a.map((i) => i.getAttribute('src'))), ['/assets/chars/lion.webp']);
  console.log('kid pic img:', await page.$$eval('img.kid-pic', (a) => a.map((i) => i.getAttribute('src'))));
  await page.screenshot({ path: 'test/e2e/out/kid-home.png' });
  const cookies = await ctx.cookies();
  assert.ok(cookies.some((c) => c.name === 'ms_kid' && c.httpOnly));
  console.log('cookie:', cookies.map((c) => `${c.name} httpOnly=${c.httpOnly}`));
  // picker on kid phone: only own child, no add button
  await page.goto(B + '/index.html?pick=1'); await page.waitForSelector('.kid');
  assert.deepEqual(await page.$$eval('.kid[data-id]', (a) => a.map((k) => k.dataset.id)), ['c1']); assert.equal(await page.$('[data-add]'), null);
  console.log('picker kids:', await page.$$eval('.kid[data-id]', (a) => a.map((k) => k.dataset.id)), 'add btn:', !!(await page.$('[data-add]')));
  console.log('acct:', (await page.textContent('.acct')).replace(/\s+/g, ' ').trim());
  await page.screenshot({ path: 'test/e2e/out/kid-picker.png' });
  // play: answer one problem in practice to make a save
  await page.goto(B + '/index.html'); await page.waitForSelector('[data-gd="f"]');
  await page.click('[data-gd="f"]'); await page.click('#go'); await page.waitForSelector('.missions');
  await page.screenshot({ path: 'test/e2e/out/kid-world.png' });
  const own = await page.evaluate(async () => { const r = await fetch('/api/math/children/c1/state', { headers: { Authorization: 'Bearer kid-device' } }); return [r.status, (await r.json()).child]; });
  assert.equal(own[0], 200); assert.equal(own[1].gender, 'f');
  console.log('own state:', own[0], 'gender', own[1].gender, 'grade', own[1].mathGrade);
  const pin = await page.evaluate(async () => (await fetch('/api/math/children/c1', { method: 'PATCH', headers: { Authorization: 'Bearer kid-device', 'Content-Type': 'application/json' }, body: '{"displayName":"X"}' })).status);
  assert.equal(pin, 403);
  console.log('rename from kid phone:', pin);
  const r = await page.evaluate(async () => (await fetch('/api/math/children/c3/state', { headers: { Authorization: 'Bearer kid-device' } })).status);
  assert.equal(r, 403);
  console.log('sibling state status from kid phone:', r);
  assert.deepEqual(errors, []);
  console.log('errors', errors);
  await browser.close();
})();
