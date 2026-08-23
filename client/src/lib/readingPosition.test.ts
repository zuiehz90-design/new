import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextReadingVerse } from './readingPosition';

test('aucune position enregistrée -> on accepte le candidat', () => {
  assert.equal(nextReadingVerse(undefined, 5), 5);
});

test('descendre met à jour la position', () => {
  assert.equal(nextReadingVerse(10, 36), 36);
});

test('verset identique -> inchangé', () => {
  assert.equal(nextReadingVerse(10, 10), 10);
});

test('remonter ne régresse jamais (verset 1 ignoré)', () => {
  assert.equal(nextReadingVerse(100, 1), 100);
});

test('remonter légèrement ne régresse pas', () => {
  assert.equal(nextReadingVerse(100, 97), 100);
});

test('descendre encore après une remontée bloque met à jour', () => {
  assert.equal(nextReadingVerse(nextReadingVerse(100, 50), 120), 120);
});
