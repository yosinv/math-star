// Math Star engine — pure functions, no DOM. Runs in the browser and in Node tests.
import { registerGrade6, GRADE6_UNITS } from './grade6.js';
//
// A problem looks like:
//   { skill, kind: 'number' | 'choice', prompt, expr, answer, choices?, visual?, hint?, key }
// - prompt: Hebrew instruction (RTL)
// - expr:   math expression shown big and LTR. "a/b" tokens render as stacked fractions,
//           ":" is division (as taught in Israeli schools), "×" is multiplication.
// - answer: number for kind 'number', string for kind 'choice'

export const GRADES = [
  { id: 'K', label: 'גן', color: '#ff9f43' },
  { id: '1', label: 'כיתה א׳', color: '#4cc26a' },
  { id: '2', label: 'כיתה ב׳', color: '#3aa6e8' },
  { id: '3', label: 'כיתה ג׳', color: '#9b6cf0' },
  { id: '4', label: 'כיתה ד׳', color: '#f15f8c' },
  { id: '5', label: 'כיתה ה׳', color: '#16b5a8' },
  { id: '6', label: 'כיתה ו׳', color: '#e8a21c' }
];

export const MAX_LEVEL = 3;
export const LEVEL_UP_STREAK = 4;   // correct answers in a row to move up a level
export const LEVEL_DOWN_MISSES = 2; // misses in a row to move down a level

// ---------- random helpers ----------
export const ri = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));
export const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
export function shuffle(rng, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
const round = (x, d = 4) => Math.round(x * 10 ** d) / 10 ** d;
const fmt = (x) => String(round(x, 4));

const EMOJI = ['🍎', '⭐', '🐞', '🌸', '🐟', '🧁', '🎈', '🦋', '🍓', '💎'];
// Characters for word problems — girls and boys, with verbs that agree.
export const KIDS = [
  ['נועה', 'f'], ['מאיה', 'f'], ['תמר', 'f'], ['יעל', 'f'], ['שירה', 'f'], ['דנה', 'f'], ['ליה', 'f'], ['הילה', 'f'],
  ['איתי', 'm'], ['יונתן', 'm'], ['עומר', 'm'], ['אורי', 'm'], ['דניאל', 'm'], ['נועם', 'm'], ['אלון', 'm'], ['עידו', 'm']
];
// person(rng) -> { n: name, v(fem, masc) } — v picks the form that agrees with the character.
export function person(rng) {
  const [n, g] = pick(rng, KIDS);
  return { n, g, v: (f, m) => (g === 'f' ? f : m) };
}

// ---------- choice builders ----------
export function numberChoices(rng, answer, count = 4) {
  const set = new Set([answer]);
  const big = Math.abs(answer) >= 20;
  const cands = shuffle(rng, [
    answer + 1, answer - 1, answer + 2, answer - 2,
    big ? answer + 10 : answer + 3, big ? answer - 10 : answer - 3,
    Number(String(Math.abs(answer)).split('').reverse().join('')) * Math.sign(answer || 1)
  ]);
  for (const c of cands) {
    if (set.size >= count) break;
    if (Number.isInteger(answer) && !Number.isInteger(c)) continue;
    if (c >= 0) set.add(c);
  }
  let extra = 4;
  while (set.size < count) set.add(answer + extra++);
  return shuffle(rng, [...set].map(String));
}

const fracEq = (a, b) => a[0] * b[1] === b[0] * a[1];
const fracStr = ([n, d]) => `${n}/${d}`;
export function fractionChoices(rng, answer, wrongs, fmtFn = fracStr) {
  const out = [answer];
  for (const w of shuffle(rng, wrongs)) {
    if (out.length >= 4) break;
    if (!(w[0] > 0) || !(w[1] > 0) || !Number.isInteger(w[0]) || !Number.isInteger(w[1])) continue;
    if (out.some((o) => fracEq(o, w))) continue;
    out.push(w);
  }
  let k = 1;
  while (out.length < 4) {
    const w = [answer[0] + k, answer[1]];
    if (!out.some((o) => fracEq(o, w))) out.push(w);
    k++;
  }
  return shuffle(rng, out.map(fmtFn));
}

function num(skill, { prompt, expr = '', answer, visual, hint }) {
  if (!prompt) prompt = /\?(?!\s*$)/.test(expr) ? 'השלימי את המספר החסר' : 'כמה זה?';
  return { skill, kind: 'number', prompt, expr, answer, visual, hint, key: `${skill}|${prompt}|${expr}` };
}
function choice(skill, { prompt = 'בחרי את התשובה', expr = '', answer, choices, visual, hint }) {
  return { skill, kind: 'choice', prompt, expr, answer: String(answer), choices, visual, hint, key: `${skill}|${prompt}|${expr}` };
}

// ---------- skill catalog ----------
// Each skill: id, grade, title, emoji, gen(level, rng) -> problem
export const SKILLS = [];
const skill = (id, grade, title, emoji, gen, opts = {}) => SKILLS.push({ id, grade, title, emoji, gen, ...opts });

// ===== גן =====
skill('k_count', 'K', 'סופרות עד 10', '🔢', (L, r) => {
  const n = L === 1 ? ri(r, 1, 5) : L === 2 ? ri(r, 3, 10) : ri(r, 8, 15);
  const e = pick(r, EMOJI);
  return choice('k_count', { prompt: 'כמה יש?', answer: n, choices: numberChoices(r, n), visual: { type: 'objects', emoji: e, n } });
}, { young: true });

skill('k_more', 'K', 'מי גדול יותר?', '🐘', (L, r) => {
  const max = L === 1 ? 5 : L === 2 ? 10 : 20;
  const a = ri(r, 1, max); let b = ri(r, 1, max); while (b === a) b = ri(r, 1, max);
  return choice('k_more', { prompt: 'איזה מספר גדול יותר?', answer: Math.max(a, b), choices: [String(a), String(b)],
    visual: L === 1 ? { type: 'compare', emoji: pick(r, EMOJI), a, b } : undefined });
}, { young: true });

skill('k_add', 'K', 'מוסיפות ומורידות', '🧺', (L, r) => {
  const e = pick(r, EMOJI);
  if (L === 3) {
    const a = ri(r, 2, 6), b = ri(r, 1, a - 1);
    return choice('k_add', { prompt: 'כמה נשארו?', expr: `${a} − ${b} = ?`, answer: a - b, choices: numberChoices(r, a - b), visual: { type: 'takeaway', emoji: e, a, b } });
  }
  const max = L === 1 ? 5 : 10;
  const a = ri(r, 1, max - 1), b = ri(r, 1, max - a);
  return choice('k_add', { prompt: 'כמה ביחד?', expr: `${a} + ${b} = ?`, answer: a + b, choices: numberChoices(r, a + b), visual: { type: 'groups', emoji: e, a, b } });
}, { young: true });

// ===== כיתה א׳ =====
skill('g1_add10', '1', 'חיבור עד 10', '➕', (L, r) => {
  if (L === 3) { const c = ri(r, 4, 10), a = ri(r, 1, c - 1); return num('g1_add10', { expr: `${a} + ? = ${c}`, answer: c - a, hint: { type: 'dots', a, total: c } }); }
  const max = L === 1 ? 5 : 10; const a = ri(r, 1, max - 1), b = ri(r, 1, max - a);
  return num('g1_add10', { expr: `${a} + ${b} = ?`, answer: a + b, hint: { type: 'dots', a, b } });
});

skill('g1_sub10', '1', 'חיסור עד 10', '➖', (L, r) => {
  const max = L === 1 ? 5 : 10; const a = ri(r, 2, max), b = ri(r, 1, a - 1);
  if (L === 3) return num('g1_sub10', { expr: `${a} − ? = ${a - b}`, answer: b, hint: { type: 'takeaway', a, b: null } });
  return num('g1_sub10', { expr: `${a} − ${b} = ?`, answer: a - b, hint: { type: 'takeaway', a, b } });
});

skill('g1_add20', '1', 'חיבור עד 20', '🧮', (L, r) => {
  if (L === 1) { const a = ri(r, 10, 15), b = ri(r, 1, 19 - a); return num('g1_add20', { expr: `${a} + ${b} = ?`, answer: a + b }); }
  if (L === 2) { const a = ri(r, 5, 9), b = ri(r, 11 - a, 9); return num('g1_add20', { expr: `${a} + ${b} = ?`, answer: a + b, hint: { type: 'text', text: `השלימי קודם ל-10: ${a} + ${10 - a} = 10, ועוד ${b - (10 - a)}` } }); }
  const a = ri(r, 2, 8), b = ri(r, 2, 8), c = ri(r, 1, 20 - a - b > 1 ? 20 - a - b : 1);
  return num('g1_add20', { expr: `${a} + ${b} + ${c} = ?`, answer: a + b + c });
});

skill('g1_sub20', '1', 'חיסור עד 20', '🍪', (L, r) => {
  if (L === 1) { const a = ri(r, 12, 19), b = ri(r, 1, a - 10); return num('g1_sub20', { expr: `${a} − ${b} = ?`, answer: a - b }); }
  const a = ri(r, 11, 18), b = ri(r, a - 9, 9);
  if (L === 3) return num('g1_sub20', { expr: `${a} − ? = ${a - b}`, answer: b });
  return num('g1_sub20', { expr: `${a} − ${b} = ?`, answer: a - b, hint: { type: 'text', text: `ירדי קודם ל-10: ${a} − ${a - 10} = 10, ועוד − ${b - (a - 10)}` } });
});

skill('g1_compare', '1', 'גדול, קטן, שווה', '⚖️', (L, r) => {
  let left, right, lv, rv;
  if (L === 3) {
    const a = ri(r, 2, 9), b = ri(r, 1, 9); lv = a + b; left = `${a} + ${b}`;
    rv = r() < 0.3 ? lv : ri(r, Math.max(1, lv - 3), lv + 3); right = String(rv);
  } else {
    const max = L === 1 ? 20 : 100;
    lv = ri(r, 1, max); rv = r() < 0.2 ? lv : ri(r, 1, max); left = String(lv); right = String(rv);
  }
  const ans = lv > rv ? '>' : lv < rv ? '<' : '=';
  return choice('g1_compare', { prompt: 'איזה סימן מתאים?', expr: `${left} ◻ ${right}`, answer: ans, choices: ['<', '=', '>'] });
});

skill('g1_pattern', '1', 'סדרות מספרים', '🪜', (L, r) => {
  const step = L === 1 ? pick(r, [1, 2]) : L === 2 ? pick(r, [5, 10, -1]) : pick(r, [-2, 3, -5, 4, -10]);
  const start = step < 0 ? ri(r, 30, 60) : ri(r, 0, 20);
  const seq = [0, 1, 2, 3].map((i) => start + i * step);
  const missAt = L === 1 ? 3 : ri(r, 1, 3);
  const shown = seq.map((v, i) => (i === missAt ? '?' : v)).join(',  ');
  return num('g1_pattern', { prompt: 'איזה מספר חסר בסדרה?', expr: shown, answer: seq[missAt] });
});

// ===== כיתה ב׳ =====
skill('g2_add100', '2', 'חיבור עד 100', '🏗️', (L, r) => {
  if (L === 1) { const a = ri(r, 1, 8) * 10 + ri(r, 0, 4), b = ri(r, 1, 9 - Math.floor(a / 10)) * 10 + ri(r, 0, 5); return num('g2_add100', { expr: `${a} + ${b} = ?`, answer: a + b }); }
  const a = ri(r, 1, 7) * 10 + ri(r, 5, 9), b = ri(r, 1, 8 - Math.floor(a / 10)) * 10 + ri(r, 10 - (a % 10), 9);
  if (L === 3) return num('g2_add100', { expr: `${a} + ? = ${a + b}`, answer: b });
  return num('g2_add100', { expr: `${a} + ${b} = ?`, answer: a + b, hint: { type: 'text', text: `עשרות לחוד ואחדות לחוד: ${Math.floor(a / 10) * 10} + ${Math.floor(b / 10) * 10}, ואז ${a % 10} + ${b % 10}` } });
});

skill('g2_sub100', '2', 'חיסור עד 100', '🧱', (L, r) => {
  if (L === 1) { const a = ri(r, 3, 9) * 10 + ri(r, 5, 9), b = ri(r, 1, Math.floor(a / 10) - 1) * 10 + ri(r, 0, a % 10); return num('g2_sub100', { expr: `${a} − ${b} = ?`, answer: a - b }); }
  const a = ri(r, 3, 9) * 10 + ri(r, 0, 4), b = ri(r, 1, Math.floor(a / 10) - 1) * 10 + ri(r, (a % 10) + 1, 9);
  if (L === 3) return num('g2_sub100', { expr: `${a} − ? = ${a - b}`, answer: b });
  return num('g2_sub100', { expr: `${a} − ${b} = ?`, answer: a - b, hint: { type: 'text', text: `אפשר לחסר קודם ${Math.floor(b / 10) * 10} ואחר כך ${b % 10}` } });
});

skill('g2_mult', '2', 'מכירות את הכפל', '✖️', (L, r) => {
  const f = L === 1 ? pick(r, [2, 5, 10]) : L === 2 ? pick(r, [3, 4]) : ri(r, 1, 5);
  const n = ri(r, 1, 10); const [a, b] = r() < 0.5 ? [n, f] : [f, n];
  return num('g2_mult', { expr: `${a} × ${b} = ?`, answer: a * b, hint: { type: 'groups', groups: a, each: b } });
});

skill('g2_double', '2', 'כפול וחצי', '🪞', (L, r) => {
  const max = L === 1 ? 10 : L === 2 ? 20 : 50;
  if (r() < 0.5 || L === 1) { const n = ri(r, 1, max); return num('g2_double', { prompt: `כמה זה פי 2 מ-${n}?`, answer: 2 * n }); }
  const n = ri(r, 1, max / 2) * 2; return num('g2_double', { prompt: `מה החצי של ${n}?`, answer: n / 2 });
});

skill('g2_place', '2', 'עשרות ואחדות', '🔟', (L, r) => {
  if (L === 1) { const n = ri(r, 11, 99); return num('g2_place', { prompt: `כמה עשרות יש במספר ${n}?`, answer: Math.floor(n / 10) }); }
  if (L === 2) { const t = ri(r, 1, 9), o = ri(r, 0, 9); return num('g2_place', { prompt: `${t} עשרות ו-${o} אחדות. איזה מספר זה?`, answer: t * 10 + o }); }
  const h = ri(r, 1, 9), t = ri(r, 0, 9), o = ri(r, 0, 9);
  return num('g2_place', { prompt: `${h} מאות, ${t} עשרות ו-${o} אחדות. איזה מספר זה?`, answer: h * 100 + t * 10 + o });
});

// ===== כיתה ג׳ =====
const tableTier = (L, r) => (L === 1 ? pick(r, [1, 2, 5, 10]) : L === 2 ? pick(r, [3, 4, 6]) : pick(r, [7, 8, 9]));

skill('g3_times', '3', 'לוח הכפל', '🏰', (L, r) => {
  const f = tableTier(L, r), n = ri(r, 2, 10); const [a, b] = r() < 0.5 ? [n, f] : [f, n];
  return num('g3_times', { expr: `${a} × ${b} = ?`, answer: a * b, hint: { type: 'text', text: `${a} × ${b} זה ${a} פעמים ${b}` } });
}, { fact: true });

skill('g3_div', '3', 'חילוק', '🍕', (L, r) => {
  const f = tableTier(L, r), n = ri(r, 2, 10);
  return num('g3_div', { expr: `${f * n} : ${f} = ?`, answer: n, hint: { type: 'text', text: `איזה מספר כפול ${f} נותן ${f * n}?` } });
}, { fact: true });

skill('g3_missing', '3', 'המספר החסר', '🕵️‍♀️', (L, r) => {
  const f = tableTier(L, r), n = ri(r, 2, 10);
  const expr = r() < 0.5 ? `? × ${f} = ${f * n}` : `${f} × ? = ${f * n}`;
  return num('g3_missing', { expr, answer: n });
});

skill('g3_add1000', '3', 'חיבור וחיסור עד 1000', '🗼', (L, r) => {
  if (L === 1) {
    const a = ri(r, 150, 899); let b = ri(r, 1, 9) * (r() < 0.5 ? 10 : 100); while (b >= a) b = ri(r, 1, 9) * 10;
    if (a + b <= 999 && r() < 0.6) return num('g3_add1000', { expr: `${a} + ${b} = ?`, answer: a + b });
    return num('g3_add1000', { expr: `${a} − ${b} = ?`, answer: a - b });
  }
  if (L === 2) { const a = ri(r, 120, 600), b = ri(r, 35, 380); return num('g3_add1000', { expr: `${a} + ${b} = ?`, answer: a + b }); }
  const a = ri(r, 300, 950), b = ri(r, 105, a - 50); return num('g3_add1000', { expr: `${a} − ${b} = ?`, answer: a - b });
});

skill('g3_word', '3', 'בעיות מילוליות', '📖', (L, r) => {
  const p = person(r), g = p.n, v = p.v;
  if (L === 1) {
    if (r() < 0.5) { const a = ri(r, 8, 30), b = ri(r, 5, 25); return num('g3_word', { prompt: `בכיתה של ${g} יש ${a} בנות ו-${b} בנים. כמה ילדים יש בכיתה?`, answer: a + b }); }
    const a = ri(r, 15, 60), b = ri(r, 3, a - 2); return num('g3_word', { prompt: `ל${g} היו ${a} מדבקות. ${v('היא נתנה', 'הוא נתן')} ${b} ${v('לחברה', 'לחבר')}. כמה מדבקות נשארו ${v('לה', 'לו')}?`, answer: a - b });
  }
  if (L === 2) {
    const a = ri(r, 2, 9), b = ri(r, 3, 9);
    if (r() < 0.5) return num('g3_word', { prompt: `בכל קופסה יש ${b} עפרונות. כמה עפרונות יש ב-${a} קופסאות?`, answer: a * b });
    return num('g3_word', { prompt: `${g} ${v('חילקה', 'חילק')} ${a * b} עוגיות שווה בשווה ל-${a} ${v('חברות', 'חברים')}. כמה עוגיות ${v('קיבלה כל חברה', 'קיבל כל חבר')}?`, answer: b });
  }
  const a = ri(r, 3, 8), b = ri(r, 4, 10), c = ri(r, 2, a * b - 1);
  return num('g3_word', { prompt: `${g} ${v('קנתה', 'קנה')} ${a} חבילות, ובכל חבילה ${b} מדבקות. ${v('היא נתנה', 'הוא נתן')} ${c} מדבקות ${v('לאחותה', 'לאחיו')}. כמה מדבקות נשארו ל${g}?`, answer: a * b - c });
});

// ===== כיתה ד׳ =====
skill('g4_mult', '4', 'כפל במאונך', '🚀', (L, r) => {
  const a = L === 1 ? ri(r, 11, 34) : L === 2 ? ri(r, 12, 99) : ri(r, 102, 499);
  const b = L === 1 ? ri(r, 2, 3) : ri(r, 3, 9);
  return num('g4_mult', { expr: `${a} × ${b} = ?`, answer: a * b, hint: { type: 'text', text: `פרקי: ${a} = ${a - (a % 10)} + ${a % 10}` } });
});

skill('g4_divrem', '4', 'חילוק עם שארית', '🧁', (L, r) => {
  if (L === 1) { const d = ri(r, 2, 6), q = ri(r, 11, 25); return num('g4_divrem', { expr: `${d * q} : ${d} = ?`, answer: q }); }
  if (L === 3) { const d = ri(r, 3, 9), q = ri(r, 21, 99); return num('g4_divrem', { expr: `${d * q} : ${d} = ?`, answer: q }); }
  const d = ri(r, 3, 9), q = ri(r, 3, 12), rem = ri(r, 1, d - 1), n = d * q + rem;
  const s = (qq, rr) => `${qq} ושארית ${rr}`;
  const opts = [s(q, rem), s(q + 1, rem), s(q, rem === 1 ? 2 : rem - 1), s(q - 1, rem + d > n ? 0 : rem + d)];
  return choice('g4_divrem', { expr: `${n} : ${d} = ?`, answer: s(q, rem), choices: shuffle(r, [...new Set(opts)]) });
});

skill('g4_order', '4', 'סדר פעולות', '🎯', (L, r) => {
  const a = ri(r, 2, 9), b = ri(r, 2, 9), c = ri(r, 2, 9), d = ri(r, 2, 6);
  if (L === 1) return num('g4_order', { expr: `${a} + ${b} × ${c} = ?`, answer: a + b * c, hint: { type: 'text', text: 'כפל וחילוק לפני חיבור וחיסור' } });
  if (L === 2) return r() < 0.5
    ? num('g4_order', { expr: `(${a} + ${b}) × ${c} = ?`, answer: (a + b) * c, hint: { type: 'text', text: 'קודם מה שבסוגריים' } })
    : (() => { const x = b * c + ri(r, 1, 20); return num('g4_order', { expr: `${x} − ${b} × ${c} = ?`, answer: x - b * c, hint: { type: 'text', text: 'כפל לפני חיסור' } }); })();
  return num('g4_order', { expr: `${a} × ${b} + ${c * d} : ${d} = ?`, answer: a * b + c, hint: { type: 'text', text: 'כפל וחילוק קודם, ואז חיבור' } });
});

skill('g4_frac_cmp', '4', 'משווות שברים', '🍰', (L, r) => {
  let A, B;
  if (L === 1) { const d = ri(r, 3, 10); const x = ri(r, 1, d - 1); let y = ri(r, 1, d - 1); if (r() < 0.15) y = x; A = [x, d]; B = [y, d]; }
  else if (L === 2) { const n = ri(r, 1, 4); const x = ri(r, n + 1, 10); let y = ri(r, n + 1, 10); if (r() < 0.15) y = x; A = [n, x]; B = [n, y]; }
  else { const d = pick(r, [2, 3, 4, 5]); const k = pick(r, [2, 3]); const x = ri(r, 1, d - 1); A = [x, d]; const y = r() < 0.25 ? x * k : ri(r, 1, d * k - 1); B = [y, d * k]; }
  const lhs = A[0] * B[1], rhs = B[0] * A[1];
  return choice('g4_frac_cmp', { prompt: 'איזה סימן מתאים?', expr: `${fracStr(A)} ◻ ${fracStr(B)}`, answer: lhs > rhs ? '>' : lhs < rhs ? '<' : '=', choices: ['<', '=', '>'] });
});

skill('g4_frac_of', '4', 'שבר מכמות', '🍬', (L, r) => {
  const [n, d] = L === 1 ? [1, pick(r, [2, 3, 4])] : L === 2 ? [1, pick(r, [5, 6, 10])] : pick(r, [[2, 3], [3, 4], [2, 5], [3, 5]]);
  const total = d * ri(r, 2, 10);
  return num('g4_frac_of', { prompt: `כמה זה ${n}/${d} מ-${total}?`, answer: (total / d) * n, hint: { type: 'text', text: `קודם ${total} : ${d} = ${total / d}${n > 1 ? `, ואז כפול ${n}` : ''}` } });
});

// ===== כיתה ה׳ =====
skill('g5_frac_add', '5', 'חיבור וחיסור שברים', '🧩', (L, r) => {
  if (L === 3) {
    const d = pick(r, [2, 3, 4, 5]), k = pick(r, [2, 3]), D = d * k;
    const a = ri(r, 1, d - 1), b = ri(r, 1, D - 1);
    const ans = [a * k + b, D];
    return choice('g5_frac_add', { expr: `${a}/${d} + ${b}/${D} = ?`, answer: fracStr(ans),
      choices: fractionChoices(r, ans, [[a + b, d + D], [a + b, D], [ans[0] + 1, D], [ans[0] - 1, D]]),
      hint: { type: 'text', text: `הרחיבי: ${a}/${d} = ${a * k}/${D}` } });
  }
  const d = ri(r, 3, 12), a = ri(r, 1, d - 1), b = ri(r, 1, d - 1);
  if (L === 2 && a !== b) {
    const [x, y] = a > b ? [a, b] : [b, a]; const ans = [x - y, d];
    return choice('g5_frac_add', { expr: `${x}/${d} − ${y}/${d} = ?`, answer: fracStr(ans),
      choices: fractionChoices(r, ans, [[x - y, 0], [x + y, d], [x - y + 1, d], [x - y, d * 2]]) });
  }
  const ans = [a + b, d];
  return choice('g5_frac_add', { expr: `${a}/${d} + ${b}/${d} = ?`, answer: fracStr(ans),
    choices: fractionChoices(r, ans, [[a + b, d + d], [a + b + 1, d], [a + b - 1, d], [a * b, d]]),
    hint: { type: 'text', text: 'כשהמכנה שווה — מחברים רק את המונים' } });
});

skill('g5_dec', '5', 'מספרים עשרוניים', '💧', (L, r) => {
  if (L === 1) { const a = ri(r, 1, 50) / 10, b = ri(r, 1, 9 - Math.round((a * 10) % 10)) / 10; return num('g5_dec', { expr: `${fmt(a)} + ${fmt(b)} = ?`, answer: round(a + b) }); }
  if (L === 2) {
    const a = ri(r, 11, 89) / 10, b = ri(r, 11, 59) / 10;
    if (r() < 0.5) return num('g5_dec', { expr: `${fmt(a)} + ${fmt(b)} = ?`, answer: round(a + b) });
    const [x, y] = a > b ? [a, b] : [b, a]; return num('g5_dec', { expr: `${fmt(x)} − ${fmt(y)} = ?`, answer: round(x - y) });
  }
  const a = ri(r, 101, 899) / 100, b = ri(r, 11, 99) / 10;
  if (r() < 0.5) return num('g5_dec', { expr: `${fmt(a)} + ${fmt(b)} = ?`, answer: round(a + b), hint: { type: 'text', text: 'סדרי את הנקודות אחת מתחת לשנייה' } });
  const [x, y] = a > b ? [a, b] : [b, a];
  return num('g5_dec', { expr: `${fmt(x)} − ${fmt(y)} = ?`, answer: round(x - y), hint: { type: 'text', text: 'סדרי את הנקודות אחת מתחת לשנייה' } });
});

skill('g5_mult2', '5', 'כפל דו-ספרתי', '🛸', (L, r) => {
  const a = ri(r, 12, 99);
  const b = L === 1 ? ri(r, 1, 9) * 10 : L === 2 ? ri(r, 11, 19) : ri(r, 21, 99);
  return num('g5_mult2', { expr: `${a} × ${b} = ?`, answer: a * b, hint: { type: 'text', text: `${a} × ${b} = ${a} × ${b - (b % 10)} + ${a} × ${b % 10}` } });
});

skill('g5_divis', '5', 'סימני התחלקות', '🔍', (L, r) => {
  const d = L === 1 ? pick(r, [2, 5, 10]) : L === 2 ? pick(r, [3, 9]) : pick(r, [4, 6]);
  const yes = r() < 0.5;
  let n = d * ri(r, 12, 120);
  if (!yes) n += ri(r, 1, d - 1);
  const tips = { 2: 'ספרת האחדות זוגית', 5: 'ספרת האחדות 0 או 5', 10: 'ספרת האחדות 0', 3: 'סכום הספרות מתחלק ב-3', 9: 'סכום הספרות מתחלק ב-9', 4: 'שתי הספרות האחרונות מתחלקות ב-4', 6: 'מתחלק גם ב-2 וגם ב-3' };
  return choice('g5_divis', { prompt: `האם ${n} מתחלק ב-${d} בלי שארית?`, answer: yes ? 'כן' : 'לא', choices: ['כן', 'לא'], hint: { type: 'text', text: tips[d] } });
});

// ===== כיתה ו׳ — aligned with the class review booklet (see grade6.js) =====
registerGrade6({ skill, ri, pick, shuffle, num, choice, numberChoices, fractionChoices, gcd, round, fmt, person,
  generateAgain: (id, L, r) => SKILLS.find((x) => x.id === id).gen(L, r) });

export const SKILL_BY_ID = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
export const skillsForGrade = (grade) => SKILLS.filter((s) => s.grade === grade);
// Core skills drive missions and exam mode; "extra" ones are shown but not pushed.
export const coreSkills = (grade) => skillsForGrade(grade).filter((s) => !s.extra);
export const UNITS = { '6': GRADE6_UNITS };
export const gradeInfo = (grade) => GRADES.find((g) => g.id === grade) || GRADES[0];

export function generate(skillId, level = 1, rng = Math.random) {
  const s = SKILL_BY_ID[skillId];
  if (!s) throw new Error('unknown skill ' + skillId);
  const L = Math.min(MAX_LEVEL, Math.max(1, level));
  return { ...s.gen(L, rng), level: L };
}

// Generate a round of n problems without exact repeats.
export function generateRound(skillId, level, n = 10, rng = Math.random) {
  const out = []; const seen = new Set(); let guard = 0;
  while (out.length < n && guard++ < n * 20) {
    const p = generate(skillId, level, rng);
    if (seen.has(p.key) && guard < n * 15) continue;
    seen.add(p.key); out.push(p);
  }
  return out;
}

// ---------- answer checking ----------
export function parseNumberInput(input) {
  const s = String(input ?? '').trim().replace(',', '.').replace(/[−–]/g, '-');
  if (!/^-?\d*\.?\d+$|^-?\d+\.$/.test(s)) return null;
  return Number(s);
}

export function check(problem, input) {
  if (problem.kind === 'choice') return String(input) === String(problem.answer);
  const v = parseNumberInput(input);
  return v !== null && Math.abs(v - Number(problem.answer)) < 1e-6;
}

// ---------- adaptivity / mastery ----------
export function newSkillStats() {
  return { level: 1, cleared: 0, streak: 0, misses: 0, seen: 0, correct: 0, hist: [], last: null };
}

// Apply one answer to a skill's stats. Returns { stats, levelUp, levelDown, cleared }.
export function applyAnswer(prev, correct, now = Date.now()) {
  const s = { ...newSkillStats(), ...prev, hist: [...(prev?.hist || []), correct ? 1 : 0].slice(-20) };
  s.seen++; s.last = now;
  let levelUp = false, levelDown = false, cleared = false;
  if (correct) {
    s.correct++; s.streak++; s.misses = 0;
    if (s.streak >= LEVEL_UP_STREAK) {
      if (s.cleared < s.level) { s.cleared = s.level; cleared = true; }
      if (s.level < MAX_LEVEL) { s.level++; levelUp = true; }
      s.streak = 0;
    }
  } else {
    s.streak = 0; s.misses++;
    if (s.misses >= LEVEL_DOWN_MISSES && s.level > 1) { s.level--; s.misses = 0; levelDown = true; }
  }
  return { stats: s, levelUp, levelDown, cleared };
}

export const stars = (stats) => (stats ? stats.cleared || 0 : 0);
export function accuracy(stats, last = 10) {
  const h = (stats?.hist || []).slice(-last);
  return h.length ? h.reduce((a, b) => a + b, 0) / h.length : null;
}

// Pick the skill to practice next: first in grade order that isn't fully cleared,
// preferring one that is struggling (low recent accuracy).
export function nextSkill(grade, skillStats = {}) {
  const list = coreSkills(grade);
  const struggling = list.find((s) => { const a = accuracy(skillStats[s.id], 6); return a !== null && a < 0.6 && (skillStats[s.id].hist || []).length >= 4; });
  if (struggling) return struggling.id;
  const open = list.find((s) => stars(skillStats[s.id]) < MAX_LEVEL);
  return (open || list[0]).id;
}

export function weakestSkill(grade, skillStats = {}) {
  let best = null, bestAcc = 2;
  for (const s of coreSkills(grade)) {
    const a = accuracy(skillStats[s.id]);
    if (a !== null && a < bestAcc) { best = s.id; bestAcc = a; }
  }
  return best;
}

// ---------- rewards ----------
export const XP_FIRST_TRY = 10;
export const XP_SECOND_TRY = 5;
export const XP_PER_LEVEL = 120;
export const playerLevel = (xp) => Math.floor(xp / XP_PER_LEVEL) + 1;
export const levelProgress = (xp) => xp % XP_PER_LEVEL;

// ---------- homework parser ----------
// Supports one exercise per line:
//   7 × 8            12 + 7 =          56 : 7          (3 + 4) × 2
//   3/4 + 1/4        7 × ? = 56        question text | answer
// Returns { items: problem[], errors: [{line, text, reason}] }
const OPS = { '+': 1, '-': 1, '*': 2, '/': 2 };

function tokenize(src) {
  const t = []; let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === ' ') { i++; continue; }
    if (/[0-9.]/.test(c)) { let j = i; while (j < src.length && /[0-9.]/.test(src[j])) j++; const s = src.slice(i, j); if ((s.match(/\./g) || []).length > 1) throw new Error('bad number'); t.push({ t: 'n', v: s }); i = j; continue; }
    if (c === '?') { t.push({ t: 'x' }); i++; continue; }
    if ('+-*/()'.includes(c)) { t.push({ t: c }); i++; continue; }
    throw new Error('bad char ' + c);
  }
  return t;
}

// Exact rational arithmetic on [n, d] with integer n, d (d > 0).
const R = {
  of(str) { if (!str.includes('.')) return [Number(str), 1]; const [w, f] = str.split('.'); const d = 10 ** f.length; return R.norm([Number(w || 0) * d + Number(f || 0), d]); },
  norm([n, d]) { if (d === 0) throw new Error('div0'); if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return [n / g, d / g]; },
  add: (a, b) => R.norm([a[0] * b[1] + b[0] * a[1], a[1] * b[1]]),
  sub: (a, b) => R.norm([a[0] * b[1] - b[0] * a[1], a[1] * b[1]]),
  mul: (a, b) => R.norm([a[0] * b[0], a[1] * b[1]]),
  div: (a, b) => { if (b[0] === 0) throw new Error('div0'); return R.norm([a[0] * b[1], a[1] * b[0]]); }
};

function evalTokens(tokens, x) {
  let i = 0;
  const peek = () => tokens[i];
  function primary() {
    const tk = tokens[i++];
    if (!tk) throw new Error('unexpected end');
    if (tk.t === 'n') return R.of(tk.v);
    if (tk.t === 'x') { if (x === undefined) throw new Error('unknown'); return x; }
    if (tk.t === '-') return R.sub([0, 1], primary());
    if (tk.t === '(') { const v = expr(); if (!tokens[i] || tokens[i++].t !== ')') throw new Error('missing )'); return v; }
    throw new Error('unexpected ' + tk.t);
  }
  function term() { let v = primary(); while (peek() && (peek().t === '*' || peek().t === '/')) { const op = tokens[i++].t; const r = primary(); v = op === '*' ? R.mul(v, r) : R.div(v, r); } return v; }
  function expr() { let v = term(); while (peek() && (peek().t === '+' || peek().t === '-')) { const op = tokens[i++].t; const r = term(); v = op === '+' ? R.add(v, r) : R.sub(v, r); } return v; }
  const v = expr();
  if (i !== tokens.length) throw new Error('trailing');
  return v;
}

export function evaluateExpression(src) {
  return evalTokens(tokenize(normalizeExpr(src)));
}

function normalizeExpr(s) {
  s = s.replace(/\b\d{1,3}(?:,\d{3})+(?![\d,])/g, (m) => (m.startsWith('0,') ? m : m.replace(/,/g, '')));
  return s.replace(/[×xX*·]/g, '*').replace(/[÷:]/g, '/').replace(/[−–—]/g, '-').replace(/,/g, '.');
}
function displayExpr(s) {
  return s.replace(/\s+/g, ' ').trim()
    .replace(/\s*[×xX*·]\s*/g, ' × ').replace(/\s*[÷:]\s*/g, ' : ')
    .replace(/(\S)\s*[-−–—]\s*/g, '$1 − ').replace(/\s*\+\s*/g, ' + ')
    .replace(/\s*=\s*/g, ' = ').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').trim();
}

function answerFromRational(skill, prompt, expr, q) {
  const [n, d] = q;
  const terminating = (() => { let dd = d; for (const p of [2, 5]) while (dd % p === 0) dd /= p; return dd === 1; })();
  if (d === 1 || (terminating && String(n / d).split('.')[1]?.length <= 3)) {
    return num(skill, { prompt, expr, answer: n / d });
  }
  const ans = [n, d];
  return choice(skill, { prompt, expr, answer: fracStr(ans), choices: fractionChoices(Math.random, ans, [[n + 1, d], [n - 1, d], [n, d + 1], [d, n]]) });
}

export function parseHomework(text) {
  const items = [], errors = [];
  const lines = String(text || '').split(/\r?\n/);
  lines.forEach((raw, idx) => {
    const line = raw.trim();
    if (!line) return;
    try {
      if (line.includes('|')) {
        const [q, a] = line.split('|').map((s) => s.trim());
        if (!q || !a) throw new Error('need question | answer');
        const fm = a.match(/^(\d+)\s*\/\s*(\d+)$/);
        if (fm) {
          const ans = [Number(fm[1]), Number(fm[2])];
          if (!ans[1]) throw new Error('bad fraction');
          items.push(choice('homework', { prompt: q, answer: fracStr(ans), choices: fractionChoices(Math.random, ans, [[ans[0] + 1, ans[1]], [ans[0] - 1, ans[1]], [ans[1], ans[0]], [ans[0], ans[1] + 1]]) }));
          return;
        }
        const v = parseNumberInput(a);
        if (v === null) throw new Error('answer must be a number or a fraction');
        items.push(num('homework', { prompt: q, answer: v }));
        return;
      }
      let src = line.replace(/[؟]/g, '?');
      if (!src.includes('=')) src = src.replace(/\?\s*$/, '');
      src = src.replace(/=\s*\?\s*$/, '').replace(/=\s*$/, '').trim();
      const qCount = (src.match(/\?/g) || []).length;
      if (src.includes('=') && qCount === 1) {
        const [lhs, rhs, ...rest] = src.split('=');
        if (rest.length) throw new Error('too many =');
        const lt = tokenize(normalizeExpr(lhs)), rt = tokenize(normalizeExpr(rhs));
        const f = (X) => R.sub(evalTokens(lt, X), evalTokens(rt, X));
        const holds = (X) => { try { return f(X)[0] === 0; } catch { return false; } };
        // The blank appears once, so try solving as a linear equation first (exact, handles decimals).
        try {
          const f0 = f([0, 1]), slope = R.sub(f([1, 1]), f0);
          if (slope[0] !== 0) {
            const X = R.div(R.sub([0, 1], f0), slope);
            if (holds(X) && X[0] >= 0) { items.push(answerFromRational('homework', 'מה המספר החסר?', displayExpr(src), X)); return; }
          }
        } catch { /* blank is a divisor: fall through to search */ }
        for (let x = 1; x <= 100000; x++) {
          if (holds([x, 1])) { items.push(num('homework', { prompt: 'מה המספר החסר?', expr: displayExpr(src), answer: x })); return; }
        }
        throw new Error('no answer found');
      }
      if (!src || qCount > 0 || src.includes('=')) throw new Error('could not read');
      const tokens = tokenize(normalizeExpr(src));
      if (!tokens.some((t) => OPS[t.t])) throw new Error('no operation');
      const q = evalTokens(tokens);
      items.push(answerFromRational('homework', 'כמה זה?', `${displayExpr(src)} = ?`, q));
    } catch (e) {
      errors.push({ line: idx + 1, text: line, reason: e.message });
    }
  });
  return { items, errors };
}

// ---------- spoken text (Hebrew TTS) ----------
export function spoken(problem) {
  const e = (problem.expr || '')
    .replace(/(\d+)\/(\d+)/g, '$1 חלקי $2')
    .replace(/\+/g, ' ועוד ').replace(/−/g, ' פחות ').replace(/×/g, ' כפול ').replace(/ : /g, ' לחלק ל ')
    .replace(/=/g, ' שווה ').replace(/\?/g, ' כמה ').replace(/◻/g, ' מול ');
  return [problem.prompt, e].filter(Boolean).join('. ');
}
