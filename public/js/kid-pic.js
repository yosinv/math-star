// A child's character, drawn the same way as on English Star.
// English Star stores avatar_object_key as "char:<id>" (a character picture) or "emoji:<char>".
// The Worker sends `character` (the id) and `avatar` (the emoji, if any); the pictures are
// copies of English Star's, in /assets/chars/. Text-only places (a <select>) use the emoji.
export const CHARS = {
  boy: ['brother', '👦'], girl: ['sister', '👧'], friend: ['friend', '🧑‍🤝‍🧑'], baby: ['baby', '👶'],
  lion: ['lion', '🦁'], fox: ['fox', '🦊'], unicorn: ['unicorn', '🦄'], 'ice-dragon': ['ice-dragon', '🐲'],
  owl: ['owl', '🦉'], turtle: ['turtle', '🐢'], butterfly: ['butterfly', '🦋']
};
// Emoji that English Star also shows as a picture.
const FROM_EMOJI = { '🦁': 'lion', '🦊': 'fox', '🦄': 'unicorn', '🐲': 'ice-dragon', '🦋': 'butterfly' };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const characterOf = (p) => (CHARS[p?.character] ? p.character : FROM_EMOJI[p?.avatar] || null);
export const avatarEmoji = (p) => p?.avatar || CHARS[p?.character]?.[1] || '🧒';

// HTML for a profile's picture; `size` in px, or 1.25em (scales with the text) when omitted.
export function avatarHTML(p, size) {
  const id = characterOf(p);
  if (!id) return esc(avatarEmoji(p));
  const s = size ? size + 'px' : '1.25em';
  return `<img class="kid-pic" src="/assets/chars/${CHARS[id][0]}.webp" alt="" aria-hidden="true" style="width:${s};height:${s};object-fit:cover;border-radius:22%;vertical-align:middle;display:inline-block">`;
}
