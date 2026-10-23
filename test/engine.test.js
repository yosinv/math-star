import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SKILLS, GRADES, generate, generateRound, check, applyAnswer, newSkillStats, nextSkill,
  parseHomework, evaluateExpression, skillsForGrade, spoken, MAX_LEVEL
} from '../public/js/engine.js';

// Small seeded RNG so failures are reproducible.
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

test('every grade has skills', () => {
  for (const g of GRADES) assert.ok(skillsForGrade(g.id).length >= 3, g.id);
});

test('fuzz: every skill/level produces valid, self-consistent problems', () => {
  const rng = mulberry32(Number(process.env.SEED || 42));
  for (const s of SKILLS) {
    for (let L = 1; L <= MAX_LEVEL; L++) {
      for (let i = 0; i < 400; i++) {
        const p = generate(s.id, L, rng);
        const where = `${s.id} L${L} ${p.prompt} ${p.expr} -> ${p.answer}`;
        assert.ok(!/NaN|undefined|Infinity/.test(p.prompt + p.expr + p.answer), where);
        if (p.kind === 'number') {
          assert.ok(Number.isFinite(p.answer), where);
          assert.ok(p.answer >= 0, 'negative answer: ' + where);
          assert.ok(check(p, String(p.answer)), where);
          assert.ok(!check(p, String(p.answer + 1)), where);
          // Independent cross-check with the homework evaluator.
          if (/ = \?$/.test(p.expr) && !p.expr.includes('◻') && !/\d \d+\//.test(p.expr)) {
            const [n, d] = evaluateExpression(p.expr.replace(/ = \?$/, ''));
            assert.ok(Math.abs(n / d - p.answer) < 1e-9, 'evaluator disagrees: ' + where);
          } else if (p.expr.includes('?') && p.expr.includes('=')) {
            const r = parseHomework(p.expr);
            assert.equal(r.errors.length, 0, where + JSON.stringify(r.errors));
            assert.equal(r.items[0].answer, p.answer, 'missing-number disagrees: ' + where);
          }
        } else {
          assert.ok(Array.isArray(p.choices) && p.choices.length >= 2, where);
          assert.equal(new Set(p.choices).size, p.choices.length, 'dup choices: ' + where + ' ' + p.choices);
          assert.ok(p.choices.includes(p.answer), 'answer not in choices: ' + where + ' ' + p.choices);
          const FR = /^(\d+ )?\d+\/\d+$|^\d+$/;
          if (p.choices.some((c) => c.includes('/')) && p.choices.every((c) => FR.test(c))) {
            // exactly one choice must be equal in value to the answer
            const val = (f) => { const m = f.match(/^(?:(\d+) )?(\d+)\/(\d+)$/); return m ? Number(m[1] || 0) + Number(m[2]) / Number(m[3]) : Number(f); };
            const eq = p.choices.filter((c) => Math.abs(val(c) - val(p.answer)) < 1e-12);
            assert.equal(eq.length, 1, 'equivalent fraction distractor: ' + where + ' ' + p.choices);
            if (/ = \?$/.test(p.expr)) {
              const lhs = p.expr.replace(/ = \?$/, '').replace(/(\d+) (\d+)\/(\d+)/g, '($1 + $2/$3)');
              const [n, d] = evaluateExpression(lhs);
              assert.ok(Math.abs(n / d - val(p.answer)) < 1e-12, 'fraction evaluator disagrees: ' + where);
            }
          }
        }
        assert.ok(spoken(p).length > 0);
      }
    }
  }
});

test('rounds avoid repeats', () => {
  const r = generateRound('g3_times', 3, 10, mulberry32(7));
  assert.equal(r.length, 10);
  assert.equal(new Set(r.map((p) => p.key)).size, 10);
});

test('adaptivity: 4 in a row levels up, 2 misses level down', () => {
  let s = newSkillStats(); let res;
  for (let i = 0; i < 4; i++) res = applyAnswer(s = res ? res.stats : s, true);
  assert.equal(res.stats.level, 2); assert.equal(res.stats.cleared, 1); assert.ok(res.levelUp);
  res = applyAnswer(res.stats, false); res = applyAnswer(res.stats, false);
  assert.equal(res.stats.level, 1); assert.ok(res.levelDown);
  assert.equal(res.stats.cleared, 1, 'stars are kept');
});

test('nextSkill prefers struggling skill', () => {
  const stats = { g3_div: { ...newSkillStats(), hist: [0, 0, 1, 0, 0] } };
  assert.equal(nextSkill('3', stats), 'g3_div');
  assert.equal(nextSkill('3', {}), 'g3_times');
});

test('check accepts comma decimals and rejects junk', () => {
  const p = { kind: 'number', answer: 2.5 };
  assert.ok(check(p, '2,5')); assert.ok(check(p, '2.50')); assert.ok(!check(p, '')); assert.ok(!check(p, 'abc'));
});

test('homework parser', () => {
  const { items, errors } = parseHomework([
    '7 × 8', '56 : 7 =', '12 + 7 = ?', '(3 + 4) x 2', '3/4 + 1/4', '1/3 + 1/3',
    '7 × ? = 56', '? + 5 = 12', '2.5 + 1.25', 'כמה רגליים יש ל-3 כלבים? | 12', 'חצי ועוד רבע | 3/4',
    'hello', '5 ++', '10 : 0', ''
  ].join('\n'));
  const ans = items.map((i) => i.answer);
  assert.deepEqual(ans, [56, 8, 19, 14, 1, '2/3', 8, 7, 3.75, 12, '3/4']);
  assert.equal(items[0].expr, '7 × 8 = ?');
  assert.equal(items[1].expr, '56 : 7 = ?');
  assert.equal(items[6].expr, '7 × ? = 56');
  assert.equal(errors.length, 3);
  assert.ok(items[5].choices.includes('2/3'));
});

test('grade 6 follows the review booklet topics', () => {
  const topics = new Set(skillsForGrade('6').map((s) => s.topic));
  for (const t of ['1.1', '1.2', '1.3', '1.4', '2.1', '2.2', '2.3', '2.4', '2.5', '3.1', '3.2', '3.3', '4.2', '4.4', '4.5']) assert.ok(topics.has(t), t);
});

test('thousands separators are read correctly', () => {
  assert.deepEqual(evaluateExpression('10,003 − 4,768'), [5235, 1]);
  assert.deepEqual(evaluateExpression('2,5 + 1'), [7, 2]);
  assert.deepEqual(evaluateExpression('0,125 × 8'), [1, 1]);
  assert.equal(parseHomework('9,156 : 12').items[0].answer, 763);
});

import { KIDS } from '../public/js/engine.js';
import { gtext } from '../public/js/gender.js';

test('gtext: boy forms, girl forms untouched, ambiguous words safe', () => {
  assert.equal(gtext('כמעט! נסי שוב 💪', 'm'), 'כמעט! נסה שוב 💪');
  assert.equal(gtext('את אלופה! 👑', 'm'), 'אתה אלוף! 👑');
  assert.equal(gtext('התחילי מ-5 והורידי 2', 'm'), 'התחל מ-5 והורד 2');
  assert.equal(gtext('מוסיפות ומורידות', 'm'), 'מוסיפים ומורידים');
  assert.equal(gtext('3 חלקי 4', 'm'), '3 חלקי 4', 'fraction word must not change');
  assert.equal(gtext('או חלקי לשני מלבנים', 'm'), 'או חלק לשני מלבנים');
  assert.equal(gtext('בני מגדל של 10!', 'm'), 'בנה מגדל של 10!');
  assert.equal(gtext('ספרייה', 'm'), 'ספרייה', 'only whole words');
  assert.equal(gtext('חשבי במאונך', 'f'), 'חשבי במאונך');
  const once = gtext('חשבי, ספרי, השלימי, שולטת', 'm');
  assert.equal(gtext(once, 'm'), once, 'idempotent');
});

test('word problems: verbs agree with the character, both genders appear', () => {
  const FEM = /(^|[^א-ת])(היא|לה|ממנה|אחיה|גובהה|קנתה|חסכה|קראה|רצה|שילמה|חילקה|נתנה|קיבלה|לאחותה)(?![א-ת])/;
  const MASC = /(^|[^א-ת])(הוא|לו|ממנו|אחיו|גובהו|קנה|חסך|קרא|רץ|שילם|חילק|נתן|קיבל|לאחיו)(?![א-ת])/;
  const boys = KIDS.filter(([, g]) => g === 'm').map(([n]) => n), girls = KIDS.filter(([, g]) => g === 'f').map(([n]) => n);
  const seen = { f: 0, m: 0 };
  for (const id of ['g3_word', 'g6_word', 'g6_frac_of', 'g6_dec_add']) for (let L = 1; L <= 3; L++) for (let i = 0; i < 300; i++) {
    const prompt = generate(id, L).prompt.replace('המטרה היא', '');
    const boy = boys.find((n) => prompt.includes(n)), girl = girls.find((n) => prompt.includes(n));
    if (boy) { seen.m++; assert.ok(!FEM.test(prompt), 'feminine verb for a boy: ' + prompt); }
    if (girl) { seen.f++; assert.ok(!MASC.test(prompt) || /המשפחה/.test(prompt), 'masculine verb for a girl: ' + prompt); }
  }
  assert.ok(seen.f > 50 && seen.m > 50, JSON.stringify(seen));
});
