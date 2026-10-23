// Device storage for Math Star: family profiles + per-child progress in localStorage.
// Same model as English Star's Block World (XP, gems, streak, levels), one record per child.
import { applyAnswer, newSkillStats, XP_FIRST_TRY, XP_SECOND_TRY } from './engine.js';

const KEY = 'mathstar.v1';
export const AVATARS = ['🦄', '🐱', '🦊', '🐼', '🐰', '🦋', '🐬', '🌟', '🌈', '👑', '🐢', '🦁', '🦖', '🐯', '⚽', '🚀'];
// 'f' = girl, 'm' = boy. Profiles created before this setting existed are girls.
export const genderOf = (profile) => (profile?.gender === 'm' ? 'm' : 'f');

export const todayStr = (d = new Date()) => {
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};
const yesterdayStr = () => { const d = new Date(); d.setDate(d.getDate() - 1); return todayStr(d); };

function baseChild() {
  return { xp: 0, gems: 0, streak: 0, lastDay: null, answered: 0, correct: 0, skills: {}, review: [], missions: {}, homework: [], games: {}, rounds: [] };
}
function baseState() { return { version: 1, profiles: [], activeId: null, kids: {} }; }

let memoryFallback = null;
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const s = raw ? JSON.parse(raw) : baseState();
    return { ...baseState(), ...s };
  } catch {
    return memoryFallback || (memoryFallback = baseState());
  }
}
export function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { memoryFallback = state; }
}

export function addProfile(state, { name, avatar, grade, gender }) {
  const id = 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  state.profiles.push({ id, name: name.trim().slice(0, 24), avatar, grade, gender: gender === 'm' ? 'm' : 'f', created: Date.now() });
  state.kids[id] = baseChild();
  state.activeId = id;
  return id;
}
export function updateProfile(state, id, patch) {
  const p = state.profiles.find((x) => x.id === id);
  if (p) Object.assign(p, patch);
}
export function removeProfile(state, id) {
  state.profiles = state.profiles.filter((p) => p.id !== id);
  delete state.kids[id];
  if (state.activeId === id) state.activeId = state.profiles[0]?.id || null;
}

// Returns { profile, kid } for the active child, or null.
export function active(state) {
  const profile = state.profiles.find((p) => p.id === state.activeId);
  if (!profile) return null;
  state.kids[profile.id] = { ...baseChild(), ...(state.kids[profile.id] || {}) };
  return { profile, kid: state.kids[profile.id] };
}

// Daily streak, same rule as English Star: practice yesterday -> +1, gap -> reset to 1.
export function touchDay(kid) {
  const t = todayStr();
  if (kid.lastDay === t) return false;
  kid.streak = kid.lastDay === yesterdayStr() ? (kid.streak || 0) + 1 : 1;
  kid.lastDay = t;
  return true;
}

// Record one finished question. `tries` is 1 or 2; correct=false means she never got it.
export function recordAnswer(kid, problem, correct, tries = 1) {
  touchDay(kid);
  kid.answered++;
  const firstTry = correct && tries === 1;
  if (firstTry) kid.correct++;
  let xp = 0;
  if (correct) xp = tries === 1 ? XP_FIRST_TRY : XP_SECOND_TRY;
  kid.xp += xp;

  let res = { levelUp: false, levelDown: false, cleared: false };
  if (problem.skill && problem.skill !== 'homework') {
    // Only a first-try answer counts as "correct" for adaptivity.
    res = applyAnswer(kid.skills[problem.skill] || newSkillStats(), firstTry);
    kid.skills[problem.skill] = res.stats;
  }

  // Review queue: anything not right on the first try comes back later.
  const k = problem.key;
  const inQueue = kid.review.findIndex((r) => r.key === k);
  if (!firstTry && inQueue < 0) {
    kid.review.push({ ...problem, addedAt: Date.now() });
    if (kid.review.length > 30) kid.review.shift();
  } else if (firstTry && inQueue >= 0) {
    kid.review.splice(inQueue, 1);
  }
  return { xp, ...res };
}

export function finishRound(kid, { skill, correct, total, xp }) {
  const perfect = total > 0 && correct === total;
  const gems = total >= 5 ? (perfect ? 3 : correct / total >= 0.7 ? 2 : 1) : 0;
  kid.gems += gems;
  kid.rounds.push({ at: Date.now(), skill, correct, total, xp });
  if (kid.rounds.length > 60) kid.rounds.splice(0, kid.rounds.length - 60);
  return { gems, perfect };
}

export function missionsToday(kid) {
  const t = todayStr();
  kid.missions = { [t]: { practice: false, review: false, game: false, ...(kid.missions?.[t] || {}) } };
  return kid.missions[t];
}
export function completeMission(kid, which) {
  const m = missionsToday(kid);
  if (m[which]) return false;
  m[which] = true;
  if (m.practice && m.review && m.game) kid.gems += 5;
  return true;
}

export function exportBackup(state) {
  return JSON.stringify({ app: 'math-star', exported: new Date().toISOString(), state }, null, 1);
}
export function importBackup(text) {
  const data = JSON.parse(text);
  if (data?.app !== 'math-star' || !Array.isArray(data.state?.profiles)) throw new Error('not a Math Star backup');
  return { ...baseState(), ...data.state };
}
