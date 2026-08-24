/**
 * Calendrier hégirien : conversion grégorien → hégirien (algorithme Umm al-Qura).
 * Données des événements islamiques majeurs.
 */

export interface HijriDate {
  day: number;
  month: number; // 1-12
  year: number;
  monthName: string;
  monthNameAr: string;
}

export interface IslamicEvent {
  month: number; // 1-12 (hégirien)
  day: number;
  name: string;
  nameAr: string;
  description: string;
  type: 'holiday' | 'recommended' | 'historical';
}

export const HIJRI_MONTHS = [
  { en: 'Muharram', ar: 'مُحَرَّم', fr: 'Mouharram' },
  { en: 'Safar', ar: 'صَفَر', fr: 'Safar' },
  { en: 'Rabi al-Awwal', ar: 'رَبِيعُ الْأَوَّل', fr: 'Rabi\` al-Awwal' },
  { en: 'Rabi al-Thani', ar: 'رَبِيعُ الثَّانِي', fr: 'Rabi\` ath-Thani' },
  { en: 'Jumada al-Awwal', ar: 'جُمَادَى الْأُولَى', fr: 'Joumada al-Oula' },
  { en: 'Jumada al-Thani', ar: 'جُمَادَى الْآخِرَة', fr: 'Joumada ath-Thania' },
  { en: 'Rajab', ar: 'رَجَب', fr: 'Rajab' },
  { en: 'Sha\'ban', ar: 'شَعْبَان', fr: 'Cha\`ban' },
  { en: 'Ramadan', ar: 'رَمَضَان', fr: 'Ramadan' },
  { en: 'Shawwal', ar: 'شَوَّال', fr: 'Chawwal' },
  { en: 'Dhu al-Qi\'dah', ar: 'ذُو الْقَعْدَة', fr: 'Dhou al-Qi\`da' },
  { en: 'Dhu al-Hijjah', ar: 'ذُو الْحِجَّة', fr: 'Dhou al-Hijja' },
];

export const ISLAMIC_EVENTS: IslamicEvent[] = [
  { month: 1, day: 1, name: 'Nouvel an hégirien', nameAr: 'رأس السنة الهجرية', description: 'Début de l\'année islamique (1er Mouharram).', type: 'holiday' },
  { month: 1, day: 10, name: 'Achoura', nameAr: 'عَاشُورَاء', description: 'Jour de jeûne recommandé (10 Mouharram). Commémore le sauvetage de Moussa (as) et le martyr de l\'Imam Hussein.', type: 'recommended' },
  { month: 3, day: 12, name: 'Mawlid an-Nabawi', nameAr: 'الْمَوْلِدُ النَّبَوِي', description: 'Anniversaire de la naissance du Prophète Muhammad ﷺ (12 Rabi\` al-Awwal).', type: 'holiday' },
  { month: 7, day: 1, name: 'Début de Rajab', nameAr: 'بِدَايَةُ رَجَب', description: 'Un des quatre mois sacrés. Premier mois de jeûne recommandé avant Ramadan.', type: 'recommended' },
  { month: 7, day: 27, name: 'Al-Isra\' wal-Mi\'raj', nameAr: 'الْإِسْرَاءُ وَالْمِعْرَاج', description: 'Le voyage nocturne et l\'ascension du Prophète ﷺ de La Mecque à Jérusalem puis vers les cieux (27 Rajab).', type: 'historical' },
  { month: 8, day: 15, name: 'Laylat al-Bara\'ah', nameAr: 'لَيْلَةُ الْبَرَاءَة', description: 'Nuit du milieu de Cha\`ban (15 Cha\`ban), nuit du pardon et de la miséricorde.', type: 'recommended' },
  { month: 9, day: 1, name: 'Début du Ramadan', nameAr: 'بِدَايَةُ رَمَضَان', description: 'Premier jour du mois béni de Ramadan, mois du jeûne obligatoire.', type: 'holiday' },
  { month: 9, day: 27, name: 'Laylat al-Qadr', nameAr: 'لَيْلَةُ الْقَدْر', description: 'La Nuit du Destin (27 Ramadan), « meilleure que mille mois » (Sourate 97).', type: 'recommended' },
  { month: 10, day: 1, name: 'Aïd al-Fitr', nameAr: 'عِيدُ الْفِطْر', description: 'Fête de la rupture du jeûne (1er Chawwal). L\'une des deux fêtes majeures de l\'Islam.', type: 'holiday' },
  { month: 12, day: 8, name: 'Jour de Arafah', nameAr: 'يَوْمُ عَرَفَة', description: 'Jour du wukuf à Arafat pendant le Hajj (8 Dhou al-Hijja). Jeûne recommandé pour les non-pèlerins.', type: 'recommended' },
  { month: 12, day: 9, name: 'Jour de Arafah (9)', nameAr: 'يَوْمُ عَرَفَة (٩)', description: 'Veille de l\'Aïd. Jeûne fortement recommandé (expie les péchés de 2 ans).', type: 'recommended' },
  { month: 12, day: 10, name: 'Aïd al-Adha', nameAr: 'عِيدُ الْأَضْحَى', description: 'Fête du sacrifice (10 Dhou al-Hijja). Commémore le sacrifice d\'Ibrahim (as).', type: 'holiday' },
  { month: 12, day: 11, name: 'Jours de Tashriq', nameAr: 'أَيَّامُ التَّشْرِيق', description: 'Jours de Tashriq (11-13 Dhou al-Hijja), pendant le Hajj.', type: 'historical' },
];

/**
 * Convertit une date grégorienne en date hégirien (algorithme Kuwaiti).
 * Basé sur une approximation arithmétique (précision ±1 jour).
 */
export function gregorianToHijri(date: Date): HijriDate {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();

  let jd: number;
  if (gy > 1582 || (gy === 1582 && gm > 10) || (gy === 1582 && gm === 10 && gd > 14)) {
    jd = Math.floor((1461 * (gy + 4800 + Math.floor((gm - 14) / 12))) / 4) +
         Math.floor((367 * (gm - 2 - 12 * Math.floor((gm - 14) / 12))) / 12) -
         Math.floor((3 * Math.floor((gy + 4900 + Math.floor((gm - 14) / 12)) / 100)) / 4) +
         gd - 32075;
  } else {
    jd = 367 * gy - Math.floor((7 * (gy + 5001 + Math.floor((gm - 9) / 7))) / 4) +
         Math.floor((275 * gm) / 9) + gd + 1729777;
  }

  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = Math.floor(((10985 - l2) / 5316)) * (Math.floor((50 * l2) / 17719)) +
            Math.floor(l2 / 5670) * (Math.floor((43 * l2) / 15238));
  const l3 = l2 - Math.floor((30 - j) / 15) * (Math.floor((17719 * j) / 50)) -
            Math.floor(j / 16) * (Math.floor((15238 * j) / 43)) + 29;
  const hm = Math.floor((24 * l3) / 709);
  const hd = l3 - Math.floor((709 * hm) / 24);
  const hy = 30 * n + j - 30;

  const monthIdx = Math.min(11, Math.max(0, hm - 1));
  return {
    day: hd,
    month: hm,
    year: hy,
    monthName: HIJRI_MONTHS[monthIdx].fr,
    monthNameAr: HIJRI_MONTHS[monthIdx].ar,
  };
}

/** Retourne les événements islamiques pour un mois hégirien donné. */
export function getEventsForMonth(hijriMonth: number): IslamicEvent[] {
  return ISLAMIC_EVENTS.filter((e) => e.month === hijriMonth);
}

/** Retourne les événements islamiques pour un jour hégirien précis. */
export function getEventOnDate(hijriMonth: number, hijriDay: number): IslamicEvent[] {
  return ISLAMIC_EVENTS.filter((e) => e.month === hijriMonth && e.day === hijriDay);
}

/** Calcule le nombre de jours dans un mois hégirien (approximation). */
export function daysInHijriMonth(hijriYear: number, hijriMonth: number): number {
  // Mois impairs = 30 jours, pairs = 29 (simplification arithmétique)
  // Dhou al-Hijja peut faire 30 jours certaines années
  if (hijriMonth === 12) {
    return (hijriYear % 30 === 2 || hijriYear % 30 === 5 || hijriYear % 30 === 7 ||
            hijriYear % 30 === 10 || hijriYear % 30 === 13 || hijriYear % 30 === 16 ||
            hijriYear % 30 === 18 || hijriYear % 30 === 21 || hijriYear % 30 === 24 ||
            hijriYear % 30 === 26 || hijriYear % 30 === 29) ? 30 : 29;
  }
  return hijriMonth % 2 === 1 ? 30 : 29;
}

/**
 * Génère le calendrier d'un mois hégirien complet.
 * Retourne un tableau de 29-30 entrées avec la date grégorienne correspondante.
 */
export interface HijriCalendarDay {
  hijriDay: number;
  hijriMonth: number;
  hijriYear: number;
  gregorian: Date;
  events: IslamicEvent[];
  isToday: boolean;
}

export function buildHijriMonthCalendar(hijriYear: number, hijriMonth: number): HijriCalendarDay[] {
  const days = daysInHijriMonth(hijriYear, hijriMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const result: HijriCalendarDay[] = [];

  // On remonte jusqu'au 1er jour du mois hégirien
  // en partant d'aujourd'hui et en cherchant le jour hégirien = 1
  let searchDate = new Date();
  // On remonte quelques jours pour trouver le début du mois
  searchDate.setDate(searchDate.getDate() - 32);

  // Cherche le premier jour du mois hégirien
  while (true) {
    const h = gregorianToHijri(searchDate);
    if (h.month === hijriMonth && h.day === 1) break;
    searchDate.setDate(searchDate.getDate() + 1);
    // Safety: si on a dépassé 35 jours, on prend une autre approche
    if (searchDate > new Date(Date.now() + 40 * 86400000)) break;
  }

  for (let i = 0; i < days; i++) {
    const d = new Date(searchDate);
    d.setDate(d.getDate() + i);
    const isToday = d.getTime() === today.getTime();
    result.push({
      hijriDay: i + 1,
      hijriMonth,
      hijriYear,
      gregorian: d,
      events: getEventOnDate(hijriMonth, i + 1),
      isToday,
    });
  }

  return result;
}

/** Prochains événements islamiques à partir d'aujourd'hui. */
export function getUpcomingEvents(limit: number = 5): Array<IslamicEvent & { hijriDate: HijriDate; gregorianDate: Date }> {
  const today = gregorianToHijri(new Date());
  const events: Array<IslamicEvent & { hijriDate: HijriDate; gregorianDate: Date }> = [];

  // On scanne les 12 prochains mois hégiriens
  for (let m = 0; m < 12; m++) {
    const month = ((today.month - 1 + m) % 12) + 1;
    const year = today.year + Math.floor((today.month - 1 + m) / 12);
    const monthEvents = getEventsForMonth(month);

    for (const e of monthEvents) {
      // Si on est dans le mois courant, on ne prend que les événements futurs
      if (m === 0 && e.day < today.day) continue;

      // Estimer la date grégorienne
      const cal = buildHijriMonthCalendar(year, month);
      const dayEntry = cal.find((d) => d.hijriDay === e.day);
      if (dayEntry) {
        events.push({
          ...e,
          hijriDate: { day: e.day, month, year, monthName: HIJRI_MONTHS[month - 1].fr, monthNameAr: HIJRI_MONTHS[month - 1].ar },
          gregorianDate: dayEntry.gregorian,
        });
      }
    }
  }

  // Trier par date grégorienne
  events.sort((a, b) => a.gregorianDate.getTime() - b.gregorianDate.getTime());
  return events.slice(0, limit);
}

/** Formatage d'une date hégirien en chaîne. */
export function formatHijri(date: Date, lang: 'fr' | 'en' | 'ar' = 'fr'): string {
  const h = gregorianToHijri(date);
  const months = lang === 'ar'
    ? HIJRI_MONTHS.map((m) => m.ar)
    : lang === 'en'
    ? HIJRI_MONTHS.map((m) => m.en)
    : HIJRI_MONTHS.map((m) => m.fr);
  return `${h.day} ${months[h.month - 1]} ${h.year} ${lang === 'ar' ? 'هـ' : 'AH'}`;
}
