import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeNewBadges, BADGE_FAMILIES, badgeId } from './badges.js';

const base = { existing: new Set<string>(), points: 0, totalPrayers: 0, fullDays: 0, streakBest: 0, questsDone: 0, storiesDone: 0 };
type Stat = 'totalPrayers' | 'fullDays' | 'streakBest' | 'questsDone' | 'points' | 'storiesDone';

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

// Contrat des paliers : chaque famille débloque bronze/argent/or à ses seuils
// (et rien en dessous du bronze — les autres familles restent à 0 dans chaque ligne).
const FAMILY_THRESHOLDS: Array<[string, Stat, [number, number, number]]> = [
  ['salat', 'totalPrayers', [1, 50, 200]],
  ['five', 'fullDays', [1, 7, 30]],
  ['streak', 'streakBest', [7, 30, 100]],
  ['quests', 'questsDone', [1, 10, 50]],
  ['rank', 'points', [180, 450, 950]],
  ['stories', 'storiesDone', [3, 6, 12]],
];
test('seuils bronze/argent/or par famille (table)', () => {
  for (const [id, stat, [b, s, g]] of FAMILY_THRESHOLDS) {
    assert.deepEqual(computeNewBadges({ ...base, [stat]: b - 1 }), [], `${id} sous le bronze`);
    assert.deepEqual(
      computeNewBadges({ ...base, [stat]: s }).filter(x => x.startsWith(id + '_')).sort(),
      [badgeId(id, 'bronze'), badgeId(id, 'silver')].sort(),
      `${id} à argent`
    );
    assert.deepEqual(
      computeNewBadges({ ...base, [stat]: g }).filter(x => x.startsWith(id + '_')).sort(),
      [badgeId(id, 'bronze'), badgeId(id, 'silver'), badgeId(id, 'gold')].sort(),
      `${id} à or`
    );
  }
});

test('badges déjà obtenus ne sont pas re-débloqués', () => {
  const existing = new Set(BADGE_FAMILIES.flatMap(f => f.tiers.map(t => badgeId(f.id, t.level))));
  assert.deepEqual(
    computeNewBadges({ ...base, existing, points: 5000, totalPrayers: 500, fullDays: 100, streakBest: 500, questsDone: 200 }),
    []
  );
});
