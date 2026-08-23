import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomAnonymousName, ANONYMOUS_MAX_AGE_DAYS } from '../guestNames.js';

test('randomAnonymousName : format « Invite-XXXX »', () => {
  const name = randomAnonymousName(() => false);
  assert.match(name, /^Invité-[A-Z0-9]{4}$/);
});

test('randomAnonymousName : evite les noms deja pris', () => {
  const taken = new Set<string>();
  const a = randomAnonymousName((n) => taken.has(n));
  taken.add(a);
  const b = randomAnonymousName((n) => taken.has(n));
  assert.notEqual(a, b);
  taken.add(b);
  const c = randomAnonymousName((n) => taken.has(n));
  assert.notEqual(c, a);
  assert.notEqual(c, b);
});

test('randomAnonymousName : repli meme si tout est pris', () => {
  const name = randomAnonymousName(() => true);
  assert.ok(name.length > 0);
});

test('ANONYMOUS_MAX_AGE_DAYS : purge apres 7 jours sans activite', () => {
  assert.equal(ANONYMOUS_MAX_AGE_DAYS, 7);
});
