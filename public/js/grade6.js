// Grade 6 track, aligned topic-by-topic with the class review booklet
// ("חוברת חזרה – כיתה ו׳": chapters 1–4, topics 1.1 … 4.5).
// Every generator makes fresh numbers, so practice transfers to the test instead of
// memorising the booklet's answers. Drawing / "explain why" items stay on paper.

export const GRADE6_UNITS = [
  { id: '1', title: 'פרק 1 · מספרים שלמים' },
  { id: '2', title: 'פרק 2 · שברים' },
  { id: '3', title: 'פרק 3 · מספרים עשרוניים' },
  { id: '4', title: 'פרק 4 · גיאומטריה' },
  { id: 'x', title: 'בהמשך השנה' }
];

export function registerGrade6(h) {
  const { skill, ri, pick, shuffle, num, choice, numberChoices, fractionChoices, gcd, round, fmt } = h;
  const N = (x) => (Number.isInteger(x) && Math.abs(x) >= 1000 ? x.toLocaleString('en-US') : fmt(x));
  const simp = ([n, d]) => { const g = gcd(n, d); return [n / g, d / g]; };
  const mixed = ([n, d]) => { if (d === 1) return String(n); if (n < d) return `${n}/${d}`; const w = Math.floor(n / d), r = n % d; return r ? `${w} ${r}/${d}` : String(w); };
  const fchoice = (r, ans, wrongs) => fractionChoices(r, simp(ans), wrongs, (f) => mixed(simp(f)));
  const lcm = (a, b) => (a * b) / gcd(a, b);
  const S = (id, topic, unit, title, emoji, gen, extra = {}) => skill(id, '6', title, emoji, gen, { topic, unit, ...extra });
  const TF = ['נכון', 'לא נכון'];
  const NAMES = ['נועה', 'מאיה', 'תמר', 'יעל', 'שירה', 'דנה', 'רוני', 'ליה', 'עדי', 'הילה'];

  // ===================== פרק 1 · מספרים שלמים =====================
  S('g6_vertical', '1.1', '1', 'ארבע פעולות במאונך', '🧮', (L, r) => {
    const id = 'g6_vertical';
    if (L === 1) {
      if (r() < 0.5) { const a = ri(r, 1200, 6999), b = ri(r, 1500, 9999 - a); return num(id, { prompt: 'חשבי במאונך', expr: `${N(a)} + ${N(b)} = ?`, answer: a + b }); }
      const a = ri(r, 3000, 9999), b = ri(r, 1000, a - 500); return num(id, { prompt: 'חשבי במאונך', expr: `${N(a)} − ${N(b)} = ?`, answer: a - b });
    }
    if (L === 2) {
      if (r() < 0.5) { const a = pick(r, [10000, 20000, 5000, 8000, 10000]) + ri(r, 0, 9), b = ri(r, 1111, a - 1000); return num(id, { prompt: 'חשבי במאונך (שימי לב לאפסים)', expr: `${N(a)} − ${N(b)} = ?`, answer: a - b, hint: { type: 'text', text: 'כשאין ממה לפרוט — פורטים מהספרה הראשונה שאינה 0' } }); }
      const a = ri(r, 105, 499), b = ri(r, 12, 49); return num(id, { prompt: 'חשבי במאונך', expr: `${a} × ${b} = ?`, answer: a * b, hint: { type: 'text', text: `${a} × ${b} = ${a} × ${b - (b % 10)} + ${a} × ${b % 10}` } });
    }
    const t = ri(r, 0, 2);
    if (t === 0) { const d = ri(r, 11, 25), q = ri(r, 120, 799); return num(id, { prompt: 'חשבי במאונך', expr: `${N(d * q)} : ${d} = ?`, answer: q }); }
    if (t === 1) { const d = ri(r, 3, 9), q = ri(r, 201, 1100); return num(id, { prompt: 'חשבי במאונך', expr: `${N(d * q)} : ${d} = ?`, answer: q }); }
    const a = ri(r, 3, 9) * 100 + ri(r, 1, 9), b = ri(r, 23, 89); return num(id, { prompt: 'חשבי במאונך', expr: `${a} × ${b} = ?`, answer: a * b });
  });

  S('g6_order', '1.1', '1', 'סדר פעולות וסוגריים', '🎯', (L, r) => {
    const id = 'g6_order';
    const hint = { type: 'text', text: '1. סוגריים  2. כפל וחילוק משמאל לימין  3. חיבור וחיסור משמאל לימין' };
    if (L === 1) { const b = ri(r, 3, 9), c = ri(r, 2, 9), a = b * c + ri(r, 5, 40), d = ri(r, 2, 30); return num(id, { expr: `${a} − ${b} × ${c} + ${d} = ?`, answer: a - b * c + d, hint }); }
    if (L === 2) {
      if (r() < 0.5) { const b = ri(r, 2, 20), a = b + ri(r, 5, 40), c = ri(r, 2, 6), d = ri(r, 1, 20); return num(id, { expr: `(${a} − ${b}) × ${c} + ${d} = ?`, answer: (a - b) * c + d, hint }); }
      const s = pick(r, [5, 6, 8, 10, 12]), b = ri(r, 1, s - 1), c = s - b, q = ri(r, 3, 15), d = ri(r, 2, 5); return num(id, { expr: `${s * q} : (${b} + ${c}) × ${d} = ?`, answer: q * d, hint });
    }
    if (r() < 0.45) {
      // Where do the brackets go?
      for (let guard = 0; guard < 30; guard++) {
        const a = ri(r, 2, 9), b = ri(r, 2, 9), c = ri(r, 2, 9), d = ri(r, 1, 9);
        const opts = [
          [`(${a} + ${b}) × ${c} − ${d}`, (a + b) * c - d],
          [`${a} + ${b} × (${c} − ${d})`, a + b * (c - d)],
          [`(${a} + ${b} × ${c}) − ${d}`, a + b * c - d],
          [`${a} + (${b} × ${c} − ${d})`, a + b * c - d]
        ];
        const target = opts[0][1];
        if (target < 0 || opts.filter((o) => o[1] === target).length !== 1) continue;
        return choice(id, { prompt: `איפה צריך לשים סוגריים כדי שהתוצאה תהיה ${target}?`, expr: `${a} + ${b} × ${c} − ${d} = ${target}`, answer: opts[0][0], choices: shuffle(r, opts.map((o) => o[0])), hint });
      }
    }
    if (r() < 0.5) { const b = ri(r, 10, 30), c = ri(r, 5, 30), a = ri(r, 2, 9), e = pick(r, [2, 4, 5, 10]), d = e * ri(r, 2, 20); return num(id, { expr: `${a} × (${b} + ${c}) − ${d} : ${e} = ?`, answer: a * (b + c) - d / e, hint }); }
    const b = ri(r, 2, 6), c = ri(r, 5, 20), dd = ri(r, 5, 20), a = b * (c + dd) + ri(r, 1, 100); return num(id, { expr: `${a} − ${b} × (${c} + ${dd}) = ?`, answer: a - b * (c + dd), hint });
  });

  S('g6_smart', '1.1', '1', 'חישוב חכם', '💡', (L, r) => {
    const id = 'g6_smart';
    const n = ri(r, 12, 49);
    const forms = L === 1
      ? [[`25 × ${n} × 4`, 100 * n, `25 × 4 = 100, ואז 100 × ${n}`], [`50 × ${2 * n}`, 100 * n, `50 × 2 = 100, אז 100 × ${n}`]]
      : L === 2
        ? [[`99 × ${n % 10 || 6}`, 99 * (n % 10 || 6), `99 = 100 − 1: 100 × ${n % 10 || 6} − ${n % 10 || 6}`], [`125 × ${n} × 8`, 1000 * n, `125 × 8 = 1,000`], [`5 × ${n} × 20`, 100 * n, `5 × 20 = 100`]]
        : (() => { const a = ri(r, 21, 79), b = ri(r, 11, 89); return [[`${n} × 101`, n * 101, `${n} × 100 + ${n}`], [`${a} + ${b} + ${100 - a} + ${100 - b}`, 200, `(${a} + ${100 - a}) + (${b} + ${100 - b})`], [`${n} × 99`, n * 99, `${n} × 100 − ${n}`]]; })();
    const [e, ans, tip] = pick(r, forms);
    return num(id, { prompt: 'חשבי בדרך הקלה', expr: `${e} = ?`, answer: ans, hint: { type: 'text', text: tip } });
  });

  S('g6_missing', '1.1', '1', 'המספר החסר', '🕵️‍♀️', (L, r) => {
    const id = 'g6_missing';
    const t = L === 1 ? pick(r, [0, 2]) : L === 2 ? pick(r, [0, 1, 2]) : pick(r, [1, 3]);
    if (t === 0) { const f = pick(r, [5, 20, 25, 50]), x = ri(r, 4, 80); return num(id, { expr: `? × ${f} = ${N(f * x)}`, answer: x, hint: { type: 'text', text: `חילוק הוא הפעולה ההפוכה: ${N(f * x)} : ${f}` } }); }
    if (t === 1) { const q = pick(r, [20, 30, 40, 50, 60, 70, 80]), x = ri(r, 2, 12) * 10; return num(id, { expr: `${N(q * x)} : ? = ${q}`, answer: x, hint: { type: 'text', text: `${N(q * x)} : ${q} = ?` } }); }
    if (t === 2) { const b = ri(r, 1000, 4000), c = ri(r, 1000, 5000); return num(id, { expr: `? − ${N(b)} = ${N(c)}`, answer: b + c, hint: { type: 'text', text: 'חיבור הוא הפעולה ההפוכה לחיסור' } }); }
    const a = ri(r, 3, 12) * 1000, x = pick(r, [20, 25, 40, 50, 80].filter((v) => a % v === 0)) || 50; return num(id, { expr: `${N(a)} : ? = ${a / x}`, answer: x });
  });

  S('g6_word', '1.2', '1', 'בעיות מילוליות', '📖', (L, r) => {
    const id = 'g6_word', g = pick(r, NAMES);
    const t = L === 1 ? pick(r, [0, 1, 2]) : L === 2 ? pick(r, [3, 4, 5, 6]) : pick(r, [7, 8, 3]);
    switch (t) {
      case 0: { const m = ri(r, 3, 9), a = ri(r, 10, 40), res = m * ri(r, 4, 20) + a; return num(id, { prompt: `חשבתי על מספר. הכפלתי אותו ב-${m}, הוספתי ${a} וקיבלתי ${res}. על איזה מספר חשבתי?`, answer: (res - a) / m, hint: { type: 'text', text: 'עובדים מהסוף להתחלה: קודם מחסרים, אחר כך מחלקים' } }); }
      case 1: { const m = ri(r, 4, 9) * 10 + pick(r, [0, 5]), price = ri(r, 300, m * 12 - 50); return num(id, { prompt: `${g} חסכה ${m} ₪ בכל חודש במשך שנה שלמה. בסוף השנה קנתה אופניים ב-${price} ₪. כמה כסף נשאר לה?`, answer: m * 12 - price }); }
      case 2: { const cups = ri(r, 4, 8), sh = ri(r, 3, 6), each = ri(r, 12, 40), tot = cups * sh * each; return num(id, { prompt: `בספרייה יש ${N(tot)} ספרים, מסודרים באופן שווה ב-${cups} ארונות, ובכל ארון ${sh} מדפים. כמה ספרים יש בכל מדף?`, answer: each }); }
      case 3: { const cl = ri(r, 12, 30), st = ri(r, 25, 34), seats = pick(r, [40, 45, 50, 52, 55]); const total = cl * st; return num(id, { prompt: `בבית ספר יש ${cl} כיתות, ובכל כיתה ${st} תלמידים. כולם יוצאים לטיול באוטובוסים של ${seats} מקומות. כמה אוטובוסים צריך להזמין?`, answer: Math.ceil(total / seats), hint: { type: 'text', text: 'אם נשארים תלמידים — צריך עוד אוטובוס!' } }); }
      case 4: { const A = ri(r, 35, 60), K = ri(r, 18, 34), a = ri(r, 1, 3), k = ri(r, 2, 4), bill = pick(r, [200, 300, 500].filter((b) => b > A * a + K * k)); return num(id, { prompt: `כרטיס לפארק עולה ${A} ₪ למבוגר ו-${K} ₪ לילד. משפחה של ${a} מבוגרים ו-${k} ילדים שילמה בשטר של ${bill} ₪. כמה עודף קיבלה?`, answer: bill - (A * a + K * k) }); }
      case 5: { const c = ri(r, 8, 14), s = ri(r, 48, 80), empty = ri(r, 30, 200); return num(id, { prompt: `ברכבת ${c} קרונות, ובכל קרון ${s} מקומות ישיבה. בנסיעה נשארו ${empty} מקומות פנויים. כמה נוסעים ישבו?`, answer: c * s - empty }); }
      case 6: { const k = pick(r, [12, 15, 24]), n = k * ri(r, 60, 180) + ri(r, 1, k - 1); return num(id, { prompt: `במפעל ארזו ${N(n)} עפרונות בקופסאות של ${k}. כמה קופסאות מלאות יהיו?`, answer: Math.floor(n / k), hint: { type: 'text', text: 'חילוק עם שארית — סופרים רק קופסאות מלאות' } }); }
      case 7: { const k = pick(r, [12, 15, 24]), n = k * ri(r, 60, 180) + ri(r, 1, k - 1); return num(id, { prompt: `במפעל ארזו ${N(n)} עפרונות בקופסאות של ${k}. כמה עפרונות יישארו מחוץ לקופסאות המלאות?`, answer: n % k }); }
      default: { const small = ri(r, 20, 90), diff = ri(r, 4, 40), sum = 2 * small + diff; return num(id, { prompt: `הסכום של שני מספרים הוא ${sum}. מספר אחד גדול מהשני ב-${diff}. מהו המספר הקטן?`, answer: small, hint: { type: 'text', text: `${sum} − ${diff} = ${sum - diff}, ואז חלקי 2` } }); }
    }
  });

  S('g6_place', '1.3', '1', 'ערך המקום ועיגול', '🔢', (L, r) => {
    const id = 'g6_place';
    const digits = () => { const d = [ri(r, 1, 9)]; for (let i = 0; i < 6; i++) d.push(ri(r, 0, 9)); return d; };
    const d = digits(); const n = Number(d.join(''));
    const names = ['מיליונים', 'מאות אלפים', 'עשרות אלפים', 'אלפים', 'מאות', 'עשרות', 'אחדות'];
    if (L === 1) {
      const pos = ri(r, 0, 5), dig = d[pos] || 7; d[pos] = dig; const nn = Number(d.join('')); const val = dig * 10 ** (6 - pos);
      const opts = [...new Set([val, val * 10, val / 10, dig * 10 ** ((6 - pos + 2) % 7)].filter((v) => Number.isInteger(v) && v > 0))].slice(0, 4);
      return choice(id, { prompt: `מהו ערך הספרה ${dig} במספר ${N(nn)}?`, answer: N(val), choices: shuffle(r, opts.map(N)) });
    }
    if (L === 2) {
      if (r() < 0.5) { const pos = ri(r, 0, 5); return num(id, { prompt: `איזו ספרה נמצאת במקום ה${names[pos]} במספר ${N(n)}?`, answer: d[pos] }); }
      const add = pick(r, [1000, 10000, 100000]); return num(id, { prompt: `מה יהיה המספר ${N(n)} אם נוסיף לו ${N(add)}?`, answer: n + add });
    }
    const [to, unit] = pick(r, [['לאלפים', 1000], ['לעשרות אלפים', 10000], ['למאות אלפים', 100000], ['למיליונים', 1000000]]);
    return num(id, { prompt: `עגלי את המספר ${N(n)} ${to}`, answer: Math.round(n / unit) * unit, hint: { type: 'text', text: 'מסתכלים על הספרה שמימין למקום העיגול: 5 ומעלה — מעגלים למעלה' } });
  });

  S('g6_divis', '1.3', '1', 'חוקי התחלקות', '🔍', (L, r) => {
    const id = 'g6_divis';
    const tips = { 2: 'ספרת האחדות זוגית', 5: 'ספרת האחדות 0 או 5', 10: 'ספרת האחדות 0', 3: 'סכום הספרות מתחלק ב-3', 9: 'סכום הספרות מתחלק ב-9' };
    if (L === 3) {
      for (let guard = 0; guard < 50; guard++) {
        const ds = [ri(r, 1, 9), ri(r, 0, 9), ri(r, 0, 9)]; const s = ds.reduce((a, b) => a + b, 0);
        if (s % 9 === 0) continue;
        const miss = (9 - (s % 9)) % 9, at = ri(r, 1, 3); const all = [...ds]; all.splice(at, 0, '?');
        return num(id, { prompt: 'איזו ספרה חסרה כדי שהמספר יתחלק ב-9?', expr: all.join(''), answer: miss, hint: { type: 'text', text: `סכום הספרות שיש: ${s}. כמה חסר עד הכפולה הבאה של 9?` } });
      }
    }
    const dv = L === 1 ? pick(r, [2, 5, 10]) : pick(r, [3, 9, 3, 9, 5]);
    const yes = r() < 0.5; let n = dv * ri(r, 40, 2200); if (!yes) n += ri(r, 1, dv - 1);
    return choice(id, { prompt: `האם ${N(n)} מתחלק ב-${dv} בלי שארית?`, answer: yes ? 'כן' : 'לא', choices: ['כן', 'לא'], hint: { type: 'text', text: tips[dv] } });
  });

  S('g6_patterns', '1.3', '1', 'סדרות והשוואות', '🪜', (L, r) => {
    const id = 'g6_patterns';
    if (L === 1) {
      const t = ri(r, 0, 3);
      const seq = t === 0 ? (() => { const s = ri(r, 2, 12), st = ri(r, 4, 9); return [0, 1, 2, 3, 4].map((i) => s + i * st); })()
        : t === 1 ? (() => { const s = ri(r, 8, 20) * 50, st = pick(r, [25, 50, 100]); return [0, 1, 2, 3, 4].map((i) => s - i * st); })()
        : t === 2 ? (() => { const s = ri(r, 1, 3), m = pick(r, [2, 3]); return [0, 1, 2, 3, 4].map((i) => s * m ** i); })()
        : (() => { const s = ri(r, 1, 4); return [0, 1, 2, 3, 4].map((i) => (s + i) ** 2); })();
      return num(id, { prompt: 'מהו המספר הבא בסדרה?', expr: seq.slice(0, 4).map(N).join(' ,  ') + ' ,  ?', answer: seq[4] });
    }
    if (L === 2) {
      const a = ri(r, 11, 999), b = ri(r, 11, 999), op = pick(r, ['×', '+', '−']);
      const [x, y] = op === '−' && b > a ? [b, a] : [a, b];
      const v = op === '×' ? x * y : op === '+' ? x + y : x - y;
      return choice(id, { prompt: 'בלי לחשב: האם התוצאה זוגית או אי-זוגית?', expr: `${N(x)} ${op} ${N(y)}`, answer: v % 2 === 0 ? 'זוגית' : 'אי-זוגית', choices: ['זוגית', 'אי-זוגית'], hint: { type: 'text', text: 'מספיק להסתכל על ספרות האחדות' } });
    }
    const pairs = [
      () => { const n = ri(r, 2, 9) * 600; return [`${N(n)} : 30`, n / 30, `${N(n)} : 20`, n / 20]; },
      () => { const n = ri(r, 2, 9); return [`25 × 4 × ${n}`, 100 * n, `${n} × 100`, 100 * n]; },
      () => { const a = ri(r, 2, 8) * 100 - 1, b = ri(r, 2, 8) * 100 - 1; return [`${a} + ${b}`, a + b, `${N(a + b + 2)}`, a + b + 2]; },
      () => { const n = ri(r, 11, 60); return [`${n} × 50`, n * 50, `${n / 1} × 100 : 2`, n * 50]; },
      () => [`999 × 1,000`, 999000, `1,000,000`, 1000000],
      () => { const n = ri(r, 3, 9) * 1000; return [`${N(n)} : 10`, n / 10, `${N(n / 100)} × 10`, n / 10]; }
    ];
    const [lt, lv, rt, rv] = pick(r, pairs)();
    return choice(id, { prompt: 'השלימי את הסימן המתאים', expr: `${lt} ◻ ${rt}`, answer: lv > rv ? '>' : lv < rv ? '<' : '=', choices: ['<', '=', '>'] });
  });

  S('g6_estimate', '1.4', '1', 'תרגיל פתור ואומדן', '🧠', (L, r) => {
    const id = 'g6_estimate';
    if (L === 3 && r() < 0.5) {
      const T = pick(r, [1000, 10000, 100000]); const r1 = pick(r, [20, 50, 100, 200, 500].filter((x) => T / x >= 5 && T / x <= 500));
      const a = r1 + pick(r, [-2, -1, 1, 2, 3]) * Math.max(1, r1 / 50), b = T / r1 + pick(r, [-1, 1]);
      return choice(id, { prompt: 'אומדן: בלי לחשב במדויק — לאיזה מספר התוצאה הכי קרובה?', expr: `${N(a)} × ${N(b)}`, answer: N(T), choices: [T / 10, T, T * 10].map(N), hint: { type: 'text', text: `עגלי: ${N(r1)} × ${N(T / r1)}` } });
    }
    if (L === 3) {
      const a = ri(r, 101, 999), b = ri(r, 11, 99), op = pick(r, ['×', '+']); const v = op === '×' ? a * b : a + b;
      return num(id, { prompt: 'בלי לחשב את כל התרגיל: מהי ספרת האחדות של התוצאה?', expr: `${a} ${op} ${b}`, answer: v % 10, hint: { type: 'text', text: `מספיק לחשב ${a % 10} ${op} ${b % 10}` } });
    }
    const a = ri(r, 12, 48), b = ri(r, 6, 30) * 2, p = a * b;
    const given = `נתון: ${a} × ${b} = ${N(p)}. היעזרי בתרגיל הפתור.`;
    const vars = [
      [`${a} × ${b / 2}`, p / 2, 'גורם אחד קטן פי 2 ← גם התוצאה קטנה פי 2'],
      [`${a * 10} × ${b}`, p * 10, 'גורם אחד גדול פי 10 ← גם התוצאה'],
      [`${N(p)} : ${a}`, b, 'חילוק הוא הפעולה ההפוכה לכפל'],
      [`${N(p)} : ${b}`, a, 'חילוק הוא הפעולה ההפוכה לכפל'],
      [`${a} × ${b + 1}`, p + a, `עוד פעם אחת ${a}: ${N(p)} + ${a}`],
      [`${a} × ${b - 1}`, p - a, `פעם אחת פחות ${a}: ${N(p)} − ${a}`],
      [`${a * 2} × ${b}`, p * 2, 'גורם אחד גדול פי 2 ← גם התוצאה'],
      [`${N(p * 10)} : ${a}`, b * 10, 'המחולק גדול פי 10 ← גם המנה']
    ];
    const [e, ans, tip] = L === 1 ? pick(r, vars.slice(0, 4)) : pick(r, vars.slice(2));
    return num(id, { prompt: given, expr: `${e} = ?`, answer: ans, hint: { type: 'text', text: tip } });
  });

  // ===================== פרק 2 · שברים =====================
  S('g6_frac_basic', '2.1', '2', 'משמעות השבר והשוואה', '🍰', (L, r) => {
    const id = 'g6_frac_basic';
    const t = L === 1 ? pick(r, [0, 1]) : L === 2 ? pick(r, [0, 2, 3]) : pick(r, [0, 3, 4]);
    if (t === 0) {
      const d1 = ri(r, 3, 12), n1 = ri(r, 1, d1 - 1); let n2, d2;
      if (r() < 0.25) { const k = ri(r, 2, 3); n2 = n1 * k; d2 = d1 * k; } else { d2 = ri(r, 3, 14); n2 = ri(r, 1, d2 - 1); }
      const lv = n1 * d2, rv = n2 * d1;
      return choice(id, { prompt: 'השלימי את הסימן המתאים', expr: `${n1}/${d1} ◻ ${n2}/${d2}`, answer: lv > rv ? '>' : lv < rv ? '<' : '=', choices: ['<', '=', '>'], hint: { type: 'text', text: 'אפשר להרחיב למכנה משותף, או להשוות ל-1/2 ול-1' } });
    }
    if (t === 1) { const d = ri(r, 3, 9), n = ri(r, 1, d - 1), k = ri(r, 2, 6); const askNum = r() < 0.5; return num(id, { prompt: 'השלימי את השבר השווה', expr: askNum ? `${n}/${d} = ?/${d * k}` : `${n}/${d} = ${n * k}/?`, answer: askNum ? n * k : d * k, hint: { type: 'text', text: `${d} כפול כמה זה ${d * k}?` } }); }
    if (t === 2) { const d = ri(r, 3, 9), n = ri(r, 1, d - 1); const [a, b] = simp([n, d]); const k = ri(r, 2, 6); return choice(id, { prompt: 'צמצמי את השבר עד הסוף', expr: `${a * k}/${b * k} = ?`, answer: `${a}/${b}`, choices: fractionChoices(r, [a, b], [[a * k / gcd(k, 2), b * k / gcd(k, 2)], [a + 1, b], [a, b + 1], [b - a > 0 ? b - a : a + 2, b]]), hint: { type: 'text', text: 'מחלקים את המונה ואת המכנה באותו מספר' } }); }
    if (t === 3) {
      const d = ri(r, 3, 9), w = ri(r, 1, 5), n = ri(r, 1, d - 1); const imp = [w * d + n, d];
      if (r() < 0.5) return choice(id, { prompt: 'כתבי כשבר מדומה', expr: `${w} ${n}/${d} = ?`, answer: `${imp[0]}/${d}`, choices: shuffle(r, [...new Set([`${imp[0]}/${d}`, `${w * n + d}/${d}`, `${w + n}/${d}`, `${imp[0] + 1}/${d}`])]), hint: { type: 'text', text: `${w} שלמים = ${w * d}/${d}` } });
      return choice(id, { prompt: 'כתבי כמספר מעורב', expr: `${imp[0]}/${d} = ?`, answer: `${w} ${n}/${d}`, choices: shuffle(r, [...new Set([`${w} ${n}/${d}`, `${w + 1} ${n}/${d}`, `${w} ${n === 1 ? 2 : n - 1}/${d}`, `${n} ${w}/${d}`])]) });
    }
    const list = shuffle(r, [[1, 2], [3, 4], [2, 3], [5, 12], [7, 8], [1, 3], [3, 5], [5, 6]]).slice(0, 4);
    const sorted = [...list].sort((a, b) => a[0] / a[1] - b[0] / b[1]);
    return choice(id, { prompt: 'איזה שבר הוא הקטן ביותר?', answer: `${sorted[0][0]}/${sorted[0][1]}`, choices: shuffle(r, list.map(([a, b]) => `${a}/${b}`)), hint: { type: 'text', text: 'השווי כל שבר ל-1/2' } });
  });

  S('g6_frac_add', '2.2', '2', 'חיבור וחיסור שברים', '🧩', (L, r) => {
    const id = 'g6_frac_add';
    const pair = () => { for (;;) { const d1 = ri(r, 2, 10), d2 = ri(r, 2, 12); if (d1 !== d2 && lcm(d1, d2) <= 36) return [d1, d2]; } };
    if (L === 1) {
      const [d1, d2] = pair(), n1 = ri(r, 1, d1 - 1), n2 = ri(r, 1, d2 - 1), D = lcm(d1, d2);
      const ans = [n1 * (D / d1) + n2 * (D / d2), D];
      return choice(id, { prompt: 'חשבי וצמצמי אם אפשר', expr: `${n1}/${d1} + ${n2}/${d2} = ?`, answer: mixed(simp(ans)), choices: fchoice(r, ans, [[n1 + n2, d1 + d2], [n1 + n2, D], [ans[0] + 1, D], [ans[0] - 1, D]]), hint: { type: 'text', text: `מכנה משותף: ${D}` } });
    }
    if (L === 2) {
      for (;;) {
        const [d1, d2] = pair(), n1 = ri(r, 1, d1 - 1), n2 = ri(r, 1, d2 - 1), D = lcm(d1, d2);
        const top = n1 * (D / d1) - n2 * (D / d2); if (top <= 0) continue;
        const ans = [top, D];
        return choice(id, { prompt: 'חשבי וצמצמי אם אפשר', expr: `${n1}/${d1} − ${n2}/${d2} = ?`, answer: mixed(simp(ans)), choices: fchoice(r, ans, [[Math.abs(n1 - n2) || 1, Math.abs(d1 - d2) || 1], [top + 1, D], [top, D * 2], [n1 * (D / d1) + n2 * (D / d2), D]]), hint: { type: 'text', text: `מכנה משותף: ${D}` } });
      }
    }
    if (r() < 0.3) {
      const d = pick(r, [3, 4, 5, 6, 8, 10, 12]), n = ri(r, 1, d - 1);
      const ans = [d - n, d];
      return choice(id, { prompt: 'השלימי את המספר החסר', expr: `${n}/${d} + ? = 1`, answer: mixed(simp(ans)), choices: fchoice(r, ans, [[d - n + 1, d], [n, d], [1, d], [d - n, d + 1]]) });
    }
    const [d1, d2] = pair(), D = lcm(d1, d2), w1 = ri(r, 2, 5), w2 = ri(r, 1, w1 - 1), n1 = ri(r, 1, d1 - 1), n2 = ri(r, 1, d2 - 1);
    const A = [w1 * d1 + n1, d1], B = [w2 * d2 + n2, d2];
    const plus = r() < 0.5;
    const top = plus ? A[0] * (D / d1) + B[0] * (D / d2) : A[0] * (D / d1) - B[0] * (D / d2);
    const ans = [top, D];
    return choice(id, { prompt: 'חשבי במספרים מעורבים', expr: `${w1} ${n1}/${d1} ${plus ? '+' : '−'} ${w2} ${n2}/${d2} = ?`, answer: mixed(simp(ans)), choices: fchoice(r, ans, [[top + D, D], [top - D, D], [top + 1, D], [top - 1, D]]), hint: { type: 'text', text: plus ? 'שלמים עם שלמים, שברים עם שברים' : 'אם השבר הראשון קטן מדי — פורטים שלם אחד' } });
  });

  S('g6_numline', '2.3', '2', 'שברים על ישר המספרים', '📏', (L, r) => {
    const id = 'g6_numline';
    if (L === 3) {
      const d = pick(r, [4, 6, 8]), a = ri(r, 1, d - 2), b = ri(r, a + 2, d + (r() < 0.5 ? 0 : d)); if ((a + b) % 2) return h.generateAgain(id, L, r);
      const ans = [(a + b) / 2, d];
      return choice(id, { prompt: 'איזה מספר נמצא בדיוק באמצע?', expr: `${mixed(simp([a, d]))}   ↔   ${mixed(simp([b, d]))}`, answer: mixed(simp(ans)), choices: fchoice(r, ans, [[(a + b) / 2 + 1, d], [(a + b) / 2 - 1, d], [a + b, d], [b - a, d]]), hint: { type: 'text', text: 'מחברים את שני המספרים ומחלקים ב-2' } });
    }
    const to = L === 1 ? 1 : pick(r, [2, 3]), parts = pick(r, L === 1 ? [4, 5, 6, 8, 10] : [2, 3, 4, 5]);
    const k = ri(r, 1, to * parts - 1); if (k % parts === 0) return h.generateAgain(id, L, r);
    const ans = [k, parts];
    return choice(id, { prompt: 'לאיזה מספר מצביע החץ?', visual: { type: 'numberline', from: 0, to, parts, at: k / parts }, answer: mixed(simp(ans)), choices: fchoice(r, ans, [[k + 1, parts], [k - 1 || k + 2, parts], [k, parts + 1], [k, parts * to]]), hint: { type: 'text', text: `כל שלם מחולק ל-${parts} חלקים שווים. ספרי חלקים מה-0.` } });
  });

  S('g6_frac_of', '2.4', '2', 'חלק מכמות ובעיות', '🍬', (L, r) => {
    const id = 'g6_frac_of', g = pick(r, NAMES);
    const fr = () => { const d = pick(r, [3, 4, 5, 6, 8, 10]); return [ri(r, 1, d - 1), d]; };
    if (L === 1) { const [n, d] = fr(), tot = d * ri(r, 3, 15); return num(id, { prompt: `כמה זה ${n}/${d} מ-${tot}?`, answer: (tot / d) * n, hint: { type: 'text', text: `מחלקים במכנה ומכפילים במונה: ${tot} : ${d} × ${n}` } }); }
    if (L === 2) {
      if (r() < 0.5) { const [n, d] = fr(), whole = d * ri(r, 2, 12); return num(id, { prompt: `${n}/${d} מהמספר הם ${(whole / d) * n}. מהו המספר כולו?`, answer: whole, hint: { type: 'text', text: `קודם מוצאים 1/${d}: ${(whole / d) * n} : ${n}` } }); }
      const [n, d] = fr(), tot = d * ri(r, 3, 6); return num(id, { prompt: `בכיתה ${tot} תלמידים. ${n}/${d} מהם בנים. כמה בנות יש בכיתה?`, answer: tot - (tot / d) * n });
    }
    const t = ri(r, 0, 2);
    if (t === 0) { const k = pick(r, [4, 5, 6, 10]), price = k * ri(r, 12, 60); return num(id, { prompt: `מחיר משחק ${price} ₪. בחנות נותנים הנחה של 1/${k} מהמחיר. כמה משלמים?`, answer: price - price / k }); }
    if (t === 1) { const tot = 12 * ri(r, 2, 8); return num(id, { prompt: `בגינה ${tot} עצים. 1/3 מהם עצי לימון, 1/4 מהם עצי תפוז, והשאר עצי זית. כמה עצי זית בגינה?`, answer: tot - tot / 3 - tot / 4 }); }
    const pages = 20 * ri(r, 6, 20); return num(id, { prompt: `${g} קראה ביום הראשון 2/5 מהספר וביום השני 1/4 מהספר. בספר ${pages} עמודים. כמה עמודים נשארו לה?`, answer: pages - (pages * 2) / 5 - pages / 4, hint: { type: 'text', text: '2/5 + 1/4 = 13/20, נשאר 7/20 מהספר' } });
  });

  S('g6_frac_sense', '2.5', '2', 'תובנה מספרית בשברים', '🤔', (L, r) => {
    const id = 'g6_frac_sense';
    if (L === 1) {
      const d1 = ri(r, 2, 9), n1 = ri(r, 1, d1 - 1), d2 = ri(r, 2, 9), n2 = ri(r, 1, d2 - 1);
      const v = n1 * d2 + n2 * d1 - d1 * d2;
      return choice(id, { prompt: 'בלי לחשב במדויק: התוצאה גדולה מ-1, קטנה מ-1 או שווה ל-1?', expr: `1 ◻ ${n1}/${d1} + ${n2}/${d2}`, answer: v > 0 ? '<' : v < 0 ? '>' : '=', choices: ['<', '=', '>'], hint: { type: 'text', text: 'השווי כל שבר ל-1/2' } });
    }
    if (L === 2) {
      const base = pick(r, [6, 4, 8, 3, 5]), q = ri(r, 4, 15), tot = base * q;
      const vars = [[`${base - 1}/${base} מ-${tot}`, q * (base - 1)], [`1/${base} מ-${tot * 2}`, q * 2], [`1/${base * 2} מ-${tot}`, q / 2]];
      if (base % 2 === 0) vars.push([`1/${base / 2} מ-${tot}`, q * 2]);
      const [e, ans] = pick(r, vars.filter((v) => Number.isInteger(v[1])));
      return num(id, { prompt: `נתון: 1/${base} מ-${tot} הוא ${q}. חשבי בלי להתחיל מההתחלה: כמה זה ${e}?`, answer: ans });
    }
    const A = pick(r, [[8, 9, 7, 8], [5, 9, 3, 7], [100, 101, 99, 100], [6, 7, 5, 6], [4, 9, 2, 5], [11, 12, 13, 14]]);
    const [a, b, c, d] = A, big = a * d > c * b ? `${a}/${b}` : `${c}/${d}`;
    return choice(id, { prompt: 'בלי להרחיב למכנה משותף: איזה שבר גדול יותר?', answer: big, choices: shuffle(r, [`${a}/${b}`, `${c}/${d}`]), hint: { type: 'text', text: 'כמה חסר לכל שבר עד 1? למי שחסר פחות — גדול יותר. או השווי ל-1/2.' } });
  });

  // ===================== פרק 3 · מספרים עשרוניים =====================
  S('g6_dec_place', '3.1', '3', 'מבנה המספר העשרוני', '🔍', (L, r) => {
    const id = 'g6_dec_place';
    if (L === 1) {
      const t = ri(r, 0, 2);
      if (t === 0) { const pos = ri(r, -3, 1); const val = 7 * 10 ** pos; const no7 = (lo) => { let x; do x = ri(r, lo, 9); while (x === 7); return x; }; const parts = [no7(1), no7(0), no7(0), no7(0), no7(0)]; parts[1 - pos] = 7; const s = `${parts[0]}${parts[1]}.${parts[2]}${parts[3]}${parts[4]}`.replace(/^0(?=\d)/, ''); return choice(id, { prompt: `מהו ערך הספרה 7 במספר ${s}?`, answer: fmt(round(val, 4)), choices: shuffle(r, ['70', '7', '0.7', '0.07', '0.007'].filter((x) => x !== fmt(round(val, 4))).slice(0, 3).concat(fmt(round(val, 4)))) }); }
      if (t === 1) { const w = ri(r, 1, 40), a = ri(r, 1, 9), b = ri(r, 0, 9); return num(id, { prompt: 'כתבי כמספר עשרוני', expr: `${w} + ${a}/10 + ${b}/100 = ?`, answer: round(w + a / 10 + b / 100) }); }
      const [p, q] = pick(r, [[1, 4], [3, 4], [1, 2], [3, 5], [2, 5], [7, 20], [1, 8], [9, 25], [3, 50], [1, 5]]); return num(id, { prompt: 'כתבי כמספר עשרוני', expr: `${p}/${q} = ?`, answer: round(p / q), hint: { type: 'text', text: 'הרחיבי למכנה 10, 100 או 1000' } });
    }
    if (L === 2) {
      if (r() < 0.5) {
        const pairs = [[0.45, 0.5], [2.8, 2.08], [3.4, 3.40], [0.1, 0.099], [7.05, 7.5], [0.3, 0.30], [1.25, 1.205], [4.6, 4.59]].map(([a, b]) => (r() < 0.5 ? [a, b] : [b, a]));
        const [a, b] = pick(r, pairs); const sa = a === 3.4 || a === 0.3 ? fmt(a) : fmt(a), sb = b === 3.4 ? '3.40' : b === 0.3 ? '0.30' : fmt(b);
        return choice(id, { prompt: 'השלימי את הסימן המתאים', expr: `${sa} ◻ ${sb}`, answer: a > b ? '>' : a < b ? '<' : '=', choices: ['<', '=', '>'], hint: { type: 'text', text: 'הוסיפי אפסים בסוף כדי שיהיה אותו מספר ספרות אחרי הנקודה' } });
      }
      const [p, q] = pick(r, [[3, 4], [1, 4], [1, 25], [2, 5], [3, 20], [1, 8]]); const dec = fmt(p / q);
      return choice(id, { prompt: 'כתבי כשבר מצומצם', expr: `${dec} = ?`, answer: `${p}/${q}`, choices: fractionChoices(r, [p, q], [[p + 1, q], [p, q * 10], [Number(dec.split('.')[1]), 10], [q - p > 0 ? q - p : p + 2, q]]) });
    }
    if (r() < 0.5) { const n = ri(r, 1001, 9999) / 1000 + ri(r, 0, 20); const [to, d] = pick(r, [['למספר שלם', 0], ['לעשיריות', 1], ['למאיות', 2]]); return num(id, { prompt: `עגלי את ${fmt(round(n, 3))} ${to}`, answer: round(Math.round(round(n, 3) * 10 ** d + 1e-9) / 10 ** d, 3) }); }
    const n = ri(r, 11, 9999) / 100, [op, k] = pick(r, [['×', 10], ['×', 100], [':', 10], [':', 100], ['×', 1000]]);
    return num(id, { prompt: 'חשבי', expr: `${fmt(n)} ${op} ${k} = ?`, answer: round(op === '×' ? n * k : n / k, 6), hint: { type: 'text', text: `${op === '×' ? 'כפל' : 'חילוק'} ב-${k}: מזיזים את הנקודה ${String(k).length - 1} מקומות ${op === '×' ? 'ימינה' : 'שמאלה'}` } });
  });

  S('g6_dec_add', '3.2', '3', 'חיבור וחיסור עשרוניים', '💧', (L, r) => {
    const id = 'g6_dec_add', g = pick(r, NAMES);
    const dec = (lo, hi, places) => ri(r, lo * 10 ** places, hi * 10 ** places) / 10 ** places;
    const hint = { type: 'text', text: 'מיישרים נקודה מתחת לנקודה, ומוסיפים אפסים בסוף אם צריך' };
    if (L === 1) { const a = dec(1, 20, pick(r, [1, 2])), b = dec(1, 20, pick(r, [1, 2])); if (r() < 0.5) return num(id, { prompt: 'חשבי במאונך', expr: `${fmt(a)} + ${fmt(b)} = ?`, answer: round(a + b), hint }); const [x, y] = a > b ? [a, b] : [b, a]; return num(id, { prompt: 'חשבי במאונך', expr: `${fmt(x)} − ${fmt(y)} = ?`, answer: round(x - y), hint }); }
    if (L === 2) {
      const t = ri(r, 0, 2);
      if (t === 0) { const w = pick(r, [5, 10, 20]), b = dec(1, w - 1, 2); return num(id, { prompt: 'חשבי במאונך', expr: `${w} − ${fmt(b)} = ?`, answer: round(w - b), hint: { type: 'text', text: `${w} = ${w}.00` } }); }
      if (t === 1) { const a = dec(0, 3, 2), b = dec(1, 4, 1), c = dec(1, 5, 2); return num(id, { prompt: 'חשבי במאונך', expr: `${fmt(a)} + ${fmt(b)} + ${fmt(c)} = ?`, answer: round(a + b + c), hint }); }
      const a = dec(1, 9, 1), x = dec(1, 9, 2), tot = round(a + x); return r() < 0.5 ? num(id, { prompt: 'השלימי את המספר החסר', expr: `${fmt(a)} + ? = ${fmt(tot)}`, answer: x }) : num(id, { prompt: 'השלימי את המספר החסר', expr: `? − ${fmt(x)} = ${fmt(a)}`, answer: tot });
    }
    const t = ri(r, 0, 3);
    if (t === 0) { const a = dec(5, 20, 2), b = dec(3, 15, 2), bill = pick(r, [50, 100].filter((v) => v > a + b)); return num(id, { prompt: `${g} קנתה מחברת ב-${fmt(a)} ₪ ועט ב-${fmt(b)} ₪. היא שילמה בשטר של ${bill} ₪. כמה עודף קיבלה?`, answer: round(bill - a - b) }); }
    if (t === 1) { const h1 = dec(1.2, 1.6, 2), d = dec(0.05, 0.3, 2); return num(id, { prompt: `גובהה של ${g} ${fmt(h1)} מטר. אחיה גבוה ממנה ב-${fmt(d)} מטר. מה גובה אחיה?`, answer: round(h1 + d) }); }
    if (t === 2) { const c1 = dec(0.2, 0.6, 2), c2 = dec(0.2, 0.6, 1); return num(id, { prompt: `בבקבוק היו 2 ליטרים מיץ. מזגו כוס של ${fmt(c1)} ליטר וכוס של ${fmt(c2)} ליטר. כמה מיץ נשאר?`, answer: round(2 - c1 - c2) }); }
    const a = dec(1, 4, 1), b = dec(1, 4, 2), c = dec(1, 4, 1), goal = Math.ceil(a + b + c) + ri(r, 1, 3); return num(id, { prompt: `${g} רצה שלושה ימים: ${fmt(a)} ק"מ, ${fmt(b)} ק"מ ו-${fmt(c)} ק"מ. המטרה היא ${goal} ק"מ. כמה חסר לה?`, answer: round(goal - a - b - c) });
  });

  S('g6_dec_sense', '3.3', '3', 'תובנה בעשרוניים', '🧠', (L, r) => {
    const id = 'g6_dec_sense';
    if (L === 1) { const d = pick(r, [10, 100, 1000]), part = ri(r, 1, d - 1) / d; return num(id, { prompt: 'השלימי כך שהסכום יהיה 1', expr: `${fmt(part)} + ? = 1`, answer: round(1 - part), hint: { type: 'text', text: '1 = 1.000' } }); }
    if (L === 2) {
      const a = ri(r, 101, 899) / 100, b = ri(r, 101, 499) / 100, c = round(a + b);
      const vars = [[`${fmt(a)} + ${fmt(round(b + 0.1))}`, round(c + 0.1), 'מחובר אחד גדול ב-0.1 ← גם הסכום'], [`${fmt(c)} − ${fmt(b)}`, a, 'חיסור הוא הפעולה ההפוכה'], [`${fmt(c)} − ${fmt(a)}`, b, 'חיסור הוא הפעולה ההפוכה'], [`${fmt(round(a + 1))} + ${fmt(b)}`, round(c + 1), 'גדול ב-1 ← גם הסכום'], [`${fmt(round(a * 10))} + ${fmt(round(b * 10))}`, round(c * 10), 'שני המחוברים גדולים פי 10 ← גם הסכום']];
      const [e, ans, tip] = pick(r, vars);
      return num(id, { prompt: `נתון: ${fmt(a)} + ${fmt(b)} = ${fmt(c)}. היעזרי בתרגיל הפתור.`, expr: `${e} = ?`, answer: ans, hint: { type: 'text', text: tip } });
    }
    const target = pick(r, [5, 10]);
    const forms = [() => { const x = round(target / 2 - ri(r, 1, 3) / 100); return [`${fmt(x)} + ${fmt(x)}`, 2 * x]; }, () => { const x = ri(r, 100, 400) / 100; return [`${fmt(x)} + ${fmt(round(target - x))}`, target]; }, () => { const x = ri(r, 101, 399) / 100; const y = round(target + x + pick(r, [-0.05, 0.05, 0])); return [`${fmt(y)} − ${fmt(x)}`, round(y - x)]; }];
    const [e, v] = pick(r, forms)();
    return choice(id, { prompt: `בלי לחשב במדויק: התוצאה גדולה מ-${target}, קטנה או שווה?`, expr: `${target} ◻ ${e}`, answer: target > v + 1e-9 ? '>' : target < v - 1e-9 ? '<' : '=', choices: ['<', '=', '>'] });
  });

  // ===================== פרק 4 · גיאומטריה =====================
  const SHAPES = ['מקבילית', 'מלבן', 'מעוין', 'ריבוע', 'טרפז', 'דלתון'];
  const PROPS = [
    ['שני זוגות של צלעות נגדיות מקבילות', [1, 1, 1, 1, 0, 0]],
    ['כל הצלעות שוות', [0, 0, 1, 1, 0, 0]],
    ['כל הזוויות ישרות', [0, 1, 0, 1, 0, 0]],
    ['כל שתי צלעות נגדיות שוות', [1, 1, 1, 1, 0, 0]],
    ['כל שתי זוויות נגדיות שוות', [1, 1, 1, 1, 0, 0]],
    ['האלכסונים שווים זה לזה', [0, 1, 0, 1, 0, 0]],
    ['האלכסונים מאונכים זה לזה', [0, 0, 1, 1, 0, 1]],
    ['האלכסונים חוצים זה את זה', [1, 1, 1, 1, 0, 0]],
    ['זוג אחד בלבד של צלעות מקבילות', [0, 0, 0, 0, 1, 0]]
  ];
  const FACTS = [
    ['כל ריבוע הוא מלבן', 1], ['כל מלבן הוא ריבוע', 0], ['כל מעוין הוא מקבילית', 1], ['יש מלבן שהוא גם מעוין', 1],
    ['כל מקבילית היא מלבן', 0], ['כל ריבוע הוא מעוין', 1], ['טרפז הוא מקבילית', 0], ['כל מלבן הוא מקבילית', 1],
    ['בכל משולש יש 3 גבהים', 1], ['גובה במשולש נמצא תמיד בתוך המשולש', 0], ['במשולש ישר זווית, שני הניצבים הם גם גבהים', 1],
    ['למקבילית יש רק גובה אחד', 0], ['במלבן, כל צלע היא גם גובה לצלע הסמוכה לה', 1], ['כל מעוין הוא ריבוע', 0]
  ];
  const RIDDLES = [
    ['יש לי 4 זוויות ישרות, אבל לא כל הצלעות שלי שוות.', 'מלבן'], ['כל הצלעות שלי שוות, אבל אין לי זוויות ישרות.', 'מעוין'],
    ['יש לי זוג אחד בלבד של צלעות מקבילות.', 'טרפז'], ['יש לי שני זוגות של צלעות סמוכות שוות, ואין לי צלעות מקבילות.', 'דלתון'],
    ['כל הצלעות שלי שוות וכל הזוויות שלי ישרות.', 'ריבוע'], ['הצלעות הנגדיות שלי מקבילות ושוות, אבל הזוויות שלי לא ישרות והצלעות לא כולן שוות.', 'מקבילית']
  ];

  S('g6_quads', '4.2', '4', 'מרובעים ויחסי הכלה', '🔷', (L, r) => {
    const id = 'g6_quads';
    if (L === 1) { const [q, a] = pick(r, RIDDLES); return choice(id, { prompt: `מי אני? ${q}`, answer: a, choices: shuffle(r, shuffle(r, SHAPES).filter((s) => s !== a).slice(0, 3).concat(a)) }); }
    if (L === 2) { const [f, t] = pick(r, FACTS); return choice(id, { prompt: `נכון או לא נכון? ${f}.`, answer: t ? 'נכון' : 'לא נכון', choices: TF }); }
    const [p, row] = pick(r, PROPS), si = ri(r, 0, 5);
    return choice(id, { prompt: `נכון או לא נכון? ב${SHAPES[si]} — ${p}, תמיד.`, answer: row[si] ? 'נכון' : 'לא נכון', choices: TF, hint: { type: 'text', text: 'ריבוע הוא גם מלבן וגם מעוין; מלבן ומעוין הם מקביליות מיוחדות' } });
  });

  S('g6_angles', '4.2', '4', 'זוויות במרובעים', '📐', (L, r) => {
    const id = 'g6_angles';
    if (L === 1) { const a = ri(r, 35, 85); const [sh] = pick(r, [['מקבילית'], ['מעוין']]); return num(id, { prompt: `ב${sh} זווית אחת היא ${a}°. מה גודל הזווית הסמוכה לה?`, answer: 180 - a, hint: { type: 'text', text: 'במקבילית, שתי זוויות סמוכות משלימות ל-180°' } }); }
    if (L === 2) { const a = ri(r, 95, 145); return num(id, { prompt: `ב${pick(r, ['מקבילית', 'מעוין'])} זווית אחת היא ${a}°. מה גודל הזווית הנגדית לה?`, answer: a, hint: { type: 'text', text: 'זוויות נגדיות במקבילית שוות' } }); }
    const a = ri(r, 70, 100), b = ri(r, 75, 115), c = ri(r, 60, 120); const d = 360 - a - b - c;
    if (d <= 20 || d >= 180) return num(id, { prompt: 'במרובע שלוש זוויות הן 90°, 85° ו-110°. מהי הזווית הרביעית?', answer: 75, hint: { type: 'text', text: 'סכום הזוויות במרובע 360°' } });
    return num(id, { prompt: `במרובע שלוש זוויות הן ${a}°, ${b}° ו-${c}°. מהי הזווית הרביעית?`, answer: d, hint: { type: 'text', text: 'סכום הזוויות במרובע 360°' } });
  });

  S('g6_area', '4.4', '4', 'היקף ושטח', '📏', (L, r) => {
    const id = 'g6_area';
    if (L === 1) {
      const w = ri(r, 4, 15), hh = ri(r, 2, w - 1), askP = r() < 0.5;
      return num(id, { prompt: `מלבן שאורכו ${w} ס"מ ורוחבו ${hh} ס"מ. מה ${askP ? 'ההיקף שלו (בס"מ)' : 'השטח שלו (בסמ"ר)'}?`, visual: { type: 'rect', w, h: hh }, answer: askP ? 2 * (w + hh) : w * hh, hint: { type: 'text', text: askP ? 'היקף = 2 × (אורך + רוחב)' : 'שטח = אורך × רוחב' } });
    }
    if (L === 2) {
      const t = ri(r, 0, 2);
      if (t === 0) { const s = ri(r, 3, 15), askSide = r() < 0.5; return num(id, { prompt: `היקפו של ריבוע ${4 * s} ס"מ. ${askSide ? 'מה אורך הצלע (בס"מ)?' : 'מה שטחו (בסמ"ר)?'}`, answer: askSide ? s : s * s, hint: { type: 'text', text: `לריבוע 4 צלעות שוות: ${4 * s} : 4` } }); }
      if (t === 1) { const l = ri(r, 6, 15), w = ri(r, 2, l - 1), askW = r() < 0.5; return num(id, { prompt: `שטחו של מלבן ${l * w} סמ"ר ואורכו ${l} ס"מ. ${askW ? 'מה רוחבו (בס"מ)?' : 'מה היקפו (בס"מ)?'}`, answer: askW ? w : 2 * (l + w), hint: { type: 'text', text: `רוחב = שטח : אורך = ${l * w} : ${l}` } }); }
      const L2 = ri(r, 8, 25), W2 = ri(r, 4, L2 - 2), price = pick(r, [10, 15, 20, 25, 30]); return num(id, { prompt: `גינה מלבנית ${L2} מ' על ${W2} מ'. מטר גדר עולה ${price} ₪. כמה תעלה גדר סביב כל הגינה?`, answer: 2 * (L2 + W2) * price, hint: { type: 'text', text: 'קודם מחשבים את ההיקף' } });
    }
    const base = ri(r, 6, 14), hgt = ri(r, 3, 8), side = hgt + ri(r, 1, 4);
    if (r() < 0.6) { const askA = r() < 0.6; return num(id, { prompt: `מקבילית: הצלע ${base} ס"מ, הצלע הסמוכה ${side} ס"מ, והגובה לצלע של ${base} הוא ${hgt} ס"מ. מה ${askA ? 'השטח (בסמ"ר)' : 'ההיקף (בס"מ)'}?`, visual: { type: 'para', base, side, height: hgt }, answer: askA ? base * hgt : 2 * (base + side), hint: { type: 'text', text: askA ? 'שטח מקבילית = צלע × הגובה לצלע — לא הצלע הסמוכה!' : 'היקף = סכום כל הצלעות' } }); }
    return num(id, { prompt: `שטחה של מקבילית ${base * hgt} סמ"ר, והגובה לאחת הצלעות ${hgt} ס"מ. מה אורך הצלע?`, answer: base, hint: { type: 'text', text: 'צלע = שטח : גובה' } });
  });

  S('g6_composite', '4.5', '4', 'צורות מורכבות', '🧱', (L, r) => {
    const id = 'g6_composite';
    if (L === 3) { const W = ri(r, 8, 14), H = ri(r, 6, W), w = ri(r, 2, W - 3), hh = ri(r, 2, H - 3); return num(id, { prompt: `מסגרת: מלבן חיצוני ${W} ס"מ על ${H} ס"מ, ובתוכו מלבן ריק ${w} ס"מ על ${hh} ס"מ. מה שטח המסגרת (בסמ"ר)?`, visual: { type: 'frame', W, H, w, h: hh }, answer: W * H - w * hh, hint: { type: 'text', text: 'שטח גדול פחות שטח החור' } }); }
    const W = ri(r, 8, 14), H = ri(r, 6, 12), top = ri(r, 3, W - 2), right = ri(r, 2, H - 2);
    const askP = L === 2 && r() < 0.5;
    return num(id, { prompt: `חשבי את ${askP ? 'ההיקף (בס"מ)' : 'השטח (בסמ"ר)'} של הצורה. המידות בס"מ.`, visual: { type: 'lshape', W, H, top, right }, answer: askP ? 2 * (W + H) : W * H - (W - top) * (H - right), hint: { type: 'text', text: askP ? 'מצאי קודם את הצלעות החסרות. טיפ: ההיקף כמו של המלבן הגדול!' : 'השלימי למלבן גדול והחסירי את הפינה החסרה, או חלקי לשני מלבנים' } });
  });

  // ===================== בהמשך השנה (not in the review booklet) =====================
  S('g6_percent', 'x', 'x', 'אחוזים', '💯', (L, r) => {
    const p = L === 1 ? pick(r, [50, 10]) : L === 2 ? pick(r, [25, 20, 5]) : pick(r, [15, 30, 75, 40]);
    const unit = 100 / gcd(p, 100), n = unit * ri(r, 1, Math.max(2, Math.floor(400 / unit)));
    return num('g6_percent', { prompt: `כמה זה ${p}% מ-${n}?`, answer: (n * p) / 100, hint: { type: 'text', text: `10% מ-${n} זה ${fmt(n / 10)}` } });
  }, { extra: true });

  S('g6_frac_mult', 'x', 'x', 'כפל שברים', '🧪', (L, r) => {
    if (L === 1) { const d = pick(r, [2, 3, 4, 5]), n = ri(r, 1, d - 1), w = d * ri(r, 1, 6); return num('g6_frac_mult', { expr: `${n}/${d} × ${w} = ?`, answer: (w / d) * n }); }
    const d1 = ri(r, 2, 6), n1 = ri(r, 1, d1 - 1), d2 = ri(r, 2, L === 2 ? 5 : 9), n2 = ri(r, 1, d2 - 1), ans = [n1 * n2, d1 * d2];
    return choice('g6_frac_mult', { expr: `${n1}/${d1} × ${n2}/${d2} = ?`, answer: mixed(simp(ans)), choices: fchoice(r, ans, [[n1 + n2, d1 + d2], [n1 * n2, d1 + d2], [n1 * d2, d1 * n2], [ans[0] + 1, ans[1]]]), hint: { type: 'text', text: 'מונה כפול מונה, מכנה כפול מכנה' } });
  }, { extra: true });
}
