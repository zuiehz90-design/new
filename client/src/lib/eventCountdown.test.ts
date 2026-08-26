import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gregorianToHijri } from './hijriCalendar';
import {
  countdownParts,
  COUNTDOWN_HORIZON_DAYS,
  MAJOR_EVENT_KEYS,
  nextMajorEvent,
} from './eventCountdown';

test('nextMajorEvent : renvoie un grand événement futur cohérent', () => {
  const result = nextMajorEvent();
  assert.ok(result, 'un événement est trouvé (les grands événements sont annuels)');
  assert.ok(result.daysLeft >= 0, 'daysLeft positif');
  assert.ok(Number.isInteger(result.daysLeft), 'daysLeft entier');
  // L'événement trouvé fait bien partie des grands événements
  assert.ok(
    MAJOR_EVENT_KEYS.some((k) => k.month === result.hijriDate.month && k.day === result.hijriDate.day),
    'événement majeur',
  );
  // Cohérence : la date cible convertie correspond au jour de l'événement
  const back = gregorianToHijri(result.targetDate);
  assert.equal(back.month, result.hijriDate.month);
  assert.equal(back.day, result.hijriDate.day);
});

test('nextMajorEvent : horizon — null si trop loin', () => {
  const full = nextMajorEvent();
  if (!full || full.daysLeft <= COUNTDOWN_HORIZON_DAYS) return; // rien à tester aujourd'hui
  const limited = nextMajorEvent(new Date(), COUNTDOWN_HORIZON_DAYS);
  assert.equal(limited, null, 'au-delà de l\u2019horizon, null');
});

test('nextMajorEvent : le jour même → daysLeft = 0', () => {
  // On cherche un événement majeur puis on rejoue le calcul depuis sa date cible.
  const future = nextMajorEvent();
  assert.ok(future);
  const atEvent = new Date(future.targetDate);
  atEvent.setHours(12, 0, 0, 0); // midi du jour J
  const result = nextMajorEvent(atEvent, COUNTDOWN_HORIZON_DAYS + 1);
  assert.ok(result);
  assert.equal(result.daysLeft, 0, 'le jour J, daysLeft vaut 0');
  assert.equal(result.event.month, future.event.month);
  assert.equal(result.event.day, future.event.day);
});

test('countdownParts : décompose correctement le temps restant', () => {
  const now = new Date(2026, 7, 26, 10, 30, 15); // 10:30:15
  const target = new Date(2026, 7, 28, 0, 0, 0); // minuit dans 1j 13h 29m 45s
  const p = countdownParts(target, now);
  assert.deepEqual(
    { days: p.days, hours: p.hours, minutes: p.minutes, seconds: p.seconds },
    { days: 1, hours: 13, minutes: 29, seconds: 45 },
  );
  assert.ok(p.totalMs > 0);
});

test('countdownParts : jamais négatif', () => {
  const now = new Date(2026, 7, 26, 23, 0, 0);
  const past = new Date(2026, 7, 26, 8, 0, 0);
  const p = countdownParts(past, now);
  assert.equal(p.totalMs, 0);
  assert.equal(p.days, 0);
});
