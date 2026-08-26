import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../db.js';
import { getRank, computeRankProgress, userPoints } from './achievements.js';

// Seuils des 16 rangs : chaque ligne franchit un palier (0 → Bronze 3, 50 → Bronze 2, …).
const RANKS_BY_POINTS: Array<[number, string]> = [
  [-1, 'bronze_3'], [0, 'bronze_3'], [50, 'bronze_2'], [110, 'bronze_1'],
  [180, 'argent_3'], [260, 'argent_2'], [350, 'argent_1'],
  [450, 'or_3'], [580, 'or_2'], [740, 'or_1'],
  [950, 'platine_3'], [1250, 'platine_2'], [1650, 'platine_1'],
  [2200, 'diamant_3'], [3000, 'diamant_2'], [4200, 'diamant_1'],
  [5999, 'diamant_1'], [6000, 'legende'], [100000, 'legende'],
];
test('getRank : seuils croissants Bronze → Légende (table)', () => {
  for (const [points, expected] of RANKS_BY_POINTS) {
    assert.equal(getRank(points).id, expected, `${points} pts`);
  }
});

// Progression vers le palier suivant : (points, pct, prochain, restants, maxed).
const PROGRESS: Array<[number, string, number, number | null, number, boolean]> = [
  [0, 'bronze_3', 0, 50, 50, false],
  [65, 'bronze_2', 25, 110, 45, false], // 15 pts dans l'intervalle 50→110
  [110, 'bronze_1', 0, 180, 70, false],
  [6000, 'legende', 100, null, 0, true],
  [99999, 'legende', 100, null, 0, true],
];
test('computeRankProgress : pct, prochain palier, points restants (table)', () => {
  for (const [points, rankId, pct, next, needed, maxed] of PROGRESS) {
    const p = computeRankProgress(points, getRank(points));
    assert.equal(getRank(points).id, rankId, `${points} pts`);
    assert.equal(p.pct, pct, `${points} pts (pct)`);
    assert.equal(p.next, next, `${points} pts (prochain)`);
    assert.equal(p.pointsNeeded, needed, `${points} pts (restants)`);
    assert.equal(p.maxed, maxed, `${points} pts (maxed)`);
  }
});

test('userPoints : 10 pts/prière, pénalités par palier, quêtes, quiz, défis (table)', () => {
  const name = 'rank-test-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  const info = db.prepare('INSERT INTO users (name, password_hash) VALUES (?, ?)').run(name, 'x');
  const userId = Number(info.lastInsertRowid);
  const day = '2026-08-26';
  try {
    const pts = () => userPoints(userId);
    const prayer = (late = 0, minutes = 0) =>
      db.prepare('INSERT INTO prayers (user_id, date, prayer, late, late_minutes) VALUES (?, ?, ?, ?, ?)')
        .run(userId, day, 'p' + Math.random().toString(36).slice(2, 7), late, minutes);

    assert.equal(pts(), 0);
    prayer(); prayer();
    assert.equal(pts(), 20, '2 prières = 20 pts');

    // Chaque prière en retard ajoute +10 (base) + la pénalité de son palier.
    const penalties: Array<[number, number]> = [[15, 0], [16, -2], [61, -5], [121, -8], [241, -10]];
    let count = 2, penaltySum = 0;
    for (const [minutes, p] of penalties) {
      prayer(1, minutes);
      count++; penaltySum += p;
      assert.equal(pts(), count * 10 + penaltySum, `retard ${minutes} min`);
    }

    // Quête complétée +10, quiz +6, défi réclamé +50, défi non réclamé ignoré.
    db.prepare('INSERT INTO quests (user_id, date, quest_id, title, type, points, done) VALUES (?, ?, ?, ?, ?, ?, 1)')
      .run(userId, day, 'q1', 't', 'dhikr', 10);
    db.prepare('INSERT INTO quiz_completions (user_id, prophet, score, total, points_awarded) VALUES (?, ?, ?, ?, ?)')
      .run(userId, 'Adam', 3, 5, 6);
    db.prepare('INSERT INTO weekly_challenges (user_id, week_start, challenge_id, title, description, type, target, points, progress, claimed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)')
      .run(userId, '2026-08-24', 'names-5', 't', 'd', 'names', 5, 50, 5);
    db.prepare('INSERT INTO weekly_challenges (user_id, week_start, challenge_id, title, description, type, target, points, progress, claimed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)')
      .run(userId, '2026-08-24', 'names-10', 't', 'd', 'names', 10, 90, 10);
    assert.equal(pts(), count * 10 + penaltySum + 10 + 6 + 50, 'composition complète');
  } finally {
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  }
});
