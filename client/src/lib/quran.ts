import { dbGet, dbSet } from './db';
import { FRENCH_NAMES, KEYWORDS, SURAHS, type SurahMeta } from './surahs';
import type { SearchMatchType, SearchResult, Verse } from './types';

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

/** Builds a surah-level match result (name / keyword / number hit). */
function surahResult(s: SurahMeta, matchType: SearchMatchType): SearchResult {
  const fr = FRENCH_NAMES[s.number];
  const parts = [fr ? `${fr} — ` : '', s.english, ` — ${s.ayahs} versets`, `(${s.revelation === 'Meccan' ? 'Mecquoise' : 'Médinoise'})`];
  return {
    chapter: s.number,
    verse: 1,
    arabic: s.arabic,
    translated: parts.join(''),
    surahName: s.name,
    isSurahMatch: true,
    matchType,
  };
}

/** Résout une requête de type "2", "2:255", "sourate 2" ou "2 255". */
function parseNumeric(query: string): { chapter: number; verse?: number } | null {
  const q = query.trim().toLowerCase();
  const surate = q.replace(/^sourate\s+/i, '');
  let m = surate.match(/^(\d{1,3})\s*[:.\s]\s*(\d{1,3})$/);
  if (m) {
    const chapter = Number(m[1]);
    const verse = Number(m[2]);
    if (chapter >= 1 && chapter <= 114 && verse >= 1) return { chapter, verse };
    return null;
  }
  m = surate.match(/^(\d{1,3})$/);
  if (m) {
    const chapter = Number(m[1]);
    if (chapter >= 1 && chapter <= 114) return { chapter };
  }
  return null;
}

export async function searchQuran(query: string, translation: TranslationKey): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const isArabic = /[\u0600-\u06FF]/.test(q);

  const results: SearchResult[] = [];

  // --- 0. Recherche numérique : "2", "2:255", "sourate 36" ---
  const numeric = parseNumeric(q);
  if (numeric) {
    if (numeric.verse) {
      try {
        const [ar, tr] = await Promise.all([
          fetchSurah(EDITIONS.ar, numeric.chapter),
          fetchSurah(EDITIONS[translation], numeric.chapter),
        ]);
        const a = ar.find((v) => v.verse === numeric.verse);
        const t = tr.find((v) => v.verse === numeric.verse);
        results.push({
          chapter: numeric.chapter,
          verse: numeric.verse,
          arabic: a?.text ?? '',
          translated: t?.text ?? '',
          surahName: getSurahMeta(numeric.chapter)?.name ?? String(numeric.chapter),
          matchType: 'number',
        });
      } catch {
        const s = getSurahMeta(numeric.chapter);
        if (s) results.push(surahResult(s, 'number'));
      }
      return results;
    }
    const s = getSurahMeta(numeric.chapter);
    if (s) {
      results.push(surahResult(s, 'number'));
      return results;
    }
  }

  // --- 1. Recherche par nom de sourate (français, translittération, anglais, arabe) + mots-clés ---
  const norm = isArabic ? normalizeArabic(q) : normalizeLatin(q);
  if (norm) {
    for (const s of SURAHS) {
      const fr = FRENCH_NAMES[s.number];
      const nameMatch = fuzzyMatch(q, s.name);
      const frMatch = fr ? fuzzyMatch(q, fr) : false;
      const engMatch = fuzzyMatch(q, s.english);
      const arMatch = isArabic && normalizeArabic(s.arabic).includes(norm);
      const kwMatch = !isArabic && (KEYWORDS[s.number] ?? []).some((k) => fuzzyMatch(q, k));
      const kwArMatch = isArabic && (KEYWORDS[s.number] ?? []).some((k) => normalizeArabic(k).includes(norm));
      let matchType: SearchMatchType | null = null;
      if (arMatch) matchType = 'arabic';
      else if (nameMatch) matchType = 'phonetic';
      else if (frMatch) matchType = 'french';
      else if (engMatch) matchType = 'english';
      else if (kwMatch || kwArMatch) matchType = 'keyword';
      if (matchType) {
        results.push(surahResult(s, matchType));
      }
    }
  }

  // --- 2. Recherche dans le texte des versets ---
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
            matchType: 'verse',
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
            matchType: 'verse',
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
