// Addressing the child in Hebrew: girl or boy.
//
// Text in the app is written in the feminine form (the original users are girls).
// For a boy's profile, gtext() rewrites the second-person forms to the masculine,
// using an explicit list — never a blind suffix rule, because Hebrew is full of
// look-alikes ("חלקי" is both "divide!" and "over" in "3 חלקי 4").
// Screens shared by several children are written in the neutral plural instead.
// Word-problem characters are NOT touched: their verbs agree with the character,
// not with the child (see person() in engine.js).

// Multi-word phrases first (where a single word would be ambiguous).
const PHRASES = [
  ['את אלופה', 'אתה אלוף'],
  ['בני מגדל', 'בנה מגדל'],
  ['חלקי לשני', 'חלק לשני'],
  ['ברוכה הבאה', 'ברוך הבא']
];

// Single words. A leading ו ("and") is handled automatically.
const WORDS = {
  // imperatives
  'בחרי': 'בחר', 'בואי': 'בוא', 'היעזרי': 'היעזר', 'הוסיפי': 'הוסף', 'הרחיבי': 'הרחב', 'השווי': 'השווה',
  'השלימי': 'השלם', 'התחילי': 'התחל', 'הורידי': 'הורד', 'החסירי': 'החסר', 'חשבי': 'חשב', 'ירדי': 'רד',
  'כתבי': 'כתוב', 'מצאי': 'מצא', 'נסי': 'נסה', 'סדרי': 'סדר', 'ספרי': 'ספור', 'עגלי': 'עגל', 'פרקי': 'פרק',
  'צמצמי': 'צמצם', 'שימי': 'שים', 'תספיקי': 'תספיק', 'תרגלי': 'תרגל', 'בדקי': 'בדוק',
  // "we / let's" plural (girls) -> masculine plural
  'מתחילות': 'מתחילים', 'ממשיכות': 'ממשיכים', 'משלימות': 'משלימים', 'מקבלות': 'מקבלים',
  'סופרות': 'סופרים', 'מוסיפות': 'מוסיפים', 'מורידות': 'מורידים', 'משווות': 'משווים', 'מכירות': 'מכירים',
  // present tense / adjectives about the child
  'שולטת': 'שולט', 'צריכה': 'צריך', 'משחקת': 'משחק', 'אלופה': 'אלוף'
};

const HE = 'א-ת';
const wordRe = new RegExp(`(^|[^${HE}])(ו?)(${Object.keys(WORDS).sort((a, b) => b.length - a.length).join('|')})(?![${HE}])`, 'g');

export function gtext(s, gender) {
  if (gender !== 'm' || !s) return s;
  let out = String(s);
  for (const [f, m] of PHRASES) out = out.split(f).join(m);
  return out.replace(wordRe, (_, pre, vav, w) => pre + vav + WORDS[w]);
}

// Keep every text node under `root` in the child's form, including text added later
// (new questions, toasts, summaries). Idempotent: masculine output never matches again.
let observer = null;
export let currentGender = 'f';
export function localize(root, gender) {
  observer?.disconnect();
  observer = null;
  currentGender = gender === 'm' ? 'm' : 'f';
  if (gender !== 'm') return;
  const fix = (node) => {
    if (node.nodeType === 3) {
      if (/^(SCRIPT|STYLE|TEXTAREA)$/.test(node.parentNode?.nodeName || '')) return;
      const t = gtext(node.data, gender);
      if (t !== node.data) node.data = t;
      return;
    }
    if (node.nodeType !== 1 || /^(SCRIPT|STYLE|TEXTAREA|INPUT)$/.test(node.nodeName)) return;
    if (node.title) node.title = gtext(node.title, gender);
    if (node.getAttribute?.('aria-label')) node.setAttribute('aria-label', gtext(node.getAttribute('aria-label'), gender));
    if (node.getAttribute?.('placeholder')) node.setAttribute('placeholder', gtext(node.getAttribute('placeholder'), gender));
    node.childNodes.forEach(fix);
  };
  fix(root);
  document.title = gtext(document.title, gender);
  observer = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === 'characterData') fix(m.target);
      else m.addedNodes.forEach(fix);
    }
  });
  observer.observe(root, { childList: true, subtree: true, characterData: true });
}
