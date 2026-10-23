// One interface for both ways Math Star stores progress:
//   guest — no parent signed in: profiles and progress on this device (store.js), as before;
//   cloud — a parent is signed in: the family's children come from English Star's database,
//           and each child's math progress is loaded from and saved to the server.
// Pages call openSession() and then use state / active() / persist() the same way in both.
import { load, save, baseChild, mergeKids, toSharedAvatar } from './store.js';
export { mergeKids, toSharedAvatar };
import { wasSignedIn, signedInClerk, api, makeSaver } from './account.js';

const ACTIVE_KEY = 'mathStarActiveChildId';
const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* ignore */ } };

export function cloudProfile(ch) {
  return {
    id: ch.id,
    name: ch.displayName,
    avatar: ch.avatar || '🧒',
    grade: ch.mathGrade || null,
    gender: ch.gender || null,
    needsSetup: !ch.gender || !ch.mathGrade,
    hasProgress: ch.hasProgress,
    cloud: true
  };
}

// opts.saveErrors(err) — called once when saving starts failing (to show a message).
export async function openSession({ onSaveError, onSaved } = {}) {
  if (wasSignedIn()) {
    const clerk = await signedInClerk();
    if (clerk) {
      try {
        const me = await api('/api/math/me');
        const profiles = me.children.map(cloudProfile);
        let activeId = lsGet(ACTIVE_KEY);
        if (!profiles.some((p) => p.id === activeId)) activeId = null;
        const state = { profiles, activeId, kids: {}, pinSet: me.pinSet, frozen: me.isFrozen };
        const savers = {};
        const session = {
          mode: 'cloud',
          state,
          clerk,
          async loadKid(id) {
            const res = await api(`/api/math/children/${encodeURIComponent(id)}/state`);
            state.kids[id] = { ...baseChild(), ...(res.state || {}) };
            return state.kids[id];
          },
          setActive(id) { state.activeId = id; lsSet(ACTIVE_KEY, id); },
          persist() {
            const id = state.activeId;
            if (!id || !state.kids[id]) return;
            (savers[id] ||= makeSaver(id, { onError: onSaveError, onSaved })).save(state.kids[id]);
          },
          flush() { return Promise.all(Object.values(savers).map((s) => s.flush())); }
        };
        return session;
      } catch (e) {
        // Signed in but the server is unreachable / not ready: say so instead of silently using device data.
        return { mode: 'cloud-error', error: e, state: { profiles: [], activeId: null, kids: {} }, persist() {}, setActive() {}, async loadKid() {} };
      }
    }
  }
  const state = load();
  return {
    mode: 'guest',
    state,
    async loadKid(id) { state.kids[id] = { ...baseChild(), ...(state.kids[id] || {}) }; return state.kids[id]; },
    setActive(id) { state.activeId = id; save(state); },
    persist() { save(state); },
    flush() { return Promise.resolve(); }
  };
}

// ---------------------------------------------------------------------------
// Moving device progress into the family account (first sign-in on a device).
// ---------------------------------------------------------------------------
export function hasDeviceProgress() {
  const s = load();
  return s.profiles.some((p) => { const k = s.kids[p.id] || {}; return (k.answered || 0) > 0 || (k.xp || 0) > 0 || (k.homework || []).length > 0; });
}

