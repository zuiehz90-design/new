import test from 'node:test';
import assert from 'node:assert/strict';
import { daySeed, nameOfTheDay, meditationFor } from './nameOfTheDay';

test('daySeed est stable sur une même journée locale', () => {
  const a = daySeed(new Date(2026, 7, 26, 0, 0, 0));   // minuit local
  const b = daySeed(new Date(2026, 7, 26, 23, 59, 59)); // fin de journée locale
  assert.equal(a, b);
});

test('daySeed change le lendemain (minuit local)', () => {
  const a = daySeed(new Date(2026, 7, 26, 12, 0, 0));
  const b = daySeed(new Date(2026, 7, 27, 12, 0, 0));
  assert.notEqual(a, b);
});

test('nameOfTheDay renvoie toujours un des 99 noms', () => {
  for (let seed = 0; seed < 1000; seed++) {
    const n = nameOfTheDay(seed);
    assert.ok(n.transliteration.length > 0);
    assert.ok(n.arabic.length > 0);
    assert.ok(n.audio.endsWith('.mp3'));
  }
});

test('nameOfTheDay tourne sur 99 jours puis revient au premier', () => {
  const first = nameOfTheDay(0);
  const next = nameOfTheDay(99);
  assert.equal(next.transliteration, first.transliteration);
  assert.notEqual(nameOfTheDay(0).transliteration, nameOfTheDay(1).transliteration);
});

test('nameOfTheDay gère les seeds négatifs (dates avant 1970)', () => {
  const n = nameOfTheDay(-5);
  assert.ok(n.transliteration.length > 0);
});

test('meditationFor produit un rappel avec le nom', () => {
  const n = nameOfTheDay(0);
  const m = meditationFor(n, 0);
  assert.ok(m.includes(n.transliteration));
  assert.ok(m.length > 10);
});
