// Parent PIN client. Pages call ParentPin.request(rawFetch, url, options) instead of fetch.
// It adds the unlock token, and when the server answers "parent_pin_required" it shows a
// keypad, unlocks, and retries once. The token lives in sessionStorage (this tab only).
(function () {
  const KEY = 'mathStarParentUnlock';
  const read = () => { try { const v = JSON.parse(sessionStorage.getItem(KEY) || 'null'); return v && v.exp > Date.now() ? v.token : null; } catch (_) { return null; } };
  const write = (token, minutes) => { try { sessionStorage.setItem(KEY, JSON.stringify({ token, exp: Date.now() + (minutes || 15) * 60000 - 30000 })); } catch (_) {} };
  const clear = () => { try { sessionStorage.removeItem(KEY); } catch (_) {} };

  const css = `
.pp-back{position:fixed;inset:0;z-index:9999;background:#0b1d2ecc;display:flex;align-items:center;justify-content:center;padding:16px;font-family:ui-rounded,"Trebuchet MS",system-ui,sans-serif}
.pp-box{background:#fff;color:#173451;border-radius:22px;padding:20px;width:min(340px,100%);text-align:center;box-shadow:0 20px 50px #0006}
.pp-box h3{margin:0 0 4px;font-size:22px}.pp-sub{margin:0 0 12px;color:#62788c;font-weight:800;font-size:14px}
.pp-dots{display:flex;gap:12px;justify-content:center;margin:10px 0 6px}.pp-dots span{width:18px;height:18px;border-radius:50%;border:3px solid #6554e8}.pp-dots span.on{background:#6554e8}
.pp-msg{min-height:22px;font-weight:900;color:#c23b57;font-size:14px}
.pp-keys{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:8px}
.pp-keys button{min-height:56px;border:0;border-radius:16px;background:#eef1f8;color:#173451;font:inherit;font-size:24px;font-weight:1000;cursor:pointer}
.pp-keys button:active{background:#dcdff2}.pp-keys .pp-x{font-size:16px;background:#fff;border:2px solid #e3e8f2}
.pp-foot{display:flex;justify-content:space-between;margin-top:12px}.pp-foot button{border:0;background:none;color:#4b3aad;font:inherit;font-weight:900;cursor:pointer;padding:8px}
.pp-help{direction:rtl;text-align:right;background:#fff7dc;border-radius:12px;padding:10px;font-size:14px;font-weight:800;margin-top:10px}`;

  // Shows a 4-digit keypad. mode: 'unlock' | 'set'. Resolves with the PIN, or null if cancelled.
  function keypad({ title, sub, confirm }) {
    return new Promise(resolve => {
      if (!document.getElementById('pp-css')) { const s = document.createElement('style'); s.id = 'pp-css'; s.textContent = css; document.head.appendChild(s); }
      const back = document.createElement('div'); back.className = 'pp-back';
      back.innerHTML = `<div class="pp-box" role="dialog" aria-modal="true"><h3>${title}</h3><p class="pp-sub">${sub}</p>
        <div class="pp-dots">${'<span></span>'.repeat(4)}</div><div class="pp-msg"></div>
        <div class="pp-keys">${[1,2,3,4,5,6,7,8,9].map(n => `<button data-k="${n}">${n}</button>`).join('')}<button class="pp-x" data-k="c">Cancel</button><button data-k="0">0</button><button class="pp-x" data-k="b">⌫</button></div>
        <div class="pp-foot"><span></span><button data-forgot>Forgot PIN?</button></div><div class="pp-help" hidden></div></div>`;
      document.body.appendChild(back);
      let pin = '', first = null;
      const dots = [...back.querySelectorAll('.pp-dots span')], msg = back.querySelector('.pp-msg');
      const draw = () => dots.forEach((d, i) => d.classList.toggle('on', i < pin.length));
      const done = v => { back.remove(); document.removeEventListener('keydown', onKey); resolve(v); };
      back.showError = m => { msg.textContent = m; pin = ''; draw(); };
      const press = k => {
        if (k === 'c') return done(null);
        if (k === 'b') { pin = pin.slice(0, -1); return draw(); }
        if (pin.length >= 4 || !/\d/.test(k)) return;
        pin += k; draw(); msg.textContent = '';
        if (pin.length < 4) return;
        if (confirm && first === null) { first = pin; pin = ''; setTimeout(draw, 150); back.querySelector('.pp-sub').textContent = 'Enter it again to confirm · הקלידו שוב לאישור'; return; }
        if (confirm && first !== pin) { first = null; back.querySelector('.pp-sub').textContent = sub; return back.showError('The PINs did not match. Try again.'); }
        const value = pin; setTimeout(() => done(value), 120);
      };
      const onKey = e => { if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('b'); else if (e.key === 'Escape') press('c'); };
      document.addEventListener('keydown', onKey);
      back.querySelectorAll('[data-k]').forEach(b => b.onclick = () => press(b.dataset.k));
      const forgot = back.querySelector('[data-forgot]');
      if (confirm) forgot.hidden = true;
      forgot.onclick = () => { const h = back.querySelector('.pp-help'); h.hidden = false;
        h.textContent = 'שכחתם את הקוד? התנתקו והתחברו שוב עם הסיסמה שלכם. ב-10 הדקות הראשונות אחרי ההתחברות אפשר לקבוע קוד חדש בדף "המשפחה שלי". · Forgot it? Sign out and sign in again with your password. For 10 minutes after signing in you can set a new PIN on My Family.'; };
    });
  }

  async function askAndUnlock(rawFetch) {
    for (;;) {
      const pin = await keypad({ title: '🔒 Parent PIN', sub: 'Only parents can do this · רק הורים יכולים לעשות את זה' });
      if (pin === null) return false;
      const res = await rawFetch('/api/parent-pin/unlock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.token) { write(data.token, data.expiresInMinutes); return true; }
      alert(data.error === 'pin_locked' ? 'Too many wrong tries. Try again in 15 minutes. · יותר מדי ניסיונות. נסו שוב בעוד 15 דקות.'
        : 'Wrong PIN' + (data.triesLeft ? ' · ' + data.triesLeft + ' tries left' : '') + ' · קוד שגוי');
      if (data.error === 'pin_locked') return false;
    }
  }

  function withToken(options) {
    const headers = new Headers(options?.headers || {});
    const token = read(); if (token) headers.set('X-Parent-Unlock', token);
    return { ...(options || {}), headers };
  }

  async function request(rawFetch, url, options) {
    let res = await rawFetch(url, withToken(options));
    if (res.status !== 403) return res;
    const data = await res.clone().json().catch(() => ({}));
    if (data.error !== 'parent_pin_required') return res;
    clear();
    if (!(await askAndUnlock(rawFetch))) return res;
    return rawFetch(url, withToken(options));
  }

  async function setPin(rawFetch, { currentPin } = {}) {
    const pin = await keypad({ title: '🔐 Choose a parent PIN', sub: '4 digits that your kids don’t know · 4 ספרות שהילדים לא יודעים', confirm: true });
    if (pin === null) return { ok: false, cancelled: true };
    const res = await rawFetch('/api/parent-pin/set', withToken({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin, currentPin }) }));
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.token) write(data.token, data.expiresInMinutes);
    return { ok: res.ok, ...data };
  }

  async function lock(rawFetch) {
    const token = read(); clear();
    if (token) await rawFetch('/api/parent-pin/lock', { method: 'POST', headers: { 'X-Parent-Unlock': token } }).catch(() => {});
  }

  window.ParentPin = { request, setPin, lock, keypad, unlock: askAndUnlock, isUnlockedLocally: () => Boolean(read()) };
})();
