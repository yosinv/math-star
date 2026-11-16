const { chromium } = require('playwright');
const assert = require('node:assert/strict');
// Guest mode + privacy page. Needs wrangler dev on :8799. Run: node test/e2e/guest.e2e.cjs
(async () => {
  const B = 'http://127.0.0.1:8799', b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(B + '/privacy.html'); await p.screenshot({ path: 'test/e2e/out/privacy.png', fullPage: false });
  await p.evaluate(() => localStorage.setItem('mathstar.v1', JSON.stringify({ version: 1, activeId: null,
    profiles: [{ id: 'p1', name: 'Tal', avatar: '🦁', grade: '4', gender: 'f' }, { id: 'p2', name: 'Gil', avatar: '🐼', grade: '6', gender: 'm' }], kids: {} })));
  await p.goto(B + '/?pick=1'); await p.waitForSelector('.kid[data-id]');
  console.log('guest acct:', (await p.textContent('.acct')).replace(/\s+/g, ' ').trim());
  console.log('pics:', await p.$$eval('.kid[data-id] .big', (a) => a.map((x) => x.innerHTML.includes('<img') ? 'img' : x.textContent)));
  assert.deepEqual(await p.$$eval('.kid[data-id] .big', (a) => a.map((x) => x.innerHTML.includes('<img') ? 'img' : x.textContent)), ['img', '🐼']);
  await p.screenshot({ path: 'test/e2e/out/guest-picker.png', fullPage: true });
  await p.click('.kid[data-id="p2"]'); await p.waitForSelector('.missions');
  assert.deepEqual(errs, []);
  console.log('boy world ok; errors', errs);
  await b.close();
})();
