// Carrying device progress from the old workers.dev address to math.englishstarkids.com.
import test from 'node:test';
import assert from 'node:assert/strict';
import { packState, unpackState, applyMove, onOldAddress } from '../public/js/move.js';

const kid = (answered, xp = answered * 10) => ({ answered, xp, correct: answered, skills: {}, review: [], rounds: [] });
const device = {
  version: 1,
  activeId: 'p1',
  profiles: [{ id: 'p1', name: 'Tal', avatar: '🦊', grade: '4', gender: 'f' }, { id: 'p2', name: 'Gil', avatar: '🐼', grade: '6', gender: 'm' }],
  kids: { p1: kid(40), p2: kid(12) }
};

test('old address is only workers.dev', () => {
  assert.equal(onOldAddress('math-star.yosinv.workers.dev'), true);
  assert.equal(onOldAddress('math.englishstarkids.com'), false);
  assert.equal(onOldAddress('localhost'), false);
});

test('pack → unpack keeps profiles and progress (and is URL-safe)', async () => {
  const packed = await packState(device);
  assert.match(packed, /^[zp][A-Za-z0-9_-]+$/);
  const back = await unpackState(packed);
  assert.deepEqual(back.profiles, device.profiles);
  assert.deepEqual(back.kids, device.kids);
  assert.equal(back.activeId, 'p1');
});

test('a large history still packs small enough for a link', async () => {
  const big = { ...device, kids: { p1: { ...kid(5000), rounds: Array.from({ length: 60 }, (_, i) => ({ at: i, skill: 'g4_place', correct: 8, total: 10 })) } } };
  const packed = await packState(big);
  assert.ok(packed.length < 200_000, `packed length ${packed.length}`);
});

test('junk is refused', async () => {
  await assert.rejects(unpackState('pbm90LWpzb24'));
  await assert.rejects(unpackState('x123'));
});

test('move into an empty device adds everything', () => {
  const { state, added, updated } = applyMove({ version: 1, profiles: [], kids: {}, activeId: null }, device);
  assert.equal(added, 2); assert.equal(updated, 0);
  assert.equal(state.profiles.length, 2);
  assert.equal(state.kids.p1.answered, 40);
  assert.equal(state.activeId, 'p1');
});

test('moving twice never doubles progress', () => {
  const once = applyMove({ profiles: [], kids: {} }, device).state;
  const twice = applyMove(once, device);
  assert.equal(twice.added, 0); assert.equal(twice.updated, 0);
  assert.equal(twice.state.kids.p1.xp, 400);
  assert.equal(twice.state.profiles.length, 2);
});

test('same profile: the copy with more answers wins; other local profiles stay', () => {
  const local = { profiles: [{ id: 'p1', name: 'Tal' }, { id: 'p9', name: 'Other' }], kids: { p1: kid(50), p9: kid(3) }, activeId: 'p9' };
  const { state, updated } = applyMove(local, device);
  assert.equal(updated, 0); // local p1 has more
  assert.equal(state.kids.p1.answered, 50);
  assert.equal(state.kids.p9.answered, 3);
  assert.equal(state.activeId, 'p9');
  const newer = applyMove({ profiles: [{ id: 'p1' }], kids: { p1: kid(5) } }, device);
  assert.equal(newer.updated, 1);
  assert.equal(newer.state.kids.p1.answered, 40);
});
