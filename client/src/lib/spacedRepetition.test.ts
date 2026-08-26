import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyRating,
  dueNameIndexes,
  intervalDaysForLevel,
  isDue,
  isMastered,
  masteredCount,
  seenCount,
  MASTERED_LEVEL,
  type NamesSrsStore,
} from './spacedRepetition';

const NOW = 1_700_000_000_000;

test('applyRating : nouveau nom noté "good" passe au palier 1 et est dû à J+1', () => {
  const s = applyRating(undefined, 'good', NOW);
  assert.equal(s.level, 1);
  assert.equal(s.reviews, 1);
  assert.equal(s.lapses, 0);
  assert.equal(s.dueAt, NOW + 86_400_000);
});

test('applyRating : "easy" monte de deux paliers (J+3)', () => {
  const s = applyRating(undefined, 'easy', NOW);
  assert.equal(s.level, 2);
  assert.equal(s.dueAt, NOW + 3 * 86_400_000);
});

test('applyRating : "again" descend d’un palier sans passer sous 1 et compte un lapse', () => {
  const prev = { level: 4, dueAt: NOW, reviews: 3, lapses: 0 };
  const s = applyRating(prev, 'again', NOW);
  assert.equal(s.level, 3);
  assert.equal(s.lapses, 1);
  assert.equal(s.dueAt, NOW + 7 * 86_400_000);
});

test('applyRating : un nom maîtrisé ne redescend jamais en dessous du palier maîtrisé', () => {
  const prev = { level: MASTERED_LEVEL, dueAt: NOW, reviews: 10, lapses: 0 };
  const s = applyRating(prev, 'again', NOW);
  assert.equal(s.level, 5);
});

test('isDue : nom jamais revu est dû, nom maîtrisé ne l’est jamais', () => {
  assert.equal(isDue(undefined, NOW), true);
  assert.equal(isDue({ level: MASTERED_LEVEL, dueAt: 0, reviews: 9, lapses: 0 }, NOW), false);
  assert.equal(isDue({ level: 2, dueAt: NOW - 1, reviews: 2, lapses: 0 }, NOW), true);
  assert.equal(isDue({ level: 2, dueAt: NOW + 1, reviews: 2, lapses: 0 }, NOW), false);
});

test('intervalDaysForLevel : paliers 1→1j, 2→3j, 3→7j, 4→14j, 5→30j, 6→null', () => {
  assert.equal(intervalDaysForLevel(1), 1);
  assert.equal(intervalDaysForLevel(2), 3);
  assert.equal(intervalDaysForLevel(3), 7);
  assert.equal(intervalDaysForLevel(4), 14);
  assert.equal(intervalDaysForLevel(5), 30);
  assert.equal(intervalDaysForLevel(6), null);
});

test('dueNameIndexes : ne renvoie que les noms dus, triés par échéance', () => {
  const store = {
    0: { level: 1, dueAt: NOW - 1000, reviews: 1, lapses: 0 },
    1: { level: 2, dueAt: NOW - 10_000, reviews: 2, lapses: 0 },
    2: { level: 3, dueAt: NOW + 10_000, reviews: 3, lapses: 0 },
    3: { level: MASTERED_LEVEL, dueAt: 0, reviews: 9, lapses: 0 },
  };
  const due = dueNameIndexes(store, 4, NOW);
  assert.deepEqual(due, [1, 0]);
});

test('masteredCount / seenCount : comptent correctement', () => {
  const store: NamesSrsStore = {
    0: { level: MASTERED_LEVEL, dueAt: 0, reviews: 9, lapses: 0 },
    1: { level: 2, dueAt: NOW, reviews: 2, lapses: 0 },
  };
  assert.equal(masteredCount(store, 3), 1);
  assert.equal(seenCount(store, 3), 2);
});
