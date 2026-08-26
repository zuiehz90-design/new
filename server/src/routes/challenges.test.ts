import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../db.js';
import { weekStart, pickWeekly, computeProgress } from './challenges.js';

test('weekStart : renvoie le lundi de la semaine', () => {
  assert.equal(weekStart(new Date('2026-08-26T10:00:00')), '2026-08-24'); // mercredi → lundi
  assert.equal(weekStart(new Date('2026-08-24T00:00:00')), '2026-08-24'); // lundi → lundi
  assert.equal(weekStart(new Date('2026-08-30T23:59:00')), '2026-08-24'); // dimanche → lundi
  assert.equal(weekStart(new Date('2026-09-01T00:00:00')), '2026-08-31'); // mardi 1er sept → lundi 31 août
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

test('computeProgress : compte depuis le début de semaine', () => {
  const name = 'challenge-test-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  const info = db.prepare('INSERT INTO users (name, password_hash) VALUES (?, ?)').run(name, 'x');
  const userId = Number(info.lastInsertRowid);
  const week = weekStart();
  const old = '2000-01-01';
  try {
    // Prières : 2 cette semaine, 1 avant
    db.prepare('INSERT INTO prayers (user_id, date, prayer) VALUES (?, ?, ?)').run(userId, week, 'fajr');
    db.prepare('INSERT INTO prayers (user_id, date, prayer) VALUES (?, ?, ?)').run(userId, week, 'dhuhr');
    db.prepare('INSERT INTO prayers (user_id, date, prayer) VALUES (?, ?, ?)').run(userId, old, 'maghrib');
    assert.equal(computeProgress(userId, 'prayers', week), 2);

    // Quêtes : 2 terminées cette semaine (1 dhikr, 1 quran), 1 avant
    db.prepare('INSERT INTO quests (user_id, date, quest_id, title, type, points, done) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(userId, week, 'q1', 't', 'dhikr', 10, 1);
    db.prepare('INSERT INTO quests (user_id, date, quest_id, title, type, points, done) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(userId, week, 'q2', 't', 'quran', 10, 1);
    db.prepare('INSERT INTO quests (user_id, date, quest_id, title, type, points, done) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(userId, old, 'q3', 't', 'dhikr', 10, 1);
    db.prepare('INSERT INTO quests (user_id, date, quest_id, title, type, points, done) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(userId, week, 'q4', 't', 'dhikr', 10, 0); // non terminée → ignorée
    assert.equal(computeProgress(userId, 'quests', week), 2);
    assert.equal(computeProgress(userId, 'dhikr', week), 1);
    assert.equal(computeProgress(userId, 'quran', week), 1);

    // Quiz : un score positif cette semaine compte
    db.prepare('INSERT INTO quiz_completions (user_id, prophet, score, total, points_awarded) VALUES (?, ?, ?, ?, ?)')
      .run(userId, 'Adam', 3, 5, 6);
    assert.equal(computeProgress(userId, 'quiz', week), 1);

    // Série : sans jour consécutif (hier/aujourd'hui), le streak reste à 0
    assert.equal(computeProgress(userId, 'streak', week), 0);
    // Une prière aujourd'hui démarre la série
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    db.prepare('INSERT INTO prayers (user_id, date, prayer) VALUES (?, ?, ?)').run(userId, todayStr, 'isha');
    assert.equal(computeProgress(userId, 'streak', week), 1);
  } finally {
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  }
});
