import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextMajorEvent } from './eventCountdown';
import { gregorianToHijri } from './hijriCalendar';
import { getSpecialDay, reminderKey, TAKBIR_AUDIO_URL } from './specialDay';

test('getSpecialDay : jour même → isToday, actions issues des explications', () => {
  const ev = nextMajorEvent();
  assert.ok(ev);
  const atDay = new Date(ev.targetDate);
  atDay.setHours(9, 0, 0, 0); // matin du jour J
  const info = getSpecialDay(atDay);
  assert.ok(info);
  assert.equal(info.daysLeft, 0);
  assert.equal(info.isToday, true);
  assert.ok(info.actions.length >= 2 && info.actions.length <= 4, 'actions concrètes présentes');
  assert.deepEqual(
    { month: info.hijriDate.month, day: info.hijriDate.day },
    { month: ev.event.month, day: ev.event.day },
  );
});

test('getSpecialDay : veille de l\u2019événement → daysLeft = 1', () => {
  const ev = nextMajorEvent();
  assert.ok(ev);
  const eve = new Date(ev.targetDate);
  eve.setDate(eve.getDate() - 1);
  eve.setHours(20, 0, 0, 0); // soirée de la veille
  const info = getSpecialDay(eve);
  assert.ok(info);
  assert.equal(info.daysLeft, 1);
  assert.equal(info.isToday, false);
});

test('getSpecialDay : au-delà de la veille → null', () => {
  const ev = nextMajorEvent();
  assert.ok(ev);
  const far = new Date(ev.targetDate);
  far.setDate(far.getDate() - 5);
  far.setHours(12, 0, 0, 0);
  assert.equal(getSpecialDay(far), null);
});

test('getSpecialDay : mode force → présenté comme aujourd\u2019hui même à distance', () => {
  const now = new Date();
  const normal = getSpecialDay(now);
  if (normal) return; // déjà un jour spécial : rien à tester
  const forced = getSpecialDay(now, { force: true });
  assert.ok(forced, 'le mode force renvoie toujours le prochain grand événement');
  assert.equal(forceDaysLeft(forced), 0);
});

function forceDaysLeft(info: NonNullable<ReturnType<typeof getSpecialDay>>): number {
  return info.daysLeft;
}

test('takbirRelevant : Aïd et Arafah oui, Ramadan non', () => {
  // Trouve la prochaine occurrence hégirienne d'une date donnée
  const findHijri = (month: number, day: number): Date => {
    const start = new Date();
    start.setHours(12, 0, 0, 0);
    for (let i = 0; i <= 400; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const h = gregorianToHijri(d);
      if (h.month === month && h.day === day) {
        const at = new Date(d);
        at.setHours(9, 0, 0, 0);
        return at;
      }
    }
    throw new Error(`date hégirienne ${month}/${day} introuvable`);
  };
  const eidAdha = getSpecialDay(findHijri(12, 10));
  assert.ok(eidAdha?.takbirRelevant === true, 'Aïd al-Adha : takbir');
  const arafah = getSpecialDay(findHijri(12, 9));
  assert.ok(arafah?.takbirRelevant === true, 'Arafah : takbir');
  const ramadan = getSpecialDay(findHijri(9, 1));
  assert.ok(ramadan?.takbirRelevant === false, 'Ramadan : pas de takbir');
});

test('reminderKey : une clé stable par jour et par événement', () => {
  const ev = nextMajorEvent();
  assert.ok(ev);
  const atDay = new Date(ev.targetDate);
  atDay.setHours(10, 0, 0, 0);
  const info = getSpecialDay(atDay)!;
  const k1 = reminderKey(atDay, info);
  const laterSameDay = new Date(atDay);
  laterSameDay.setHours(18, 0, 0, 0);
  const k2 = reminderKey(laterSameDay, info!);
  assert.equal(k1, k2, 'même jour + même événement → même clé');
  assert.match(k1, /^nour:specialday-notified:\d{4}-\d{2}-\d{2}:\d+-\d+$/);
});

test('TAKBIR_AUDIO_URL : source audio configurée', () => {
  assert.ok(TAKBIR_AUDIO_URL.startsWith('https://'));
  assert.ok(TAKBIR_AUDIO_URL.endsWith('.mp3'));
});
