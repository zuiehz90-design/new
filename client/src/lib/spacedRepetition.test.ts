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
const DAY = 86_400_000;
const state = (level: number, dueAt: number, reviews = 1, lapses = 0): NonNullable<Parameters<typeof applyRating>[0]> =>
  ({ level, dueAt, reviews, lapses });

// Contrat de notation : (niveau précédent, note) → (niveau, échéance en jours, lapses)
const RATINGS: Array<[NonNullable<Parameters<typeof applyRating>[0]> | undefined, 'again' | 'good' | 'easy', number, number, number]> = [
  [undefined, 'good', 1, 1, 0], // nouveau → palier 1, J+1
  [undefined, 'easy', 2, 3, 0], // nouveau → palier 2 (saute un palier), J+3
  [undefined, 'again', 1, 1, 1], // nouveau → ne descend pas sous 1, lapse
  [state(4, NOW), 'again', 3, 7, 1], // descente d'un palier
  [state(MASTERED_LEVEL, 0, 10), 'again', 5, 30, 1], // maîtrisé → jamais sous 5
  [state(5, NOW), 'easy', MASTERED_LEVEL, 0, 0], // easy plafonne à maîtrisé → dû à jamais (dueAt 0)
];
test('applyRating : transitions de paliers (tables)', () => {
  for (const [prev, rating, level, days, lapses] of RATINGS) {
    const s = applyRating(prev, rating, NOW);
    assert.equal(s.level, level, `${prev?.level ?? 'nouveau'} + ${rating}`);
    assert.equal(s.dueAt, days === 0 ? 0 : NOW + days * DAY, `${prev?.level ?? 'nouveau'} + ${rating} (dueAt)`);
    assert.equal(s.lapses, lapses);
    assert.equal(s.reviews, (prev?.reviews ?? 0) + 1);
  }
});

const DUE: Array<[NonNullable<Parameters<typeof isDue>[0]> | undefined, boolean]> = [
  [undefined, true], // jamais revu → dû
  [state(MASTERED_LEVEL, 0, 9), false], // maîtrisé → jamais dû
  [state(2, NOW - 1), true], // échéance passée → dû
  [state(2, NOW + 1), false], // échéance future → pas dû
];
test('isDue : échéances (table)', () => {
  for (const [s, expected] of DUE) assert.equal(isDue(s, NOW), expected);
});

test('intervalDaysForLevel : paliers 1→1j, 2→3j, 3→7j, 4→14j, 5→30j, 6→null', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(intervalDaysForLevel), [1, 3, 7, 14, 30, null]);
});

test('dueNameIndexes : ne renvoie que les noms dus, triés par échéance', () => {
  const store: NamesSrsStore = {
    0: state(1, NOW - 1000),
    1: state(2, NOW - 10_000),
    2: state(3, NOW + 10_000), // pas dû
    3: state(MASTERED_LEVEL, 0, 9), // jamais dû
  };
  assert.deepEqual(dueNameIndexes(store, 4, NOW), [1, 0]);
});

test('masteredCount / seenCount : comptent correctement', () => {
  const store: NamesSrsStore = {
    0: state(MASTERED_LEVEL, 0, 9), // maîtrisé
    1: state(2, NOW), // vu, en cours
  };
  assert.equal(masteredCount(store, 3), 1);
  assert.equal(seenCount(store, 3), 2);
});

test('isMastered : seul le palier maîtrisé compte', () => {
  assert.equal(isMastered(state(MASTERED_LEVEL, 0, 9)), true);
  assert.equal(isMastered(state(5, NOW)), false);
  assert.equal(isMastered(undefined), false);
});
