// Grade 4 track, aligned topic-by-topic with the class test notice
// ("מבחן במתמטיקה – כיתה ד׳": topics 1–13).
// Every generator makes fresh numbers each time, so the practice transfers to the test.
// Skill ids that existed before (g4_mult, g4_divrem, g4_order, g4_frac_cmp, g4_frac_of)
// are kept, so progress already saved on them carries over.

export const GRADE4_UNITS = [
  { id: '1', title: 'מספרים ופעולות חשבון' },
  { id: '2', title: 'שברים' },
  { id: '3', title: 'גיאומטריה' },
  { id: 'x', title: 'בהמשך השנה' }
];

// The notice's own topic list (number → title), used by the test page.
export const GRADE4_TOPICS = [
  ['1', 'מספרים שלמים עד 1,000,000'],
  ['2', 'ערך הספרה לפי מיקומה'],
  ['3', 'ארבע פעולות החשבון'],
  ['4', 'כפל בעשרות ובמאות שלמות'],
  ['5', 'סדרות במספרים'],
  ['6', 'סדר פעולות חשבון'],
  ['7', 'מספרים על ישר המספרים'],
  ['8', 'אי-שוויונות במספרים שלמים'],
  ['9', 'בעיות מילוליות במספרים שלמים'],
  ['10', 'משמעות השבר: מונה ומכנה'],
  ['11', 'שמות שונים לשבר'],
  ['12', 'היקף ושטח של ריבוע ומלבן'],
  ['13', 'אלכסונים, צלעות מקבילות וצלעות סמוכות']
];

export function registerGrade4(h) {
  const { skill, ri, pick, shuffle, num, choice, numberChoices, fractionChoices, fracStr, person } = h;
  const N = (x) => (Number.isInteger(x) && Math.abs(x) >= 1000 ? x.toLocaleString('en-US') : String(x));
  const S = (id, topic, unit, title, emoji, gen, extra = {}) => skill(id, '4', title, emoji, gen, { topic, unit, ...extra });
  const TF = ['נכון', 'לא נכון'];
  const PLACES = ['אחדות', 'עשרות', 'מאות', 'אלפים', 'עשרות אלפים', 'מאות אלפים']; // index = power of 10
  const PLACE_THE = ['האחדות', 'העשרות', 'המאות', 'האלפים', 'עשרות האלפים', 'מאות האלפים']; // "במקום ___"
  const digitsOf = (n) => String(n).split('').map(Number);
  // A 6-digit number whose digits are all different (so "the digit 7" is unambiguous).
  const distinct6 = (r) => { const d = shuffle(r, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]); if (d[0] === 0) [d[0], d[1]] = [d[1], d[0]]; return Number(d.slice(0, 6).join('')); };
  const numChoicesN = (r, ans, wrongs) => shuffle(r, [...new Set([ans, ...wrongs].filter((x) => Number.isInteger(x) && x >= 0))].slice(0, 4)).map(N);

  // ===================== 1 · מספרים שלמים עד 1,000,000 =====================
  S('g4_big', '1', '1', 'מספרים עד מיליון', '🔢', (L, r) => {
    const id = 'g4_big';
    if (L === 1) {
      if (r() < 0.5) {
        // Expanded form with some empty places, digits 2–9 so the wording reads naturally.
        const powers = shuffle(r, [5, 4, 3, 2, 1, 0]).slice(0, ri(r, 3, 4)).sort((a, b) => b - a);
        if (!powers.includes(5)) powers[0] = 5;
        let total = 0; const parts = [];
        for (const p of [...new Set(powers)].sort((a, b) => b - a)) { const d = ri(r, 2, 9); total += d * 10 ** p; parts.push(`${d} ${PLACES[p]}`); }
        const text = parts.length > 1 ? parts.slice(0, -1).join(', ') + ' ו-' + parts.at(-1) : parts[0];
        return num(id, { prompt: `איזה מספר זה? ${text}`, answer: total, hint: { type: 'text', text: 'כתבי ספרה לכל מקום, ו-0 במקומות שחסרים' } });
      }
      const base = pick(r, [10000, 40000, 100000, 250000, 600000, 1000000]);
      if (r() < 0.5 || base === 1000000) return num(id, { prompt: `איזה מספר בא לפני ${N(base)}?`, answer: base - 1 });
      return num(id, { prompt: `איזה מספר בא אחרי ${N(base - 1)}?`, answer: base });
    }
    if (L === 2) {
      if (r() < 0.35) {
        const [q, a] = pick(r, [['המספר הקטן ביותר בן 6 ספרות', 100000], ['המספר הגדול ביותר בן 6 ספרות', 999999], ['המספר הקטן ביותר בן 5 ספרות', 10000], ['המספר הגדול ביותר בן 5 ספרות', 99999], ['המספר הקטן ביותר בן 7 ספרות', 1000000]]);
        return num(id, { prompt: `מהו ${q}?`, answer: a });
      }
      // Which is the largest/smallest? Same digits in different orders.
      const n = distinct6(r), d = digitsOf(n);
      const variants = new Set([n]);
      while (variants.size < 4) { const x = [...d]; const i = ri(r, 1, 5), j = ri(r, 1, 5); [x[i], x[j]] = [x[j], x[i]]; if (x[0] !== 0) variants.add(Number(x.join(''))); }
      const list = [...variants]; const big = r() < 0.5;
      const ans = big ? Math.max(...list) : Math.min(...list);
      return choice(id, { prompt: `איזה מספר ${big ? 'הגדול' : 'הקטן'} ביותר?`, answer: N(ans), choices: shuffle(r, list.map(N)), hint: { type: 'text', text: 'משווים ספרה-ספרה משמאל, החל מהמקום הגבוה ביותר' } });
    }
    if (r() < 0.6) {
      const ds = shuffle(r, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 5);
      if (!ds.includes(0) && r() < 0.6) ds[ri(r, 0, 4)] = 0;
      const desc = [...ds].sort((a, b) => b - a), asc = [...ds].sort((a, b) => a - b);
      if (asc[0] === 0) { const k = asc.findIndex((x) => x !== 0); [asc[0], asc[k]] = [asc[k], asc[0]]; }
      const big = r() < 0.5;
      return num(id, { prompt: `השתמשי בכל הספרות ${ds.join(', ')} (כל ספרה פעם אחת). מהו המספר ה${big ? 'גדול' : 'קטן'} ביותר?`, answer: Number((big ? desc : asc).join('')), hint: { type: 'text', text: big ? 'הספרה הגדולה ביותר במקום הכי שמאלי' : 'המספר לא יכול להתחיל ב-0' } });
    }
    const n = ri(r, 100000, 999999), [unitName, u] = pick(r, [['אלפים שלמים', 1000], ['מאות שלמות', 100], ['עשרות שלמות', 10]]);
    return num(id, { prompt: `כמה ${unitName} יש במספר ${N(n)}?`, answer: Math.floor(n / u), hint: { type: 'text', text: `מכסים את ${String(u).length - 1} הספרות הימניות` } });
  });

  // ===================== 2 · ערך הספרה לפי מיקומה =====================
  S('g4_place', '2', '1', 'ערך הספרה', '🏷️', (L, r) => {
    const id = 'g4_place';
    const n = distinct6(r), d = digitsOf(n);
    if (L === 1) {
      const idx = pick(r, [0, 1, 2, 3, 4].filter((i) => d[i] !== 0)); const dig = d[idx]; const power = 5 - idx; const val = dig * 10 ** power;
      const wrong = shuffle(r, [0, 1, 2, 3, 4, 5].filter((p) => p !== power)).slice(0, 3).map((p) => dig * 10 ** p);
      return choice(id, { prompt: `מה ערך הספרה ${dig} במספר ${N(n)}?`, answer: N(val), choices: numChoicesN(r, val, wrong), hint: { type: 'text', text: 'אחדות, עשרות, מאות, אלפים, עשרות אלפים, מאות אלפים — מימין לשמאל' } });
    }
    if (L === 2) { const p = ri(r, 0, 5); return num(id, { prompt: `איזו ספרה נמצאת במקום ${PLACE_THE[p]} במספר ${N(n)}?`, answer: d[5 - p] }); }
    const [txt, add] = pick(r, [['נוסיף לו 10,000', 10000], ['נוסיף לו 1,000', 1000], ['נוסיף לו 100', 100], ['נחסיר ממנו 1,000', -1000], ['נחסיר ממנו 10,000', -10000], ['נוסיף לו 100,000', 100000]]);
    let m = ri(r, 120000, 880000);
    if (r() < 0.5) m = m - (m % (Math.abs(add) * 10)) + 9 * Math.abs(add) + ri(r, 0, Math.abs(add) - 1); // makes the step carry over
    if (m + add < 0 || m + add > 999999) m = 500000 + ri(r, 0, 9999);
    return num(id, { prompt: `מה יהיה המספר ${N(m)} אם ${txt}?`, answer: m + add, hint: { type: 'text', text: 'שימי לב איזו ספרה משתנה — ומה קורה כשהיא עוברת את 9' } });
  });

  // ===================== 3 · ארבע פעולות החשבון =====================
  S('g4_addsub', '3', '1', 'חיבור וחיסור', '➕', (L, r) => {
    const id = 'g4_addsub', hint = { type: 'text', text: 'מסדרים אחדות מתחת לאחדות, ומתחילים מימין' };
    if (L === 1) {
      if (r() < 0.5) { const a = ri(r, 1200, 5999), b = ri(r, 1100, 9999 - a); return num(id, { prompt: 'חשבי במאונך', expr: `${N(a)} + ${N(b)} = ?`, answer: a + b, hint }); }
      const a = ri(r, 3000, 9999), b = ri(r, 1000, a - 200); return num(id, { prompt: 'חשבי במאונך', expr: `${N(a)} − ${N(b)} = ?`, answer: a - b, hint });
    }
    if (L === 2) {
      const t = ri(r, 0, 2);
      if (t === 0) { const a = ri(r, 12000, 59999), b = ri(r, 11000, 99999 - a); return num(id, { prompt: 'חשבי במאונך', expr: `${N(a)} + ${N(b)} = ?`, answer: a + b, hint }); }
      if (t === 1) { const a = pick(r, [10000, 20000, 40000, 50000, 7000, 8005, 30020]), b = ri(r, 1111, a - 500); return num(id, { prompt: 'חשבי במאונך (שימי לב לאפסים)', expr: `${N(a)} − ${N(b)} = ?`, answer: a - b, hint: { type: 'text', text: 'כשאין ממה לפרוט — פורטים מהספרה הראשונה שאינה 0' } }); }
      const a = ri(r, 20000, 99999), b = ri(r, 10000, a - 1000); return num(id, { prompt: 'חשבי במאונך', expr: `${N(a)} − ${N(b)} = ?`, answer: a - b, hint });
    }
    const t = ri(r, 0, 2);
    if (t === 0) { const a = ri(r, 120000, 600000), b = ri(r, 100000, 999999 - a); return num(id, { prompt: 'חשבי במאונך', expr: `${N(a)} + ${N(b)} = ?`, answer: a + b, hint }); }
    if (t === 1) { const a = ri(r, 300000, 1000000), b = ri(r, 100000, a - 10000); return num(id, { prompt: 'חשבי במאונך', expr: `${N(a)} − ${N(b)} = ?`, answer: a - b, hint }); }
    const tot = pick(r, [100000, 250000, 400000, 500000, 1000000]), x = ri(r, 12, tot / 1000 - 5) * 1000 + pick(r, [0, 0, 500, 250]);
    return num(id, { prompt: 'השלימי את המספר החסר', expr: `? + ${N(tot - x)} = ${N(tot)}`, answer: x, hint: { type: 'text', text: 'חיסור הוא הפעולה ההפוכה לחיבור' } });
  });

  S('g4_mult', '3', '1', 'כפל במאונך', '✖️', (L, r) => {
    const a = L === 1 ? ri(r, 11, 49) : L === 2 ? ri(r, 102, 499) : ri(r, 12, 99);
    const b = L === 1 ? ri(r, 2, 6) : L === 2 ? ri(r, 3, 9) : ri(r, 12, 49);
    const hint = L === 3 ? `${a} × ${b} = ${a} × ${b - (b % 10)} + ${a} × ${b % 10}` : `פרקי: ${a} = ${a - (a % 10)} + ${a % 10}`;
    return num('g4_mult', { prompt: 'חשבי', expr: `${a} × ${b} = ?`, answer: a * b, hint: { type: 'text', text: hint } });
  });

  S('g4_divrem', '3', '1', 'חילוק', '➗', (L, r) => {
    if (L === 1) { const d = ri(r, 2, 6), q = ri(r, 11, 25); return num('g4_divrem', { expr: `${d * q} : ${d} = ?`, answer: q }); }
    if (L === 3) { const d = ri(r, 3, 9), q = ri(r, 101, 999); return num('g4_divrem', { expr: `${N(d * q)} : ${d} = ?`, answer: q, hint: { type: 'text', text: 'מחלקים משמאל לימין: מאות, עשרות, אחדות' } }); }
    const d = ri(r, 3, 9), q = ri(r, 3, 12), rem = ri(r, 1, d - 1), n = d * q + rem;
    const s = (qq, rr) => `${qq} ושארית ${rr}`;
    const opts = [s(q, rem), s(q + 1, rem), s(q, rem === 1 ? 2 : rem - 1), s(q - 1, rem + d > n ? 0 : rem + d)];
    return choice('g4_divrem', { expr: `${n} : ${d} = ?`, answer: s(q, rem), choices: shuffle(r, [...new Set(opts)]), hint: { type: 'text', text: 'השארית תמיד קטנה מהמחלק' } });
  });

  // ===================== 4 · כפל בעשרות ובמאות שלמות =====================
  S('g4_tens', '4', '1', 'כפל בעשרות ובמאות', '💯', (L, r) => {
    const id = 'g4_tens';
    if (L === 1) {
      const a = ri(r, 2, 9), b = ri(r, 1, 9) * pick(r, [10, 100]); const [x, y] = r() < 0.5 ? [a, b] : [b, a];
      return num(id, { prompt: 'חשבי', expr: `${N(x)} × ${N(y)} = ?`, answer: x * y, hint: { type: 'text', text: `קודם ${a} × ${b / (b % 100 === 0 ? 100 : 10)}, ואז מוסיפים ${b % 100 === 0 ? 'שני אפסים' : 'אפס'}` } });
    }
    if (L === 2) {
      const t = ri(r, 0, 1);
      if (t === 0) { const a = ri(r, 11, 49), b = ri(r, 2, 9) * pick(r, [10, 100]); return num(id, { prompt: 'חשבי', expr: `${a} × ${N(b)} = ?`, answer: a * b, hint: { type: 'text', text: `${a} × ${b / (b % 100 === 0 ? 100 : 10)} ועוד ${b % 100 === 0 ? 'שני אפסים' : 'אפס'}` } }); }
      const a = ri(r, 2, 9) * pick(r, [10, 100]), b = ri(r, 2, 9) * 10; return num(id, { prompt: 'חשבי', expr: `${N(a)} × ${b} = ?`, answer: a * b, hint: { type: 'text', text: 'כופלים את הספרות שאינן אפס, ומוסיפים את כל האפסים' } });
    }
    const f = ri(r, 2, 9) * pick(r, [10, 10, 100]), x = ri(r, 2, 9) * pick(r, [1, 10, 10]);
    return r() < 0.5
      ? num(id, { prompt: 'השלימי את המספר החסר', expr: `? × ${N(f)} = ${N(x * f)}`, answer: x, hint: { type: 'text', text: `חילוק הוא הפעולה ההפוכה לכפל: ${N(x * f)} : ${N(f)}` } })
      : num(id, { prompt: 'השלימי את המספר החסר', expr: `${N(x)} × ? = ${N(x * f)}`, answer: f, hint: { type: 'text', text: `איזה מספר כפול ${N(x)} נותן ${N(x * f)}?` } });
  });

  // ===================== 5 · סדרות במספרים =====================
  S('g4_seq', '5', '1', 'סדרות', '🪜', (L, r) => {
    const id = 'g4_seq', hint = { type: 'text', text: 'בדקי בכמה כל מספר גדל או קטן מהמספר שלפניו' };
    const show = (seq, miss) => seq.map((v, i) => (i === miss ? '?' : N(v))).join(' ,  ');
    if (L === 1) {
      const step = pick(r, [2, 3, 5, 10, 25, 50, 100]) * (r() < 0.25 ? -1 : 1), start = step > 0 ? ri(r, 0, 40) * 5 : ri(r, 60, 120) * 10;
      const seq = [0, 1, 2, 3, 4].map((i) => start + i * step);
      return num(id, { prompt: 'מהו המספר הבא בסדרה?', expr: show(seq.slice(0, 4).concat([0]), 4), answer: seq[4], hint });
    }
    if (L === 2) {
      const step = pick(r, [125, 250, 500, 1000, 2500, 10000]) * (r() < 0.35 ? -1 : 1), start = step > 0 ? ri(r, 1, 40) * 250 : ri(r, 20, 90) * 1000 + 50000;
      const seq = [0, 1, 2, 3, 4].map((i) => start + i * step), miss = ri(r, 1, 3);
      return num(id, { prompt: 'איזה מספר חסר בסדרה?', expr: show(seq, miss), answer: seq[miss], hint });
    }
    const t = ri(r, 0, 2);
    let seq;
    if (t === 0) { const a = ri(r, 2, 9), b = ri(r, 1, a - 1), s = ri(r, 10, 60); seq = [s]; for (let i = 1; i < 6; i++) seq.push(seq[i - 1] + (i % 2 ? a : -b)); }
    else if (t === 1) { const s = ri(r, 1, 30); seq = [s]; for (let i = 1; i < 6; i++) seq.push(seq[i - 1] + i); }
    else { const s = ri(r, 1, 6); seq = [s]; for (let i = 1; i < 6; i++) seq.push(seq[i - 1] * 2); }
    return num(id, { prompt: 'מהו המספר הבא בסדרה?', expr: show(seq.slice(0, 5).concat([0]), 5), answer: seq[5], hint: { type: 'text', text: 'החוק כאן לא תמיד אותו מספר — בדקי את ההפרשים או פי כמה' } });
  });

  // ===================== 6 · סדר פעולות חשבון =====================
  S('g4_order', '6', '1', 'סדר פעולות', '🎯', (L, r) => {
    const a = ri(r, 2, 9), b = ri(r, 2, 9), c = ri(r, 2, 9), d = ri(r, 2, 6);
    if (L === 1) return num('g4_order', { expr: `${a} + ${b} × ${c} = ?`, answer: a + b * c, hint: { type: 'text', text: 'כפל וחילוק לפני חיבור וחיסור' } });
    if (L === 2) return r() < 0.5
      ? num('g4_order', { expr: `(${a} + ${b}) × ${c} = ?`, answer: (a + b) * c, hint: { type: 'text', text: 'קודם מה שבסוגריים' } })
      : (() => { const x = b * c + ri(r, 1, 20); return num('g4_order', { expr: `${x} − ${b} × ${c} = ?`, answer: x - b * c, hint: { type: 'text', text: 'כפל לפני חיסור' } }); })();
    if (r() < 0.5) { const e = ri(r, 2, 5), f = e + ri(r, 2, 9), x = (f - e) * b + ri(r, 5, 40); return num('g4_order', { expr: `${x} − (${f} − ${e}) × ${b} = ?`, answer: x - (f - e) * b, hint: { type: 'text', text: 'סוגריים, אחר כך כפל, ובסוף חיסור' } }); }
    return num('g4_order', { expr: `${a} × ${b} + ${c * d} : ${d} = ?`, answer: a * b + c, hint: { type: 'text', text: 'כפל וחילוק קודם, ואז חיבור' } });
  });

  // ===================== 7 · מספרים על ישר המספרים =====================
  S('g4_numline', '7', '1', 'ישר המספרים', '📏', (L, r) => {
    const id = 'g4_numline';
    let start, step, n = 10, labels = [0, 10];
    if (L === 1) { [start, step] = pick(r, [[0, 10], [0, 100], [0, 1000], [0, 5], [100, 10]]); }
    else if (L === 2) { step = pick(r, [10, 100, 1000, 50]); start = step * ri(r, 3, 60) * (step >= 1000 ? 1 : 10); }
    else {
      const t = ri(r, 0, 1);
      if (t === 0) { step = pick(r, [25, 250, 500, 2500, 100000]); start = 0; n = step === 100000 ? 10 : pick(r, [8, 10]); labels = [0, n]; }
      else { step = pick(r, [20, 50, 200, 500]); start = step * ri(r, 5, 40); labels = [2, 6]; }
    }
    let at = ri(r, 1, n - 1); while (labels.includes(at)) at = ri(r, 1, n - 1);
    const ans = start + at * step;
    return num(id, { prompt: 'לאיזה מספר מצביע החץ?', visual: { type: 'nline', start, step, n, at, labels }, answer: ans,
      hint: { type: 'text', text: labels[0] === 0 && labels[1] === n ? `${n} קפיצות שוות מ-${N(start)} עד ${N(start + n * step)} — כל קפיצה ${N(step)}` : 'מצאי קודם בכמה גדל המספר בכל קפיצה בין שני המספרים הכתובים' } });
  });

  // ===================== 8 · אי-שוויונות במספרים שלמים =====================
  S('g4_ineq', '8', '1', 'אי-שוויונות', '⚖️', (L, r) => {
    const id = 'g4_ineq', sign = (a, b) => (a > b ? '>' : a < b ? '<' : '=');
    if (L === 1) {
      const a = ri(r, 10000, 999999); let b;
      const t = ri(r, 0, 3);
      if (t === 0) { const d = digitsOf(a); const i = ri(r, 1, d.length - 1), j = ri(r, 1, d.length - 1); [d[i], d[j]] = [d[j], d[i]]; b = Number(d.join('')); }
      else if (t === 1) b = a; else if (t === 2) b = a + pick(r, [1, 10, 100, -1, -10, -100, 1000]); else b = Number(String(a).slice(0, -1));
      return choice(id, { prompt: 'איזה סימן מתאים?', expr: `${N(a)} ◻ ${N(b)}`, answer: sign(a, b), choices: ['<', '=', '>'], hint: { type: 'text', text: 'קודם סופרים ספרות; אם שווה — משווים משמאל' } });
    }
    if (L === 2) {
      const forms = [
        () => { const x = ri(r, 2, 9), y = ri(r, 2, 9) * 100; const z = x * y + pick(r, [0, 0, 100, -100]); return [`${x} × ${N(y)}`, x * y, N(z), z]; },
        () => { const x = ri(r, 2, 9) * 10, y = ri(r, 2, 9) * 10; const z = x * y + pick(r, [0, 0, 10, -100]); return [`${x} × ${y}`, x * y, N(z), z]; },
        () => { const z = pick(r, [1000, 10000, 100000]); return [`${N(z)} − 1`, z - 1, N(z - 1 + pick(r, [0, 1, -1])), null]; },
        () => { const a = ri(r, 2, 9) * 1000, b = ri(r, 1, 9) * 100; const c = a + b + pick(r, [0, 0, 1000, -100]); return [`${N(a)} + ${N(b)}`, a + b, N(c), c]; }
      ];
      let [lt, lv, rt, rv] = pick(r, forms)();
      if (rv === null) rv = Number(rt.replace(/,/g, ''));
      return choice(id, { prompt: 'בלי להתבלבל — חשבי ואז השווי', expr: `${lt} ◻ ${rt}`, answer: sign(lv, rv), choices: ['<', '=', '>'] });
    }
    if (r() < 0.5) {
      const lo = ri(r, 12, 98) * 1000, hi = lo + 1000;
      const ok = lo + ri(r, 1, 9) * 100, wrongs = shuffle(r, [lo - ri(r, 1, 9) * 100, hi + ri(r, 1, 9) * 100, ok + 10000, hi, lo]).filter((x) => x <= lo || x >= hi).slice(0, 3);
      return choice(id, { prompt: 'איזה מספר מתאים במקום סימן השאלה?', expr: `${N(lo)} < ? < ${N(hi)}`, answer: N(ok), choices: shuffle(r, [...new Set([ok, ...wrongs])].map(N)) });
    }
    const x = ri(r, 2, 9), y = ri(r, 2, 9) * 100, big = r() < 0.5;
    return num(id, { prompt: `מהו המספר השלם ה${big ? 'גדול' : 'קטן'} ביותר שמתאים במקום סימן השאלה?`, expr: big ? `? < ${x} × ${N(y)}` : `? > ${x} × ${N(y)}`, answer: big ? x * y - 1 : x * y + 1, hint: { type: 'text', text: `קודם חשבי ${x} × ${N(y)}` } });
  });

  // ===================== 9 · בעיות מילוליות במספרים שלמים =====================
  S('g4_word', '9', '1', 'בעיות מילוליות', '📖', (L, r) => {
    const id = 'g4_word', P = person(r), g = P.n, v = P.v;
    const t = L === 1 ? ri(r, 0, 2) : L === 2 ? ri(r, 3, 5) : ri(r, 6, 8);
    switch (t) {
      case 0: { const a = ri(r, 1200, 6000), b = ri(r, 300, 3000); return num(id, { prompt: `בספרייה היו ${N(a)} ספרים. קנו עוד ${N(b)} ספרים. כמה ספרים יש עכשיו בספרייה?`, answer: a + b }); }
      case 1: { const a = ri(r, 3000, 9000), b = ri(r, 500, a - 500); return num(id, { prompt: `באצטדיון ישבו ${N(a)} צופים. ${N(b)} צופים יצאו בהפסקה. כמה צופים נשארו?`, answer: a - b }); }
      case 2: { const a = ri(r, 12, 48), b = pick(r, [10, 20, 30, 40, 50]); return num(id, { prompt: `בכל קופסה ${a} עפרונות. כמה עפרונות יש ב-${b} קופסאות?`, answer: a * b }); }
      case 3: { const p = ri(r, 25, 80), k = ri(r, 2, 4), bill = pick(r, [200, 300, 500].filter((x) => x > p * k)); return num(id, { prompt: `${g} ${v('קנתה', 'קנה')} ${k} חולצות, כל אחת ב-${p} ₪, ${v('ושילמה', 'ושילם')} בשטר של ${bill} ₪. כמה עודף ${v('קיבלה', 'קיבל')}?`, answer: bill - p * k }); }
      case 4: { const k = ri(r, 4, 9), each = ri(r, 12, 40); return num(id, { prompt: `${k * each} ילדים התחלקו ל-${k} קבוצות שוות. כמה ילדים יש בכל קבוצה?`, answer: each }); }
      case 5: { const seats = pick(r, [40, 45, 50, 55]), kids = ri(r, 150, 400); return num(id, { prompt: `${kids} תלמידים נוסעים לטיול באוטובוסים של ${seats} מקומות. כמה אוטובוסים צריך להזמין?`, answer: Math.ceil(kids / seats), hint: { type: 'text', text: 'אם נשארים תלמידים — צריך עוד אוטובוס!' } }); }
      case 6: { const rows = ri(r, 18, 30), per = ri(r, 20, 35), taken = ri(r, 100, rows * per - 50); return num(id, { prompt: `באולם ${rows} שורות, ובכל שורה ${per} כיסאות. ${N(taken)} כיסאות תפוסים. כמה כיסאות פנויים?`, answer: rows * per - taken, hint: { type: 'text', text: 'קודם מוצאים כמה כיסאות יש בסך הכול' } }); }
      case 7: { const small = ri(r, 120, 400), diff = ri(r, 30, 200); return num(id, { prompt: `הסכום של שני מספרים הוא ${N(2 * small + diff)}. מספר אחד גדול מהשני ב-${diff}. מהו המספר הקטן?`, answer: small, hint: { type: 'text', text: `${N(2 * small + diff)} − ${diff}, ואז חלקי 2` } }); }
      default: { const save = ri(r, 30, 90), months = ri(r, 6, 12), total = save * months, price = ri(r, Math.floor(total / 2), total - 10); return num(id, { prompt: `${g} ${v('חסכה', 'חסך')} ${save} ₪ בכל חודש במשך ${months} חודשים, ואז ${v('קנתה', 'קנה')} אופניים ב-${price} ₪. כמה כסף נשאר ${v('לה', 'לו')}?`, answer: save * months - price }); }
    }
  });

  // ===================== 10 · משמעות השבר — מונה ומכנה =====================
  S('g4_frac_meaning', '10', '2', 'מונה ומכנה', '🍰', (L, r) => {
    const id = 'g4_frac_meaning';
    if (L === 1) {
      const d = ri(r, 2, 10), n = ri(r, 1, d - 1), ans = [n, d];
      return choice(id, { prompt: 'איזה חלק מהצורה צבוע?', visual: { type: 'fracbar', bars: [{ n, d }] }, answer: fracStr(ans),
        choices: fractionChoices(r, ans, [[d - n, d], [n, d - n], [d, n], [n, d + 1], [n + 1, d]]), hint: { type: 'text', text: 'המכנה = לכמה חלקים שווים חילקו. המונה = כמה חלקים צבועים' } });
    }
    if (L === 2) {
      const d = ri(r, 3, 12), n = ri(r, 1, d - 1);
      const t = ri(r, 0, 2);
      if (t === 0) {
        const askDen = r() < 0.5;
        const right = askDen ? 'לכמה חלקים שווים חילקו את השלם' : 'כמה חלקים לקחנו (צבענו)';
        const other = askDen ? 'כמה חלקים לקחנו (צבענו)' : 'לכמה חלקים שווים חילקו את השלם';
        return choice(id, { prompt: `בשבר ${n}/${d} — מה מראה ${askDen ? 'המכנה' : 'המונה'}, ${askDen ? d : n}?`, answer: right, choices: shuffle(r, [right, other, 'כמה שלמים יש', 'כמה חלקים נשארו לבנים']) });
      }
      if (t === 1) { const askDen = r() < 0.5; return num(id, { prompt: `מהו ה${askDen ? 'מכנה' : 'מונה'} בשבר ${n}/${d}?`, answer: askDen ? d : n }); }
      return num(id, { prompt: `צורה מחולקת ל-${d} חלקים שווים, ו-${n} מהם צבועים. כמה חלקים עוד צריך לצבוע כדי שכל הצורה תהיה צבועה?`, visual: { type: 'fracbar', bars: [{ n, d }] }, answer: d - n, hint: { type: 'text', text: `${d}/${d} זה שלם אחד` } });
    }
    if (r() < 0.5) {
      const a = ri(r, 2, 9); let b = ri(r, 2, 9); while (b === a) b = ri(r, 2, 9);
      return choice(id, { prompt: 'איזה שבר גדול יותר?', answer: `1/${Math.min(a, b)}`, choices: shuffle(r, [`1/${a}`, `1/${b}`]), visual: { type: 'fracbar', bars: [{ n: 1, d: a }, { n: 1, d: b }] }, hint: { type: 'text', text: 'כשמחלקים ליותר חלקים — כל חלק קטן יותר' } });
    }
    const d = pick(r, [4, 6, 8, 10, 12]), n = ri(r, 1, d - 1);
    return num(id, { prompt: `בצורה שמחולקת ל-${d} חלקים שווים צבעו ${n}/${d}. כמה חלקים צבעו?`, answer: n, visual: { type: 'fracbar', bars: [{ n: 0, d }] } });
  });

  S('g4_frac_cmp', '10', '2', 'משווות שברים', '⚖️', (L, r) => {
    let A, B;
    if (L === 1) { const d = ri(r, 3, 10); const x = ri(r, 1, d - 1); let y = ri(r, 1, d - 1); if (r() < 0.15) y = x; A = [x, d]; B = [y, d]; }
    else if (L === 2) { const n = ri(r, 1, 4); const x = ri(r, n + 1, 10); let y = ri(r, n + 1, 10); if (r() < 0.15) y = x; A = [n, x]; B = [n, y]; }
    else { const d = pick(r, [2, 3, 4, 5]); const k = pick(r, [2, 3]); const x = ri(r, 1, d - 1); A = [x, d]; const y = r() < 0.25 ? x * k : ri(r, 1, d * k - 1); B = [y, d * k]; }
    const lhs = A[0] * B[1], rhs = B[0] * A[1];
    return choice('g4_frac_cmp', { prompt: 'איזה סימן מתאים?', expr: `${fracStr(A)} ◻ ${fracStr(B)}`, answer: lhs > rhs ? '>' : lhs < rhs ? '<' : '=', choices: ['<', '=', '>'],
      hint: { type: 'text', text: L === 1 ? 'מכנה שווה — גדול יותר השבר עם המונה הגדול' : L === 2 ? 'מונה שווה — גדול יותר השבר עם המכנה הקטן' : 'הרחיבי את השבר הראשון למכנה של השני' } });
  });

  // ===================== 11 · שמות שונים לשבר =====================
  S('g4_frac_names', '11', '2', 'שמות שונים לשבר', '🪞', (L, r) => {
    const id = 'g4_frac_names';
    if (L === 1) {
      const [n, d] = pick(r, [[1, 2], [1, 3], [1, 4], [2, 3], [3, 4], [1, 5], [2, 5]]), k = ri(r, 2, 4);
      return num(id, { prompt: 'השלימי כדי שהשברים יהיו שווים', expr: `${n}/${d} = ?/${d * k}`, answer: n * k, visual: { type: 'fracbar', bars: [{ n, d }, { n: n * k, d: d * k }] }, hint: { type: 'text', text: `${d} × ${k} = ${d * k}, אז גם המונה כפול ${k}` } });
    }
    if (L === 2) {
      const [n, d] = pick(r, [[1, 2], [2, 3], [3, 4], [2, 5], [3, 5], [1, 3], [4, 5]]), k = ri(r, 2, 5);
      const t = ri(r, 0, 2);
      if (t === 0) return num(id, { prompt: 'השלימי כדי שהשברים יהיו שווים', expr: `${n}/${d} = ${n * k}/?`, answer: d * k });
      if (t === 1) return num(id, { prompt: 'השלימי כדי שהשברים יהיו שווים', expr: `${n * k}/${d * k} = ${n}/?`, answer: d, hint: { type: 'text', text: `מחלקים מונה ומכנה באותו מספר: ${k}` } });
      const ans = [n * k, d * k];
      return choice(id, { prompt: `איזה שבר שווה ל-${n}/${d}?`, answer: fracStr(ans), choices: fractionChoices(r, ans, [[n + k, d + k], [n, d * k], [n * k, d], [d, n], [n * k + 1, d * k]]) });
    }
    if (r() < 0.6) {
      const w = ri(r, 1, 4), d = ri(r, 2, 8);
      return r() < 0.5
        ? num(id, { prompt: 'השלימי', expr: `${w} = ?/${d}`, answer: w * d, hint: { type: 'text', text: `בשלם אחד יש ${d}/${d}` } })
        : num(id, { prompt: 'השלימי', expr: `${w} = ${w * d}/?`, answer: d });
    }
    const d = ri(r, 3, 9);
    return choice(id, { prompt: 'איזה שבר שווה לשלם אחד?', answer: `${d}/${d}`, choices: shuffle(r, [`${d}/${d}`, `1/${d}`, `${d - 1}/${d}`, `${d}/1`]), hint: { type: 'text', text: 'כשלוקחים את כל החלקים — יש שלם' } });
  });

  // ===================== 12 · היקף ושטח של ריבוע ומלבן =====================
  S('g4_area', '12', '3', 'היקף ושטח', '🟩', (L, r) => {
    const id = 'g4_area';
    if (L === 1) {
      const sq = r() < 0.35, w = ri(r, 3, 12), hgt = sq ? w : ri(r, 2, w - 1), askP = r() < 0.5;
      const shape = sq ? `ריבוע שצלעו ${w} ס"מ` : `מלבן שאורכו ${w} ס"מ ורוחבו ${hgt} ס"מ`;
      return num(id, { prompt: `${shape}. מה ${askP ? 'ההיקף שלו (בס"מ)' : 'השטח שלו (בסמ"ר)'}?`, visual: { type: 'rect', w, h: hgt }, answer: askP ? 2 * (w + hgt) : w * hgt,
        hint: { type: 'text', text: askP ? (sq ? 'היקף ריבוע = 4 × צלע' : 'היקף = אורך + רוחב + אורך + רוחב') : (sq ? 'שטח ריבוע = צלע × צלע' : 'שטח = אורך × רוחב') } });
    }
    if (L === 2) {
      const t = ri(r, 0, 3), s = ri(r, 3, 10), l = ri(r, 5, 12), w = ri(r, 2, l - 1);
      if (t === 0) return num(id, { prompt: `היקפו של ריבוע ${4 * s} ס"מ. מה אורך הצלע שלו?`, answer: s, hint: { type: 'text', text: `לריבוע 4 צלעות שוות: ${4 * s} : 4` } });
      if (t === 1) return num(id, { prompt: `שטחו של ריבוע ${s * s} סמ"ר. מה אורך הצלע שלו?`, answer: s, hint: { type: 'text', text: `איזה מספר כפול עצמו נותן ${s * s}?` } });
      if (t === 2) return num(id, { prompt: `שטחו של מלבן ${l * w} סמ"ר ואורכו ${l} ס"מ. מה רוחבו?`, answer: w, hint: { type: 'text', text: `רוחב = שטח : אורך` } });
      return num(id, { prompt: `היקפו של מלבן ${2 * (l + w)} ס"מ ואורכו ${l} ס"מ. מה רוחבו?`, answer: w, hint: { type: 'text', text: `חצי היקף = אורך + רוחב = ${l + w}` } });
    }
    const t = ri(r, 0, 2), s = ri(r, 3, 10), l = ri(r, 5, 15), w = ri(r, 2, l - 1);
    if (t === 0) return num(id, { prompt: `היקפו של ריבוע ${4 * s} ס"מ. מה השטח שלו (בסמ"ר)?`, answer: s * s, hint: { type: 'text', text: 'קודם מוצאים את אורך הצלע' } });
    if (t === 1) return num(id, { prompt: `שטחו של מלבן ${l * w} סמ"ר ואורכו ${l} ס"מ. מה ההיקף שלו (בס"מ)?`, answer: 2 * (l + w), hint: { type: 'text', text: 'קודם מוצאים את הרוחב' } });
    const price = pick(r, [5, 10, 20]);
    return num(id, { prompt: `גינה מלבנית אורכה ${l} מ' ורוחבה ${w} מ'. כל מטר גדר עולה ${price} ₪. כמה תעלה גדר סביב כל הגינה?`, answer: 2 * (l + w) * price, visual: { type: 'rect', w: l, h: w }, hint: { type: 'text', text: 'קודם מחשבים את ההיקף' } });
  });

  // ===================== 13 · אלכסונים, צלעות מקבילות וסמוכות =====================
  const SIDES = ['AB', 'BC', 'CD', 'DA'];
  const opposite = { AB: 'DC', BC: 'AD', CD: 'AB', DA: 'BC' };
  const adjacent = { AB: ['BC', 'AD'], BC: ['AB', 'CD'], CD: ['BC', 'DA'], DA: ['CD', 'AB'] };
  S('g4_geo', '13', '3', 'אלכסונים וצלעות', '🔷', (L, r) => {
    const id = 'g4_geo';
    if (L === 1) {
      const t = ri(r, 0, 2);
      if (t === 0) return num(id, { prompt: 'כמה אלכסונים יש למרובע?', visual: { type: 'quad', kind: pick(r, ['rect', 'para', 'trap']), mark: ['AC', 'BD'] }, answer: 2, hint: { type: 'text', text: 'אלכסון מחבר שני קדקודים שאינם סמוכים' } });
      const isDiag = r() < 0.5, mark = isDiag ? pick(r, ['AC', 'BD']) : pick(r, SIDES);
      return choice(id, { prompt: `מה הקטע המסומן ${mark}?`, visual: { type: 'quad', kind: pick(r, ['rect', 'square', 'para', 'trap']), mark: [mark] }, answer: isDiag ? 'אלכסון' : 'צלע', choices: ['צלע', 'אלכסון'] });
    }
    if (L === 2) {
      const kind = pick(r, ['rect', 'square', 'para']), side = pick(r, SIDES);
      if (r() < 0.5) {
        const ans = opposite[side];
        return choice(id, { prompt: `במרובע ABCD (${kind === 'square' ? 'ריבוע' : kind === 'rect' ? 'מלבן' : 'מקבילית'}) — איזו צלע מקבילה לצלע ${side}?`, visual: { type: 'quad', kind, mark: [side] }, answer: ans,
          choices: shuffle(r, [ans, ...adjacent[side], pick(r, ['AC', 'BD'])]), hint: { type: 'text', text: 'צלעות מקבילות — לא נפגשות, גם אם ממשיכים אותן' } });
      }
      const ans = pick(r, adjacent[side]);
      return choice(id, { prompt: `במרובע ABCD — איזו צלע סמוכה לצלע ${side}?`, visual: { type: 'quad', kind, mark: [side] }, answer: ans,
        choices: shuffle(r, [ans, opposite[side], 'AC', 'BD']), hint: { type: 'text', text: 'צלעות סמוכות — יש להן קדקוד משותף' } });
    }
    const facts = [
      ['אלכסון מחבר שני קדקודים שאינם סמוכים', true], ['אלכסון מחבר שני קדקודים סמוכים', false],
      ['לצלעות סמוכות יש קדקוד משותף', true], ['צלעות מקבילות נפגשות בקדקוד', false],
      ['בכל מלבן כל שתי צלעות נגדיות מקבילות', true], ['בכל מלבן האלכסונים שווים זה לזה', true],
      ['בריבוע כל שתי צלעות סמוכות מאונכות זו לזו', true], ['לכל מרובע יש בדיוק 2 אלכסונים', true],
      ['למשולש יש אלכסונים', false], ['לטרפז יש שני זוגות של צלעות מקבילות', false],
      ['בכל מרובע יש לפחות זוג אחד של צלעות מקבילות', false], ['במקבילית כל צלע מקבילה לצלע שמולה', true]
    ];
    if (r() < 0.65) { const [f, t] = pick(r, facts); return choice(id, { prompt: `נכון או לא נכון? ${f}.`, answer: t ? 'נכון' : 'לא נכון', choices: TF }); }
    return choice(id, { prompt: 'בטרפז ABCD הצלע AB מקבילה לצלע DC. האם AD מקבילה ל-BC?', visual: { type: 'quad', kind: 'trap', mark: ['AD', 'BC'] }, answer: 'לא', choices: ['כן', 'לא'], hint: { type: 'text', text: 'לטרפז יש זוג אחד בלבד של צלעות מקבילות' } });
  });

  // ===================== בהמשך השנה =====================
  S('g4_frac_of', 'x', 'x', 'שבר מכמות', '🍬', (L, r) => {
    const [n, d] = L === 1 ? [1, pick(r, [2, 3, 4])] : L === 2 ? [1, pick(r, [5, 6, 10])] : pick(r, [[2, 3], [3, 4], [2, 5], [3, 5]]);
    const total = d * ri(r, 2, 10);
    return num('g4_frac_of', { prompt: `כמה זה ${n}/${d} מ-${total}?`, answer: (total / d) * n, hint: { type: 'text', text: `קודם ${total} : ${d} = ${total / d}${n > 1 ? `, ואז כפול ${n}` : ''}` } });
  }, { extra: true });
}
