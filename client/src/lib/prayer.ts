import { Coordinates, CalculationMethod, PrayerTimes, Madhab, Prayer } from 'adhan';

export const PRAYER_KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type PrayerKey = (typeof PRAYER_KEYS)[number];

export const PRAYER_METHODS: {
  id: string;
  label: string;
  make: () => ReturnType<typeof CalculationMethod.Other>;
  api?: boolean; // uses AlAdhan API instead of local calculation
}[] = [
  {
    id: 'aladhan-api',
    label: 'AlAdhan API (recommandé)',
    make: () => { const p = CalculationMethod.Other(); p.fajrAngle = 12; p.ishaAngle = 12; return p; },
    api: true,
  },
  {
    id: 'uoif',
    label: 'UOIF (France, 12°)',
    make: () => { const p = CalculationMethod.Other(); p.fajrAngle = 12; p.ishaAngle = 12; return p; },
  },
  {
    id: 'mosquee-paris',
    label: 'Mosquée de Paris (18°)',
    make: () => { const p = CalculationMethod.Other(); p.fajrAngle = 18; p.ishaAngle = 18; return p; },
  },
  { id: 'muslim-world-league', label: 'Muslim World League', make: () => CalculationMethod.MuslimWorldLeague() },
  { id: 'egyptian', label: 'Egyptian', make: () => CalculationMethod.Egyptian() },
  { id: 'karachi', label: 'Karachi', make: () => CalculationMethod.Karachi() },
  { id: 'umm-al-qura', label: 'Umm al-Qura', make: () => CalculationMethod.UmmAlQura() },
  { id: 'north-america', label: 'North America (ISNA)', make: () => CalculationMethod.NorthAmerica() },
  { id: 'moonsighting', label: 'Moonsighting Committee', make: () => CalculationMethod.MoonsightingCommittee() },
];

export function computePrayers(
  coords: { lat: number; lng: number },
  methodId: string,
  date?: Date,
) {
  const method = PRAYER_METHODS.find((m) => m.id === methodId) ?? PRAYER_METHODS[0];
  const params = method.make();
  params.madhab = Madhab.Shafi;
  const pt = new PrayerTimes(new Coordinates(coords.lat, coords.lng), date ?? new Date(), params);
  const now = date ?? new Date();
  const next = pt.nextPrayer(now);
  return {
    fajr: pt.fajr,
    sunrise: pt.sunrise,
    dhuhr: pt.dhuhr,
    asr: pt.asr,
    maghrib: pt.maghrib,
    isha: pt.isha,
    next:
      next && next !== Prayer.None && pt.timeForPrayer(next)
        ? { key: (next as unknown as PrayerKey), date: pt.timeForPrayer(next)! }
        : null,
  };
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function getNextPrayerKey(pt: ReturnType<typeof computePrayers>): PrayerKey | null {
  return pt.next?.key ?? null;
}

export function prayerLabel(key: PrayerKey): string {
  return `prayer.${key}`;
}
