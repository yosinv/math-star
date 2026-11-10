// Math Star moved from math-star.yosinv.workers.dev to math.englishstarkids.com (production
// sign-in only works on englishstarkids.com and its subdomains). Each address has its own
// browser storage, so device-only progress is carried over in the link itself:
//   old address → https://math.englishstarkids.com/index.html#move=<packed device state>
// The hash never reaches a server (not sent in requests or in the Referer header).
// Carrying the same progress twice is safe: a profile that is already there keeps whichever
// copy has more answers; nothing is added up twice.

export const HOME_ORIGIN = 'https://math.englishstarkids.com';
export const onOldAddress = (host = globalThis.location?.hostname || '') => host.endsWith('.workers.dev');

const toB64url = (bytes) => {
  let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64url = (s) => {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
  return Uint8Array.from(b, (ch) => ch.charCodeAt(0));
};
async function pipe(bytes, Stream, format) {
  const out = new Response(new Blob([bytes]).stream().pipeThrough(new Stream(format)));
  return new Uint8Array(await out.arrayBuffer());
}

// Only the profiles and their progress travel; nothing else from the device.
export async function packState(state) {
  const json = JSON.stringify({ app: 'math-star', profiles: state.profiles || [], kids: state.kids || {}, activeId: state.activeId || null });
  const raw = new TextEncoder().encode(json);
  if (typeof CompressionStream === 'function') return 'z' + toB64url(await pipe(raw, CompressionStream, 'gzip'));
  return 'p' + toB64url(raw);
}

export async function unpackState(text) {
  const kind = text[0], body = fromB64url(text.slice(1));
  const bytes = kind === 'z' ? await pipe(body, DecompressionStream, 'gzip') : kind === 'p' ? body : null;
  if (!bytes) throw new Error('unknown move format');
  const data = JSON.parse(new TextDecoder().decode(bytes));
  if (data?.app !== 'math-star' || !Array.isArray(data.profiles)) throw new Error('not Math Star progress');
  return data;
}

// Adds the carried profiles to this device's state. Same profile id → keep the copy with more answers.
export function applyMove(local, incoming) {
  const out = { ...local, profiles: [...(local.profiles || [])], kids: { ...(local.kids || {}) } };
  let added = 0, updated = 0;
  for (const p of incoming.profiles || []) {
    if (!p?.id) continue;
    const theirs = incoming.kids?.[p.id];
    const i = out.profiles.findIndex((x) => x.id === p.id);
    if (i < 0) { out.profiles.push(p); if (theirs) out.kids[p.id] = theirs; added++; continue; }
    const mine = out.kids[p.id];
    if (theirs && (theirs.answered || 0) > (mine?.answered || 0)) { out.profiles[i] = p; out.kids[p.id] = theirs; updated++; }
  }
  if (!out.activeId && incoming.activeId && out.profiles.some((x) => x.id === incoming.activeId)) out.activeId = incoming.activeId;
  return { state: out, added, updated };
}

export const moveLink = async (state) => `${HOME_ORIGIN}/index.html#move=${await packState(state)}`;
