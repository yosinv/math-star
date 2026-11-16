// Character pictures shared with English Star.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { CHARS, avatarHTML, avatarEmoji, characterOf } from '../public/js/kid-pic.js';

test('every character has its picture file', () => {
  for (const [id, [file]] of Object.entries(CHARS)) assert.ok(existsSync(new URL(`../public/assets/chars/${file}.webp`, import.meta.url)), id);
});
test('char:<id> and matching emoji draw the picture; others stay emoji; unknown → 🧒', () => {
  assert.match(avatarHTML({ character: 'owl' }), /src="\/assets\/chars\/owl\.webp"/);
  assert.match(avatarHTML({ avatar: '🦊' }), /fox\.webp/);
  assert.equal(avatarHTML({ avatar: '🐼' }), '🐼');
  assert.equal(avatarHTML({ character: 'nope' }), '🧒');
  assert.equal(avatarEmoji({ character: 'girl' }), '👧');
  assert.equal(characterOf({ character: '"><script>' }), null);
  assert.equal(avatarHTML({ avatar: '<b>' }), '&lt;b&gt;');
});
