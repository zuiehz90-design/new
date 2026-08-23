import { dbGet, dbSet } from './db';
import { SURAHS, type SurahMeta } from './surahs';
import type { SearchResult, Verse } from './types';

export const EDITIONS = {
  ar: 'ara-quranacademy',
  fr: 'fra-muhammadhamidul',
  en: 'eng-abdelhaleem',
} as const;

export type TranslationKey = keyof typeof EDITIONS;

const BASE = 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1';
const memory = new Map<string, Verse[]>();

export async function fetchEdition(edition: string): Promise<Verse[]> {
  if (memory.has(edition)) return memory.get(edition)!;
  const cached = await dbGet<Verse[]>(`edition:${edition}`);
  if (cached && cached.length > 0) {
    memory.set(edition, cached);
    return cached;
  }
  const res = await fetch(`${BASE}/editions/${edition}.min.json`);
  if (!res.ok) throw new Error(`Erreur de chargement de l'édition ${edition} (${res.status})`);
  // L'API enveloppe le tableau dans un objet : { "quran": [...] }
  const raw = (await res.json()) as { quran: Verse[] };
  const data = Array.isArray(raw) ? (raw as unknown as Verse[]) : raw.quran;
  memory.set(edition, data);
  void dbSet(`edition:${edition}`, data);
  return data;
}

export async function fetchSurah(edition: string, chapter: number): Promise<Verse[]> {
  const key = `${edition}:${chapter}`;
  if (memory.has(key)) return memory.get(key)!;
  const res = await fetch(`${BASE}/editions/${edition}/${chapter}.min.json`);
  if (!res.ok) throw new Error(`Erreur de chargement de la sourate ${chapter} (${res.status})`);
  // L'API enveloppe le tableau dans un objet : { "chapter": [...] }
  const raw = (await res.json()) as { chapter: Verse[] };
  const data = Array.isArray(raw) ? (raw as unknown as Verse[]) : raw.chapter;
  memory.set(key, data);
  return data;
}

export function normalizeArabic(s: string): string {
  return s
    .replace(/[\u064B-\u0652\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeLatin(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
/** Fuzzy match for Arabic transliterations: strip vowels, normalize common variants. */
function fuzzyMatch(query: string, target: string): boolean {
  const nq = normalizeLatin(query);
  const nt = normalizeLatin(target);
  if (nt.includes(nq)) return true;
  const stripVowels = (s: string) => s.replace(/[aeiou]/g, '').replace(/[^a-z]/g, '');
  const nqStripped = stripVowels(nq);
  const ntStripped = stripVowels(nt);
  if (nqStripped.length >= 3 && ntStripped.includes(nqStripped)) return true;
  const variants: [RegExp, string][] = [
    [/qu/g, 'q'], [/kh/g, 'k'], [/th/g, 't'], [/dh/g, 'z'],
    [/sh/g, 's'], [/ch/g, 'k'], [/ou/g, 'u'], [/aa/g, 'a'],
  ];
  let normQ = nq;
  let normT = nt;
  for (const [re, rep] of variants) { normQ = normQ.replace(re, rep); normT = normT.replace(re, rep); }
  if (normT.includes(normQ)) return true;
  const nqFinal = stripVowels(normQ);
  const ntFinal = stripVowels(normT);
  if (nqFinal.length >= 3 && ntFinal.includes(nqFinal)) return true;
  return false;
}


export function getSurahMeta(chapter: number): SurahMeta | undefined {
  return SURAHS[chapter - 1];
}

export async function searchQuran(query: string, translation: TranslationKey): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const isArabic = /[؀-ۿ]/.test(q);

  const results: SearchResult[] = [];

  // --- 1. Search surah names first (always, Arabic or Latin) ---
  const norm = isArabic ? normalizeArabic(q) : normalizeLatin(q);
  if (norm) {
    for (const s of SURAHS) {
      const nameMatch = fuzzyMatch(q, s.name);
      const engMatch = fuzzyMatch(q, s.english);
      const arMatch = isArabic && normalizeArabic(s.arabic).includes(norm);
      if (nameMatch || engMatch || arMatch) {
        results.push({
          chapter: s.number,
          verse: 1,
          arabic: s.arabic,
          translated: `${s.english} — ${s.ayahs} versets (${s.revelation === 'Meccan' ? 'Mecquoise' : 'Médinoise'})`,
          surahName: s.name,
          isSurahMatch: true,
        });
      }
    }
  }

  // --- 2. Search verse text ---
  if (isArabic) {
    const ar = await fetchEdition(EDITIONS.ar);
    const normAr = normalizeArabic(q);
    if (normAr) {
      for (const v of ar) {
        if (normalizeArabic(v.text).includes(normAr)) {
          results.push({
            chapter: v.chapter,
            verse: v.verse,
            arabic: v.text,
            translated: '',
            surahName: getSurahMeta(v.chapter)?.name ?? String(v.chapter),
          });
        }
        if (results.length >= 60) break;
      }
    }
  } else {
    const tr = await fetchEdition(EDITIONS[translation]);
    if (norm) {
      for (const v of tr) {
        if (normalizeLatin(v.text).includes(norm)) {
          const ar = memory.get(EDITIONS.ar);
          const arabicVerse = ar?.find((a) => a.chapter === v.chapter && a.verse === v.verse);
          results.push({
            chapter: v.chapter,
            verse: v.verse,
            arabic: arabicVerse?.text ?? '',
            translated: v.text,
            surahName: getSurahMeta(v.chapter)?.name ?? String(v.chapter),
          });
        }
        if (results.length >= 60) break;
      }
    }
  }
  return results;
}
export const RECITERS = [
  { id: 'Alafasy_128kbps', name: 'Mishary Rashid Alafasy' },
  { id: 'Husary_128kbps', name: 'Mahmoud Khalil Al-Husary' },
  { id: 'Minshawy_Murattal_128kbps', name: 'Mohamed Siddiq El-Minshawi' },
  { id: 'Abdurrahmaan_As-Sudais_192kbps', name: 'Abdurrahman As-Sudais' },
  { id: 'Hudhaify_128kbps', name: 'Ali Al-Hudhaify' },
];

export function audioUrl(reciter: string, chapter: number, verse: number): string {
  const s = String(chapter).padStart(3, '0');
  const v = String(verse).padStart(3, '0');
  return `https://everyayah.com/data/${reciter}/${s}${v}.mp3`;
}

export const TAFSIR_EDITION = 'ara-sirajtafseer';

export async function fetchTafsir(chapter: number): Promise<Verse[]> {
  const key = `tafsir:${chapter}`;
  if (memory.has(key)) return memory.get(key)!;
  const cached = await dbGet<Verse[]>(key);
  if (cached && cached.length > 0) {
    memory.set(key, cached);
    return cached;
  }
  const res = await fetch(`${BASE}/editions/${TAFSIR_EDITION}/${chapter}.min.json`);
  if (!res.ok) throw new Error(`Erreur de chargement du tafsir ${chapter} (${res.status})`);
  const raw = (await res.json()) as { chapter: Verse[] };
  const data = Array.isArray(raw) ? (raw as unknown as Verse[]) : raw.chapter;
  memory.set(key, data);
  void dbSet(key, data);
  return data;
}
