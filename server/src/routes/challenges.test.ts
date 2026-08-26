import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../db.js';
import { weekStart, pickWeekly, computeProgress } from './challenges.js';

test('weekStart : renvoie le lundi de la semaine', () => {
  const cases: Array<[string, string]> = [
    ['2026-08-26T10:00:00', '2026-08-24'], // mercredi → lundi
    ['2026-08-24T00:00:00', '2026-08-24'], // lundi → lundi
    ['2026-08-30T23:59:00', '2026-08-24'], // dimanche → lundi
    ['2026-09-01T00:00:00', '2026-08-31'], // mardi 1er sept → lundi 31 août
  ];
  for (const [input, expected] of cases) assert.equal(weekStart(new Date(input)), expected);
});

test('pickWeekly : 3 défis, types distincts, déterministe', () => {
  const a = pickWeekly(100);
  const b = pickWeekly(100);
  assert.equal(a.length, 3);
  assert.equal(new Set(a.map((t) => t.type)).size, 3, 'types distincts');
  assert.deepEqual(a, b, 'déterministe pour un même seed');
  const c = pickWeekly(101);
  assert.notDeepEqual(a.map((t) => t.type), c.map((t) => t.type), 'change avec le seed');
});

test('computeProgress : compte depuis le début de semaine', async (t) => {
  const name = 'challenge-test-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  const info = db.prepare('INSERT INTO users (name, password_hash) VALUES (?, ?)').run(name, 'x');
  const userId = Number(info.lastInsertRowid);
  const week = weekStart();
  const old = '2000-01-01';
  const prayer = (date: string, p: string) =>
    db.prepare('INSERT INTO prayers (user_id, date, prayer) VALUES (?, ?, ?)').run(userId, date, p);
  const quest = (date: string, id: string, type: string, done = 1) =>
    db.prepare('INSERT INTO quests (user_id, date, quest_id, title, type, points, done) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(userId, date, id, 't', type, 10, done);
  try {
    await t.test('prières : 2 cette semaine, 1 avant', () => {
      prayer(week, 'fajr'); prayer(week, 'dhuhr'); prayer(old, 'maghrib');
      assert.equal(computeProgress(userId, 'prayers', week), 2);
    });

    await t.test('quêtes : terminées cette semaine, types distingués (table)', () => {
      quest(week, 'q1', 'dhikr'); quest(week, 'q2', 'quran');
      quest(old, 'q3', 'dhikr'); quest(week, 'q4', 'dhikr', 0); // non terminée → ignorée
      const cases: Array<[string, number]> = [
        ['quests', 2], // toutes terminées de la semaine
        ['dhikr', 1],  // type distingué
        ['quran', 1],
      ];
      for (const [type, expected] of cases) assert.equal(computeProgress(userId, type, week), expected);
    });

    await t.test('quiz : un score positif cette semaine compte', () => {
      db.prepare('INSERT INTO quiz_completions (user_id, prophet, score, total, points_awarded) VALUES (?, ?, ?, ?, ?)')
        .run(userId, 'Adam', 3, 5, 6);
      assert.equal(computeProgress(userId, 'quiz', week), 1);
    });

    await t.test('série : ne démarre qu\'avec une prière aujourd\'hui', () => {
      assert.equal(computeProgress(userId, 'streak', week), 0);
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      prayer(todayStr, 'isha');
      assert.equal(computeProgress(userId, 'streak', week), 1);
    });
  } finally {
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  }
});
