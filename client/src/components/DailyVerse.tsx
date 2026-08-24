import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n';
import { EDITIONS, fetchEdition, getSurahMeta } from '../lib/quran';
import type { Verse } from '../lib/types';
import { VerseShareButton } from './VerseShareCard';

/** Hash déterministe d'une chaîne. */
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Seed stable par jour : change à minuit (UTC), identique toute la journée. */
function daySeed(): number {
  const now = new Date();
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000);
}

/** Petite collection de hadiths (tirés des recueils authentiques). */
const HADITHS: { text: string; source: string }[] = [
  { text: "« Les actions ne valent que par leurs intentions, et à chacun selon son intention. »", source: 'Rapporté par Al-Bukhari et Muslim' },
  { text: "« Le meilleur d'entre vous est celui qui apprend le Coran et l'enseigne. »", source: 'Rapporté par Al-Bukhari' },
  { text: "« Le croyant fort est meilleur et plus aimé d'Allah que le croyant faible. »", source: 'Rapporté par Muslim' },
  { text: "« La prière est la lumière, la charité est une preuve, la patience est une illumination. »", source: 'Rapporté par Muslim' },
  { text: "« Celui qui croit en Allah et au Jour Dernier, qu'il dise du bien ou qu'il se taise. »", source: 'Rapporté par Al-Bukhari et Muslim' },
  { text: "« La pureté est la moitié de la foi. »", source: 'Rapporté par Muslim' },
  { text: "« Souris à ton frère : c'est une aumône pour toi. »", source: 'Rapporté par At-Tirmidhi' },
  { text: "« Nul d'entre vous ne croit vraiment tant qu'il n'aime pas pour son frère ce qu'il aime pour lui-même. »", source: 'Rapporté par Al-Bukhari et Muslim' },
  { text: "« La meilleure des paroles est la parole d'Allah, et la meilleure des guidées est la guidée de Muhammad. »", source: 'Rapporté par Muslim' },
];

export function DailyVerse() {
  const { t } = useI18n();
  const [arEdition, setArEdition] = useState<Verse[] | null>(null);
  const [trEdition, setTrEdition] = useState<Verse[] | null>(null);
  const [error, setError] = useState(false);
  const [shuffle, setShuffle] = useState(0);

  useEffect(() => {
    let alive = true;
    setArEdition(null);
    setTrEdition(null);
    setError(false);
    Promise.all([fetchEdition(EDITIONS.ar), fetchEdition(EDITIONS.fr)])
      .then(([ar, fr]) => {
        if (!alive) return;
        setArEdition(ar);
        setTrEdition(fr);
      })
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

  // Choisir verset OU hadith selon la parité du seed du jour (+ shuffle manuel)
  const pick = useMemo(() => {
    const index = daySeed() + shuffle;
    const pickHadith = index % 2 === 1;

    if (pickHadith) {
      const h = HADITHS[hashStr(`h${index}`) % HADITHS.length];
      return { isHadith: true as const, verse: null as Verse | null, hadith: h, translated: '' };
    }

    if (arEdition && trEdition && arEdition.length > 0) {
      const v = arEdition[hashStr(`v${index}`) % arEdition.length];
      const tr = trEdition.find((x) => x.chapter === v.chapter && x.verse === v.verse);
      return { isHadith: false as const, verse: v, hadith: null, translated: tr?.text ?? '' };
    }
    return { isHadith: false as const, verse: null as Verse | null, hadith: null, translated: '' };
  }, [arEdition, trEdition, shuffle]);

  const meta = pick.verse ? getSurahMeta(pick.verse.chapter) : undefined;

  return (
    <section className="card mb-4 border-gold-500/40 bg-gradient-to-br from-gold-900/15 via-transparent to-emerald-900/15 p-4 shadow-glow">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gold-400">
          ✨ {t('dailyVerse.title')}
        </h2>
        <div className="flex items-center gap-1">
          {pick.verse && meta && (
            <VerseShareButton
              chapter={pick.verse.chapter}
              verse={pick.verse.verse}
              arabic={pick.verse.text}
              translated={pick.translated}
              surahName={meta.name}
              surahArabic={meta.arabic}
            />
          )}
          <button
            onClick={() => setShuffle((s) => s + 1)}
            className="chip hover:!border-gold-500/50 hover:!text-gold-300"
            title={t('dailyVerse.new')}
            aria-label={t('dailyVerse.new')}
          >
            🎲
          </button>
        </div>
      </div>

      {error ? (
        <p className="text-xs text-red-400">{t('dailyVerse.error')}</p>
      ) : !arEdition ? (
        <p className="text-xs text-stone-400">{t('dailyVerse.loading')}</p>
      ) : pick.isHadith && pick.hadith ? (
        <blockquote className="text-sm leading-relaxed text-stone-100">
          {pick.hadith.text}
          <footer className="mt-2 text-xs text-stone-500">— {pick.hadith.source}</footer>
        </blockquote>
      ) : pick.verse ? (
        <>
          <p className="font-quran text-right text-xl leading-loose text-gold-50" dir="rtl">
            {pick.verse.text}
          </p>
          {pick.translated && (
            <p className="mt-2 border-t border-gold-500/20 pt-2 text-sm leading-relaxed text-stone-300">
              {pick.translated}
            </p>
          )}
          <p className="mt-2 text-xs text-emerald-400">
            {meta?.name} · {pick.verse.chapter}:{pick.verse.verse}
          </p>
        </>
      ) : null}
    </section>
  );
}
