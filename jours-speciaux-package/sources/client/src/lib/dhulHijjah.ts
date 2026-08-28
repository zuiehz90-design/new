/**
 * Les 10 jours de Dhoul-Hijja : les meilleurs jours de l'année auprès d'Allah
 * (« Il n'y a pas d'œuvres plus aimées d'Allah que celles de ces dix jours » — Bukhari).
 * Logique pure et testable : détection du jour courant, compte à rebours avant la période,
 * et rappels spécifiques (jeûne de Arafah, takbir, sadaqa).
 */
import { gregorianToHijri, type HijriDate } from './hijriCalendar';

export const DHUL_HIJJA_DAYS = 10;
export const DAY_OF_ARAFAH = 9;
export const EID_DAY = 10;

/** Annonce la période ce nombre de jours avant son début. */
export const ANNOUNCE_WINDOW_DAYS = 15;

/** Bornes du scan (une année hégirienne ≈ 354 jours). */
const MAX_SCAN_DAYS = 400;

export interface DhulHijjahStatus {
  /** true si aujourd'hui fait partie des 10 premiers jours de Dhoul-Hijja. */
  active: boolean;
  /** Numéro du jour (1 à 10) quand actif, sinon null. */
  day: number | null;
  isArafah: boolean;
  isEid: boolean;
  /** Jours restants avant le 1er jour de la période (quand non actif). */
  daysUntilStart: number | null;
  /** Date grégorienne du prochain 1er Dhoul-Hijja (quand non actif). */
  startDate: Date | null;
}

export function dhulHijjahStatus(now: Date = new Date()): DhulHijjahStatus {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const idle: DhulHijjahStatus = { active: false, day: null, isArafah: false, isEid: false, daysUntilStart: null, startDate: null };

  // Aujourd'hui dans les 10 premiers jours de Dhoul-Hijja ?
  const todayH = gregorianToHijri(start);
  if (todayH.month === 12 && todayH.day >= 1 && todayH.day <= DHUL_HIJJA_DAYS) {
    return {
      ...idle,
      active: true,
      day: todayH.day,
      isArafah: todayH.day === DAY_OF_ARAFAH,
      isEid: todayH.day === EID_DAY,
    };
  }

  // Sinon : scan jusqu'au prochain 1er Dhoul-Hijja
  for (let i = 1; i <= MAX_SCAN_DAYS; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const h = gregorianToHijri(d);
    if (h.month === 12 && h.day === 1) {
      return { ...idle, daysUntilStart: i, startDate: d };
    }
  }
  return idle;
}

/** Rappels d'actions pour un jour donné de la période. */
export type DhulHijjahAction =
  | 'fasting'
  | 'arafahFasting'
  | 'noFasting'
  | 'dhikr'
  | 'sadaqa'
  | 'quran'
  | 'takbir'
  | 'arafahDua'
  | 'udhiya';

/** Actions recommandées par jour (1 à 10). */
export function dayActions(day: number): DhulHijjahAction[] {
  if (day < 1 || day > DHUL_HIJJA_DAYS) return [];
  if (day === DAY_OF_ARAFAH) return ['arafahFasting', 'arafahDua', 'takbir', 'sadaqa'];
  if (day === EID_DAY) return ['noFasting', 'takbir', 'udhiya'];
  return ['fasting', 'dhikr', 'sadaqa', 'quran'];
}

/** Texte arabe + translittération de l'invocation liée à une action (null si aucune). */
export function invocationFor(action: DhulHijjahAction): { arabic: string; transliteration: string } | null {
  switch (action) {
    case 'takbir':
      return {
        arabic: 'اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، لَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، وَلِلَّهِ الْحَمْدُ',
        transliteration: 'Allahu Akbar, Allahu Akbar, la ilaha illa Allah, wallahu Akbar, Allahu Akbar wa lillahil-hamd',
      };
    case 'arafahDua':
      return {
        arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
        transliteration: 'La ilaha illa Allah wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa \u2018ala kulli shay\u2019in qadir',
      };
    default:
      return null;
  }
}
