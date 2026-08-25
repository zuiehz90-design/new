import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeNewBadges, BADGE_FAMILIES, badgeId } from './badges.js';

const base = { existing: new Set<string>(), points: 0, totalPrayers: 0, fullDays: 0, streakBest: 0, questsDone: 0, storiesDone: 0 };

test('aucun badge au départ', () => {
  assert.deepEqual(computeNewBadges(base), []);
});

test('6 familles × 3 niveaux définies', () => {
  assert.equal(BADGE_FAMILIES.length, 6);
  for (const f of BADGE_FAMILIES) {
    assert.equal(f.tiers.length, 3, 'famille ' + f.id);
    assert.deepEqual(f.tiers.map(t => t.level), ['bronze', 'silver', 'gold']);
  }
});

test('prières : bronze à 1, argent à 50, or à 200', () => {
  assert.ok(computeNewBadges({ ...base, totalPrayers: 1 }).includes('salat_bronze'));
  const r = computeNewBadges({ ...base, totalPrayers: 50 });
  assert.ok(r.includes('salat_bronze') && r.includes('salat_silver'));
  assert.ok(!r.includes('salat_gold'));
  assert.ok(computeNewBadges({ ...base, totalPrayers: 200 }).includes('salat_gold'));
});

test('jours 5/5 : bronze 1, argent 7, or 30', () => {
  assert.ok(computeNewBadges({ ...base, fullDays: 1 }).includes('five_bronze'));
  assert.ok(computeNewBadges({ ...base, fullDays: 7 }).includes('five_silver'));
  assert.ok(!computeNewBadges({ ...base, fullDays: 6 }).includes('five_silver'));
  assert.ok(computeNewBadges({ ...base, fullDays: 30 }).includes('five_gold'));
});

test('meilleure série : bronze 7, argent 30, or 100', () => {
  assert.ok(computeNewBadges({ ...base, streakBest: 7 }).includes('streak_bronze'));
  assert.ok(computeNewBadges({ ...base, streakBest: 30 }).includes('streak_silver'));
  assert.ok(computeNewBadges({ ...base, streakBest: 100 }).includes('streak_gold'));
  assert.ok(!computeNewBadges({ ...base, streakBest: 6 }).includes('streak_bronze'));
});

test('quêtes : bronze 1, argent 10, or 50', () => {
  assert.ok(computeNewBadges({ ...base, questsDone: 1 }).includes('quests_bronze'));
  assert.ok(computeNewBadges({ ...base, questsDone: 10 }).includes('quests_silver'));
  assert.ok(computeNewBadges({ ...base, questsDone: 50 }).includes('quests_gold'));
});

test('points/rang : bronze 180 (Argent 3), argent 450 (Or 3), or 950 (Platine 3)', () => {
  assert.ok(computeNewBadges({ ...base, points: 180 }).includes('rank_bronze'));
  assert.ok(computeNewBadges({ ...base, points: 450 }).includes('rank_silver'));
  assert.ok(computeNewBadges({ ...base, points: 950 }).includes('rank_gold'));
  assert.ok(!computeNewBadges({ ...base, points: 179 }).includes('rank_bronze'));
});

test('badges déjà obtenus ne sont pas re-débloqués', () => {
  const existing = new Set(BADGE_FAMILIES.flatMap(f => f.tiers.map(t => badgeId(f.id, t.level))));
  assert.deepEqual(
    computeNewBadges({ ...base, existing, points: 5000, totalPrayers: 500, fullDays: 100, streakBest: 500, questsDone: 200 }),
    []
  );
});

test('histoires : bronze 3, argent 6, or 12 (Connaisseur historique)', () => {
  assert.ok(computeNewBadges({ ...base, storiesDone: 3 }).includes('stories_bronze'));
  assert.ok(computeNewBadges({ ...base, storiesDone: 6 }).includes('stories_silver'));
  assert.ok(computeNewBadges({ ...base, storiesDone: 12 }).includes('stories_gold'));
  assert.ok(!computeNewBadges({ ...base, storiesDone: 2 }).includes('stories_bronze'));
});

test('chaque famille ne débloque que ses propres niveaux', () => {
  const r = computeNewBadges({ ...base, points: 200, totalPrayers: 60, fullDays: 8, streakBest: 31, questsDone: 11 });
  assert.deepEqual(
    r.filter(id => id.startsWith('streak_')).sort(),
    ['streak_bronze', 'streak_silver']
  );
  assert.ok(!r.includes('rank_gold'));
  assert.ok(!r.includes('salat_gold'));
});
