/**
 * Jours spéciaux (Aïd, Arafah, Ramadan…) : rappel du jour même ou de la veille,
 * suggestions concrètes d'actions et lecture du takbir en audio.
 *
 * Logique pure et testable — s'appuie sur :
 *  - eventCountdown.nextMajorEvent() pour la détection (grands événements)
 *  - eventExplanations.getEventExplanation() pour les actions recommandées
 */
import { nextMajorEvent } from './eventCountdown';
import { getEventExplanation } from './eventExplanations';
import type { HijriDate, IslamicEvent } from './hijriCalendar';

/**
 * Takbir de l'Aïd (Sheikh Ali Mullah) — domaine public, archive.org.
 * Version 64 kbps (~950 Ko) pour un chargement rapide ; le <audio> suit la redirection.
 */
export const TAKBIR_AUDIO_URL =
  'https://archive.org/download/EidTakbirBySheikhAliMullah/EidTakbirBySheikhAliMullah_64kb.mp3';

/** Événements où le takbir est particulièrement prescrit. */
const TAKBIR_EVENTS = new Set([
  '10-1', // Aïd al-Fitr
  '12-9', // Jour de Arafah
  '12-10', // Aïd al-Adha
]);

export interface SpecialDayInfo {
  event: IslamicEvent;
  hijriDate: HijriDate;
  /** Minuit local du jour de l'événement. */
  gregorianDate: Date;
  /** 0 = aujourd'hui, 1 = veille. */
  daysLeft: number;
  isToday: boolean;
  /** Actions concrètes recommandées (issues des explications, max 4). */
  actions: string[];
  /** true si le takbir audio est pertinent pour cet événement. */
  takbirRelevant: boolean;
}

/**
 * Jour spécial en cours ou imminent (veille), ou null.
 * `opts.force` : mode démonstration/test — présente le prochain grand événement
 * même s'il est lointain (utile pour prévisualiser la carte).
 */
export function getSpecialDay(
  now: Date = new Date(),
  opts?: { force?: boolean },
): SpecialDayInfo | null {
  const ev = nextMajorEvent(now);
  if (!ev) return null;

  const force = opts?.force === true && ev.daysLeft > 1;
  if (ev.daysLeft > 1 && !force) return null;

  const details = getEventExplanation(ev.event.month, ev.event.day);
  const key = `${ev.event.month}-${ev.event.day}`;

  return {
    event: ev.event,
    hijriDate: ev.hijriDate,
    gregorianDate: ev.targetDate,
    daysLeft: force ? 0 : ev.daysLeft,
    isToday: ev.daysLeft === 0 || force,
    actions: (details?.practices ?? []).slice(0, 4),
    takbirRelevant: TAKBIR_EVENTS.has(key),
  };
}

/**
 * Clé anti-doublon pour les rappels quotidiens : une seule notification par
 * jour et par événement, même rechargée plusieurs fois.
 */
export function reminderKey(now: Date, info: SpecialDayInfo): string {
  const d = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return `nour:specialday-notified:${d}:${info.event.month}-${info.event.day}`;
}
