import { EDITIONS, fetchEdition, getSurahMeta, normalizeArabic } from './quran';
import type { Verse } from './types';

/**
 * Normalisation du texte coranique (édition ara-quranacademy).
 * En plus de la normalisation de base, gère :
 *  - les harakat étendus (U+08F0-U+08FF, ex. ࣱ) ;
 *  - le « ی » persan (U+06CC) utilisé dans cette édition au lieu du « ي » arabe ;
 *  - la wasla ٱ et le tatweel ـ.
 */
export function normalizeQuranic(s: string): string {
  return s
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640\u08F0-\u08FF]/g, '')
    .replace(/\u06CC/g, '\u064A')
    .replace(/[\u0622\u0623\u0625]/g, '\u0627')
    .replace(/\u0671/g, '\u0627')
    .replace(/\u0649/g, '\u064A')
    .replace(/\u0629/g, '\u0647')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Racine trilitère de chaque Nom (ordre canonique des 99).
 * Une racine plus courte que le nom complet permet de trouver les versets
 * qui « parlent » du concept même quand le Nom n'y figure pas littéralement
 * (ex. الرحيم → رحم → versets de la miséricorde).
 */
export const NAME_ROOTS: string[] = [
  'رحم', 'رحم', 'ملك', 'قدس', 'سلم', 'امن', 'هيمن', 'عز', 'جبر', 'كبر',
  'خلق', 'برا', 'صور', 'غفر', 'قهر', 'وهب', 'رزق', 'فتح', 'علم', 'قبض',
  'بسط', 'خفض', 'رفع', 'عز', 'ذلل', 'سمع', 'بصر', 'حكم', 'عدل', 'لطف',
  'خبر', 'حلم', 'عظم', 'غفر', 'شكر', 'علو', 'كبر', 'حفظ', 'قوت', 'حسب',
  'جلل', 'كرم', 'رقب', 'جوب', 'وسع', 'حكم', 'ودد', 'مجد', 'بعث', 'شهد',
  'حق', 'وكل', 'قوي', 'متن', 'ولي', 'حمد', 'حصي', 'بدا', 'عود', 'حيي',
  'موت', 'حي', 'قوم', 'وجد', 'مجد', 'وحد', 'احد', 'صمد', 'قدر', 'قدر',
  'قدم', 'اخر', 'اول', 'اخر', 'ظهر', 'بطن', 'ولي', 'علو', 'برر', 'توب',
  'نقم', 'عفو', 'راف', 'ملك', 'جلل', 'قسط', 'جمع', 'غني', 'غني', 'منع',
  'ضرر', 'نفع', 'نور', 'هدي', 'بدع', 'بقي', 'ورث', 'رشد', 'صبر',
];

/**
 * Replis manuels pour les noms dont ni la forme complète ni la racine
 * n'apparaissent dans le Coran (formes faibles ou rares). Chaque repli est
 * une séquence recherchée dans le texte normalisé.
 */
export const NAME_FALLBACKS: Record<number, string[]> = {
  // الماجد « Le Magnifique » : le Coran emploie « المجيد » (85:15, 11:73).
  64: ['مجيد'],
};

export interface NameVerseHit {
  chapter: number;
  verse: number;
  arabic: string;
  translated: string;
  surahName: string;
  /** Comment le verset a été trouvé : nom complet, tige, racine ou repli. */
  matchedBy: 'name' | 'stem' | 'root' | 'fallback';
}

/**
 * Cherche les versets liés à un Nom.
 *
 * Stratégie, par ordre de précision :
 *  1. le nom complet (ex. « الرحمن ») ;
 *  2. le nom sans « ال » (ex. « رحمن » — couvre les formes préfixées) ;
 *  3. la racine trilitère (ex. « رحم » — concepts associés) ;
 *  4. un repli manuel si nécessaire.
 *
 * Retourne au plus `limit` versets, tous en mémoire (éditions déjà mises
 * en cache par le module quran).
 */
export async function findNameVerses(
  nameIndex: number,
  arabicName: string,
  opts: { limit?: number } = {},
): Promise<NameVerseHit[]> {
  const limit = opts.limit ?? 5;

  const full = normalizeQuranic(arabicName);
  const stem = full.startsWith('ال') ? full.slice(2) : full;
  const root = NAME_ROOTS[nameIndex] ?? '';
  const fallbacks = NAME_FALLBACKS[nameIndex] ?? [];

  const [ar, fr] = await Promise.all([fetchEdition(EDITIONS.ar), fetchEdition(EDITIONS.fr)]);
  const arNorm = ar.map((v) => ({ v, text: normalizeQuranic(v.text) }));

  // 1-2. Nom complet puis tige (sans ال).
  let pattern: string | null = null;
  let matchedBy: NameVerseHit['matchedBy'] = 'name';
  if (arNorm.some((x) => x.text.includes(full))) {
    pattern = full;
  } else if (stem !== full && arNorm.some((x) => x.text.includes(stem))) {
    pattern = stem;
    matchedBy = 'stem';
  }
  // 3. Racine trilitère.
  if (!pattern && root.length >= 2 && arNorm.some((x) => x.text.includes(root))) {
    pattern = root;
    matchedBy = 'root';
  }
  // 4. Repli manuel.
  if (!pattern) {
    for (const f of fallbacks) {
      if (arNorm.some((x) => x.text.includes(f))) {
        pattern = f;
        matchedBy = 'fallback';
        break;
      }
    }
  }
  if (!pattern) return [];

  const hits: NameVerseHit[] = [];
  for (const { v, text } of arNorm) {
    if (!text.includes(pattern)) continue;
    const tr = fr.find((x) => x.chapter === v.chapter && x.verse === v.verse);
    hits.push({
      chapter: v.chapter,
      verse: v.verse,
      arabic: v.text,
      translated: tr?.text ?? '',
      surahName: getSurahMeta(v.chapter)?.name ?? String(v.chapter),
      matchedBy,
    });
    if (hits.length >= limit) break;
  }
  return hits;
}

/** Réexporte la normalisation de base (pour compatibilité). */
export { normalizeArabic };
export type { Verse };
