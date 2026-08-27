/**
 * Compte à rebours des grands événements islamiques (Ramadan, Aïd, Laylat al-Qadr, Achoura…).
 * Logique pure et testable : scan jour par jour depuis aujourd'hui avec la conversion
 * hégirienne existante (source de vérité unique → cohérence garantie avec le calendrier).
 */
import { gregorianToHijri, ISLAMIC_EVENTS, type HijriDate, type IslamicEvent } from './hijriCalendar';

/** Les grands événements qui méritent un compte à rebours en grand. */
export const MAJOR_EVENT_KEYS: ReadonlyArray<{ month: number; day: number }> = [
  { month: 9, day: 1 },   // Début du Ramadan
  { month: 9, day: 27 },  // Laylat al-Qadr
  { month: 10, day: 1 },  // Aïd al-Fitr
  { month: 12, day: 9 },  // Jour de Arafah
  { month: 12, day: 10 }, // Aïd al-Adha
  { month: 1, day: 10 },  // Achoura
];

const MAJOR_SET = new Set(
  ISLAMIC_EVENTS
    .filter((e) => MAJOR_EVENT_KEYS.some((k) => k.month === e.month && k.day === e.day))
    .map((e) => `${e.month}-${e.day}`),
);

/** Au-delà de ce nombre de jours, le compte à rebours n'est pas affiché. */
export const COUNTDOWN_HORIZON_DAYS = 45;

/** Bornes du scan (un an hégirien ≈ 354 jours). */
const MAX_SCAN_DAYS = 400;

export interface CountdownEvent {
  event: IslamicEvent;
  /** Date grégorienne de minuit local du jour de l'événement. */
  targetDate: Date;
  hijriDate: HijriDate;
  /** Jours restants (0 = c'est aujourd'hui). */
  daysLeft: number;
}

/**
 * Prochain grand événement à partir de `now`.
 * Renvoie null si aucun dans les `MAX_SCAN_DAYS` prochains jours (impossible en pratique :
 * les grands événements reviennent chaque année hégirienne).
 * `horizonDays` : si renseigné et que l'événement est plus loin, renvoie null.
 */
export function nextMajorEvent(now: Date = new Date(), horizonDays?: number): CountdownEvent | null {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  for (let i = 0; i <= MAX_SCAN_DAYS; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const h = gregorianToHijri(d);
    if (!MAJOR_SET.has(`${h.month}-${h.day}`)) continue;
    if (horizonDays !== undefined && i > horizonDays) return null;
    return { event: findEvent(h.month, h.day), targetDate: d, hijriDate: h, daysLeft: i };
  }
  return null;
}

function findEvent(month: number, day: number): IslamicEvent {
  const exact = ISLAMIC_EVENTS.find((e) => e.month === month && e.day === day && MAJOR_SET.has(`${e.month}-${e.day}`));
  // Repli défensif : ne devrait jamais arriver (MAJOR_EVENT_KEYS est dérivé de ISLAMIC_EVENTS)
  return exact ?? { month, day, name: '', nameAr: '', description: '', type: 'recommended' };
}

/** Décomposition du temps restant jusqu'au jour de l'événement (minuit local). */
export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

export function countdownParts(targetDate: Date, now: Date = new Date()): CountdownParts {
  const totalMs = Math.max(0, targetDate.getTime() - now.getTime());
  const totalSeconds = Math.floor(totalMs / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalMs,
  };
}
