import test from 'node:test';
import assert from 'node:assert/strict';
import { daySeed, nameOfTheDay, meditationFor } from './nameOfTheDay';

test('daySeed : stable dans la journée, change à minuit (table)', () => {
  const pairs: Array<[Date, Date, boolean]> = [
    [new Date(2026, 7, 26, 0, 0, 0), new Date(2026, 7, 26, 23, 59, 59), true], // même jour local → même seed
    [new Date(2026, 7, 26, 12, 0, 0), new Date(2026, 7, 27, 12, 0, 0), false], // lendemain → seed différent
    [new Date(2026, 7, 31, 12, 0, 0), new Date(2026, 8, 1, 12, 0, 0), false], // bascule de mois
  ];
  for (const [a, b, equal] of pairs) {
    assert.equal(daySeed(a) === daySeed(b), equal);
  }
});

test('nameOfTheDay : cycle de 99 jours, bornes et seeds négatifs', () => {
  const first = nameOfTheDay(0);
  assert.equal(nameOfTheDay(99).transliteration, first.transliteration); // repli au jour 99
  assert.notEqual(nameOfTheDay(1).transliteration, first.transliteration); // change chaque jour
  // Chaque seed renvoie une entrée valide (bornes : 0, 98, 99, négatif)
  for (const seed of [0, 98, 99, -1, -99]) {
    const n = nameOfTheDay(seed);
    assert.ok(n.transliteration.length > 0 && n.arabic.length > 0 && n.audio.endsWith('.mp3'));
  }
});

test('meditationFor : rappel contenant le nom du jour', () => {
  const n = nameOfTheDay(0);
  const m = meditationFor(n, 0);
  assert.ok(m.includes(n.transliteration));
  assert.ok(m.length > 10);
});
