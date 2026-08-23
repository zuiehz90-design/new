import { test } from 'node:test';
import assert from 'node:assert/strict';
import { streakFromActiveDays, toLocalDate } from './streak.js';

test('streakFromActiveDays : aucun jour actif -> 0', () => {
  assert.deepEqual(streakFromActiveDays(new Set(), '2026-08-23'), { current: 0, best: 0 });
});

test('streakFromActiveDays : aujourd’hui inclus', () => {
  const days = new Set(['2026-08-23', '2026-08-22', '2026-08-21']);
  assert.deepEqual(streakFromActiveDays(days, '2026-08-23'), { current: 3, best: 3 });
});

test('streakFromActiveDays : coupure hier -> current 0, best conservé', () => {
  const days = new Set(['2026-08-21', '2026-08-20']);
  assert.deepEqual(streakFromActiveDays(days, '2026-08-23'), { current: 0, best: 2 });
});

test('streakFromActiveDays : journée en cours sans prière -> série continue depuis hier', () => {
  const days = new Set(['2026-08-22', '2026-08-21']);
  assert.deepEqual(streakFromActiveDays(days, '2026-08-23'), { current: 2, best: 2 });
});

test('streakFromActiveDays : 1 seule prière suffit pour compter le jour', () => {
  const days = new Set(['2026-08-23', '2026-08-22']);
  assert.deepEqual(streakFromActiveDays(days, '2026-08-23'), { current: 2, best: 2 });
});

test('streakFromActiveDays : meilleur streak plus long que le courant', () => {
  const days = new Set(['2026-08-23', '2026-08-22', '2026-08-18', '2026-08-17', '2026-08-16']);
  assert.deepEqual(streakFromActiveDays(days, '2026-08-23'), { current: 2, best: 3 });
});

test('toLocalDate formate la date locale', () => {
  assert.equal(toLocalDate(new Date(2026, 7, 23)), '2026-08-23');
  assert.equal(toLocalDate(new Date(2026, 0, 5)), '2026-01-05');
});
