import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gregorianToHijri } from './hijriCalendar';
import {
  ANNOUNCE_WINDOW_DAYS,
  DAY_OF_ARAFAH,
  DHUL_HIJJA_DAYS,
  dayActions,
  dhulHijjahStatus,
  invocationFor,
} from './dhulHijjah';

/** Trouve la date du prochain jour hégirien donné (scan ≤ 400 jours). */
function findHijriDay(month: number, day: number): Date {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i <= 400; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const h = gregorianToHijri(d);
    if (h.month === month && h.day === day) return d;
  }
  throw new Error(`jour hégirien ${month}/${day} introuvable`);
}

test('dhulHijjahStatus : actif pendant les 10 premiers jours de Dhoul-Hijja', () => {
  // On teste plusieurs jours de la période (1er, milieu, dernier)
  for (const day of [1, 5, DHUL_HIJJA_DAYS]) {
    const d = findHijriDay(12, day);
    d.setHours(15, 0, 0, 0); // midi pour éviter les problèmes de bord
    const s = dhulHijjahStatus(d);
    assert.equal(s.active, true, `jour ${day} : actif`);
    assert.equal(s.day, day);
    assert.equal(s.daysUntilStart, null);
    assert.equal(s.isArafah, day === DAY_OF_ARAFAH);
    assert.equal(s.isEid, day === DHUL_HIJJA_DAYS);
  }
});

test('dhulHijjahStatus : jour de Arafah détecté', () => {
  const arafah = findHijriDay(12, DAY_OF_ARAFAH);
  arafah.setHours(12, 0, 0, 0);
  const s = dhulHijjahStatus(arafah);
  assert.equal(s.active, true);
  assert.equal(s.isArafah, true);
  assert.equal(s.isEid, false);
});

test('dhulHijjahStatus : hors période → compte à rebours cohérent', () => {
  // Aujourd'hui (réel) : soit on est dans la période, soit le compte est > 0
  const s = dhulHijjahStatus();
  if (s.active) return; // rien à tester si on est dans la période
  assert.ok(s.daysUntilStart !== null && s.daysUntilStart >= 1, 'compte à rebours positif');
  assert.ok(s.startDate instanceof Date);
  // La date de début convertie retombe bien sur le 12/01 hégirien
  const back = gregorianToHijri(s.startDate!);
  assert.equal(back.month, 12);
  assert.equal(back.day, 1);
});

test('dhulHijjahStatus : annonce dans la fenêtre des 15 jours', () => {
  // Le jour juste avant le début → daysUntilStart = 1 (≤ fenêtre)
  const before = new Date(findHijriDay(12, 1));
  before.setDate(before.getDate() - 2);
  before.setHours(12, 0, 0, 0);
  const s = dhulHijjahStatus(before);
  assert.equal(s.active, false);
  assert.ok((s.daysUntilStart ?? Infinity) <= ANNOUNCE_WINDOW_DAYS);
});

test('dayActions : rappels spécifiques par jour', () => {
  // Jours normaux (1-8) : jeûne + dhikr + sadaqa + Coran
  for (const day of [1, 5, 8]) {
    const a = dayActions(day);
    assert.ok(a.includes('fasting'), `jour ${day} : jeûne recommandé`);
    assert.ok(a.includes('dhikr') && a.includes('sadaqa'));
    assert.ok(!a.includes('noFasting'));
  }
  // Jour de Arafah : jeûne + invocation spécifique
  const arafah = dayActions(DAY_OF_ARAFAH);
  assert.ok(arafah.includes('arafahFasting'));
  assert.ok(arafah.includes('arafahDua'));
  // Jour de l'Aïd : pas de jeûne + takbir + sacrifice
  const eid = dayActions(DHUL_HIJJA_DAYS);
  assert.ok(eid.includes('noFasting'));
  assert.ok(eid.includes('takbir') && eid.includes('udhiya'));
  // Hors bornes : vide
  assert.deepEqual(dayActions(0), []);
  assert.deepEqual(dayActions(11), []);
});

test('invocationFor : takbir et du\u2019a de Arafah disponibles, autres null', () => {
  assert.ok(invocationFor('takbir')?.transliteration.includes('Allahu Akbar'));
  assert.ok(invocationFor('arafahDua')?.transliteration.includes('la sharika lah'));
  assert.equal(invocationFor('fasting'), null);
  assert.equal(invocationFor('sadaqa'), null);
});
