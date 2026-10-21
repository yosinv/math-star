// Shared DOM helpers for Math Star pages.
import { check, spoken, playerLevel, levelProgress, XP_PER_LEVEL } from './engine.js';
import { load, save, active } from './store.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
// Render text with stacked fractions ("3/4") and, for expressions, a highlighted blank.
export function fracHTML(s) {
  return esc(s).replace(/(\d+)\/(\d+)/g, '<span class="frac"><span>$1</span><span>$2</span></span>');
}
export function exprHTML(expr, filled) {
  let h = fracHTML(expr);
  const blank = filled !== undefined ? `<span class="q">${fracHTML(filled)}</span>` : '<span class="q">?</span>';
  h = h.replace(/\?|◻/, blank);
  return h;
}

export function requireProfile() {
  const state = load();
  const a = active(state);
  if (!a) { location.replace('index.html'); throw new Error('no profile'); }
  return { state, ...a, persist: () => save(state) };
}

export function hudHTML(profile, kid) {
  const lvl = playerLevel(kid.xp);
  return `
    <a class="hud-pill me" href="index.html?pick=1" title="החלפת ילדה"><span class="av">${esc(profile.avatar)}</span>${esc(profile.name)}</a>
    <span class="hud-pill lvl-pill" title="רמה">🏅 ${lvl}</span>
    <span class="hud-pill" title="נקודות">⭐ <b data-xp>${kid.xp}</b></span>
    <span class="hud-pill" title="יהלומים">💎 <b data-gems>${kid.gems}</b></span>
    <span class="hud-pill" title="ימים ברצף">🔥 ${kid.streak || 0}</span>`;
}
export function levelBarHTML(kid) {
  const p = Math.round((levelProgress(kid.xp) / XP_PER_LEVEL) * 100);
  return `<div class="lvlbar"><span>רמה ${playerLevel(kid.xp)}</span><div class="track"><div class="fill" style="width:${p}%"></div></div><span class="ltr">${levelProgress(kid.xp)} / ${XP_PER_LEVEL}</span></div>`;
}

export function toast(msg, ms = 2400) {
  let t = $('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), ms);
}

export function confetti(n = 70) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#ffd14c', '#7b5cf0', '#2fb35a', '#ef5b6e', '#2f8fe0', '#ff9f43'];
  for (let i = 0; i < n; i++) {
    const c = document.createElement('i');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = 1.6 + Math.random() * 1.6 + 's';
    c.style.animationDelay = Math.random() * 0.4 + 's';
    document.body.append(c);
    setTimeout(() => c.remove(), 3800);
  }
}

// ---------- Hebrew text-to-speech (only shown if the device has a Hebrew voice) ----------
let heVoice = null;
function findVoice() {
  if (!('speechSynthesis' in window)) return null;
  heVoice = speechSynthesis.getVoices().find((v) => /^he|^iw/i.test(v.lang)) || null;
  return heVoice;
}
export function onSpeechReady(cb) {
  if (!('speechSynthesis' in window)) return;
  if (findVoice()) return cb();
  speechSynthesis.addEventListener?.('voiceschanged', () => { if (findVoice()) cb(); }, { once: true });
}
export function speak(text) {
  if (!heVoice && !findVoice()) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = heVoice; u.lang = heVoice.lang; u.rate = 0.9;
  speechSynthesis.speak(u);
}

// ---------- visuals ----------
const rep = (s, n) => Array.from({ length: n }, () => s).join('');
export function visualHTML(v) {
  if (!v) return '';
  const e = esc(v.emoji || '');
  switch (v.type) {
    case 'objects': return `<div class="visual"><div class="grp">${rep(`<span>${e}</span>`, v.n)}</div></div>`;
    case 'groups':
      if (v.groups) {
        const g = Math.min(v.groups, 10), each = Math.min(v.each, 10);
        return `<div class="visual">${Array.from({ length: g }, () => `<div class="grp dots" style="max-width:${Math.min(each, 5) * 27 + 20}px">${rep('<i></i>', each)}</div>`).join('')}</div>`;
      }
      return `<div class="visual"><div class="grp">${rep(`<span>${e}</span>`, v.a)}</div><span class="op">+</span><div class="grp">${rep(`<span>${e}</span>`, v.b)}</div></div>`;
    case 'takeaway':
      return `<div class="visual"><div class="grp">${rep(`<span>${e}</span>`, v.a - v.b)}${rep(`<span class="gone">${e}</span>`, v.b)}</div></div>`;
    case 'compare':
      return `<div class="visual"><div class="grp">${rep(`<span>${e}</span>`, v.a)}</div><span class="op">?</span><div class="grp">${rep(`<span>${e}</span>`, v.b)}</div></div>`;
    case 'numberline': return numberLineSVG(v);
    case 'rect': case 'para': case 'lshape': case 'frame': return shapeSVG(v);
    default: return '';
  }
}

const SVG_STYLE = 'class="figure" role="img" xmlns="http://www.w3.org/2000/svg"';
const txt = (x, y, s, anchor = 'middle', extra = '') => `<text x="${x}" y="${y}" text-anchor="${anchor}" ${extra}>${esc(s)}</text>`;

function numberLineSVG({ from, to, parts, at }) {
  const W = 420, x0 = 24, x1 = W - 24, y = 62, span = to - from;
  const X = (v) => x0 + ((v - from) / span) * (x1 - x0);
  let ticks = '';
  for (let i = 0; i <= span * parts; i++) {
    const v = from + i / parts, major = i % parts === 0;
    ticks += `<line x1="${X(v)}" y1="${y - (major ? 12 : 7)}" x2="${X(v)}" y2="${y + (major ? 12 : 7)}" stroke-width="${major ? 3 : 2}"/>`;
    if (major) ticks += txt(X(v), y + 34, String(v), 'middle', 'class="lbl"');
  }
  const ax = X(at);
  return `<div class="visual"><svg ${SVG_STYLE} viewBox="0 0 ${W} 104" aria-label="ישר מספרים">
    <line x1="${x0 - 8}" y1="${y}" x2="${x1 + 8}" y2="${y}" stroke-width="3"/>${ticks}
    <path class="accent" d="M${ax} ${y - 16} l-9 -14 h18 z"/>${txt(ax, 22, '?', 'middle', 'class="accent-t"')}
  </svg></div>`;
}

function shapeSVG(v) {
  const box = { w: 300, h: 170 }, pad = 34;
  const unitW = v.type === 'para' ? v.base + Math.sqrt(Math.max(0, v.side ** 2 - v.height ** 2)) : v.W ?? v.w;
  const unitH = v.type === 'para' ? v.height : v.H ?? v.h;
  const s = Math.min(box.w / unitW, box.h / unitH);
  const ox = pad + (box.w - unitW * s) / 2, oy = pad - 8 + (box.h - unitH * s) / 2;
  const P = (x, y) => `${(ox + x * s).toFixed(1)},${(oy + y * s).toFixed(1)}`;
  let body = '';
  if (v.type === 'rect') {
    body = `<polygon class="fillA" points="${P(0, 0)} ${P(v.w, 0)} ${P(v.w, v.h)} ${P(0, v.h)}"/>`
      + txt(ox + (v.w * s) / 2, oy + v.h * s + 24, `${v.w}`) + txt(ox + v.w * s + 10, oy + (v.h * s) / 2 + 6, `${v.h}`, 'start');
  } else if (v.type === 'para') {
    const dx = unitW - v.base;
    body = `<polygon class="fillA" points="${P(dx, 0)} ${P(unitW, 0)} ${P(v.base, v.height)} ${P(0, v.height)}"/>`
      + `<line class="dash" x1="${ox + dx * s}" y1="${oy}" x2="${ox + dx * s}" y2="${oy + v.height * s}"/>`
      + `<polyline class="thin" points="${P(dx, v.height)} ${(ox + dx * s + 10).toFixed(1)},${(oy + v.height * s).toFixed(1)} ${(ox + dx * s + 10).toFixed(1)},${(oy + v.height * s - 10).toFixed(1)} ${P(dx, v.height)}" fill="none"/>`
      + txt(ox + (v.base * s) / 2, oy + v.height * s + 24, `${v.base}`)
      + txt(ox + dx * s + 8, oy + (v.height * s) / 2 + 6, `${v.height}`, 'start', 'class="accent-t"')
      + txt(ox + ((v.base + unitW) / 2) * s + 10, oy + (v.height * s) / 2 + 6, `${v.side}`, 'start');
  } else if (v.type === 'lshape') {
    const { W, H, top, right } = v;
    body = `<polygon class="fillA" points="${P(0, 0)} ${P(top, 0)} ${P(top, H - right)} ${P(W, H - right)} ${P(W, H)} ${P(0, H)}"/>`
      + txt(ox + (top * s) / 2, oy - 10, `${top}`) + txt(ox - 10, oy + (H * s) / 2 + 6, `${H}`, 'end')
      + txt(ox + (W * s) / 2, oy + H * s + 24, `${W}`) + txt(ox + W * s + 10, oy + (H - right / 2) * s + 6, `${right}`, 'start');
  } else {
    const { W, H, w, h } = v, ix = (W - w) / 2, iy = (H - h) / 2;
    body = `<polygon class="fillA" points="${P(0, 0)} ${P(W, 0)} ${P(W, H)} ${P(0, H)}"/>`
      + `<polygon class="fillB" points="${P(ix, iy)} ${P(ix + w, iy)} ${P(ix + w, iy + h)} ${P(ix, iy + h)}"/>`
      + txt(ox + (W * s) / 2, oy + H * s + 24, `${W}`) + txt(ox - 10, oy + (H * s) / 2 + 6, `${H}`, 'end')
      + txt(ox + (W * s) / 2, oy + iy * s + 22, `${w}`) + txt(ox + (ix + w) * s - 8, oy + (H * s) / 2 + 6, `${h}`, 'end');
  }
  return `<div class="visual"><svg ${SVG_STYLE} viewBox="0 0 ${box.w + pad * 2} ${box.h + pad * 2}" aria-label="שרטוט">${body}</svg></div>`;
}
export function hintHTML(h) {
  if (!h) return '';
  if (h.type === 'text') return `<div class="hint">💡 ${fracHTML(h.text)}</div>`;
  if (h.type === 'dots') {
    const total = h.total ?? h.a + h.b;
    const second = h.total !== undefined ? rep('<i class="x"></i>', total - h.a) : rep('<i class="b"></i>', h.b);
    return `<div class="hint">💡 ספרי את העיגולים<div class="dots" style="margin-top:8px">${rep('<i></i>', h.a)}${second}</div></div>`;
  }
  if (h.type === 'takeaway') {
    return `<div class="hint">💡 התחילי מ-${h.a} ${h.b ? `והורידי ${h.b}` : 'וספרי אחורה'}<div class="dots" style="margin-top:8px">${rep('<i></i>', h.a - (h.b || 0))}${rep('<i class="x"></i>', h.b || 0)}</div></div>`;
  }
  if (h.type === 'groups') return `<div class="hint">💡 ${h.groups} קבוצות, ובכל קבוצה ${h.each}${visualHTML({ type: 'groups', groups: h.groups, each: h.each })}</div>`;
  return '';
}

// ---------- question view ----------
const exprSize = (e) => { const n = e.replace(/\s+/g, ' ').length; return n > 24 ? 'xlong' : n > 15 ? 'long' : ''; };
export const showAnswer = (p) => (p.kind === 'number' && Number.isInteger(p.answer) && Math.abs(p.answer) >= 1000 ? p.answer.toLocaleString('en-US') : String(p.answer));

const PRAISE = ['כל הכבוד! 🎉', 'מעולה! ⭐', 'וואו, נכון! 🌟', 'את אלופה! 👑', 'יפה מאוד! 💪', 'בדיוק! ✨'];
export const praise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)];

// Renders one problem with a keypad or choice buttons.
// opts: { maxTries=2, tag, onResult({correct, tries}) , showSpeak }
export function QuestionView(root, opts = {}) {
  const maxTries = opts.maxTries ?? 2;
  let problem, tries, value, locked;

  function render() {
    const big = problem.kind === 'choice' && problem.choices.every((c) => /^[<>=]$/.test(c));
    const words = problem.kind === 'choice' && problem.choices.some((c) => /[א-ת]/.test(c));
    root.innerHTML = `
      <div class="qcard">
        <div class="qtop">
          <span class="tag">${esc(opts.tag || '')}</span>
          <button class="speak hidden" type="button" aria-label="הקראה">🔊</button>
        </div>
        ${problem.prompt ? `<div class="prompt">${fracHTML(problem.prompt)}</div>` : ''}
        ${problem.expr ? `<div class="expr ${exprSize(problem.expr)}" data-expr>${exprHTML(problem.expr)}</div>` : ''}
        ${visualHTML(problem.visual)}
        <div data-hint></div>
        ${problem.kind === 'number' ? `
          <div class="answer"><div class="display empty" data-display aria-live="polite">?</div></div>
          <div class="pad">
            ${[7, 8, 9, 4, 5, 6, 1, 2, 3].map((d) => `<button type="button" data-k="${d}">${d}</button>`).join('')}
            <button type="button" data-k="." ${Number.isInteger(Number(problem.answer)) ? 'style="visibility:hidden"' : ''}>.</button>
            <button type="button" data-k="0">0</button>
            <button type="button" class="del" data-k="del" aria-label="מחיקה">⌫</button>
          </div>
          <div style="max-width:380px;margin:10px auto 0"><button type="button" class="btn green" style="width:100%" data-k="ok">בדיקה ✓</button></div>`
        : `<div class="choices ${big || problem.choices.length === 3 ? 'three' : ''}">
            ${problem.choices.map((c) => `<button type="button" class="${words ? 'word' : ''}" data-choice="${esc(c)}">${fracHTML(c)}</button>`).join('')}
          </div>`}
        <div class="feedback" data-fb aria-live="polite"></div>
      </div>`;
    const sp = $('.speak', root);
    onSpeechReady(() => sp.classList.remove('hidden'));
    sp.onclick = () => speak(spoken(problem));
    root.onclick = (ev) => {
      const k = ev.target.closest('[data-k]')?.dataset.k;
      if (k) return key(k);
      const c = ev.target.closest('[data-choice]');
      if (c && !c.disabled) submit(c.dataset.choice, c);
    };
  }

  function setDisplay(cls) {
    const d = $('[data-display]', root);
    if (!d) return;
    d.textContent = value || '?';
    d.className = 'display' + (value ? '' : ' empty') + (cls ? ' ' + cls : '');
  }
  function key(k) {
    if (locked || problem.kind !== 'number') return;
    if (k === 'ok') return value && submit(value);
    if (k === 'del') value = value.slice(0, -1);
    else if (k === '.') { if (!value.includes('.') && value.length < 6) value = (value || '0') + '.'; }
    else if (value.length < 7) value = value === '0' ? k : value + k;
    setDisplay();
  }

  function finish(correct) {
    locked = true;
    if (problem.expr) $('[data-expr]', root).innerHTML = exprHTML(problem.expr, showAnswer(problem));
    $$('.choices button', root).forEach((b) => (b.disabled = true));
    opts.onResult?.({ correct, tries, problem });
  }

  function submit(v, btn) {
    if (locked) return;
    tries++;
    const ok = check(problem, v);
    const fb = $('[data-fb]', root);
    if (ok) {
      setDisplay('good'); btn?.classList.add('good');
      fb.className = 'feedback good'; fb.textContent = praise();
      return finish(true);
    }
    setDisplay('bad'); btn?.classList.add('bad');
    if (tries < maxTries) {
      fb.className = 'feedback bad'; fb.textContent = 'כמעט! נסי שוב 💪';
      if (problem.hint) $('[data-hint]', root).innerHTML = hintHTML(problem.hint);
      if (btn) btn.disabled = true;
      setTimeout(() => { if (!locked) { value = ''; setDisplay(); } }, 700);
      return;
    }
    fb.className = 'feedback bad';
    fb.innerHTML = `התשובה היא <span class="ltr">${fracHTML(showAnswer(problem))}</span>. נחזור על זה בהמשך 🙂`;
    $$('.choices button', root).forEach((b) => { if (b.dataset.choice === String(problem.answer)) b.classList.add('good'); });
    finish(false);
  }

  function onKey(ev) {
    if (!problem || locked || problem.kind !== 'number' || ev.ctrlKey || ev.metaKey) return;
    if (/^[0-9]$/.test(ev.key)) key(ev.key);
    else if (ev.key === '.' || ev.key === ',') key('.');
    else if (ev.key === 'Backspace') key('del');
    else if (ev.key === 'Enter') key('ok');
    else return;
    ev.preventDefault();
  }
  document.addEventListener('keydown', onKey);

  return {
    show(p) { problem = p; tries = 0; value = ''; locked = false; window.__msCurrent = p; render(); },
    destroy() { document.removeEventListener('keydown', onKey); }
  };
}
