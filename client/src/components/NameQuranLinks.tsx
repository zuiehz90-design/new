import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { VerseModal } from './VerseModal';
import { findNameVerses, type NameVerseHit } from '../lib/nameQuran';

interface Props {
  /** Index du nom dans NAMES_99. */
  nameIndex: number;
  /** Nom arabe (pour la recherche). */
  arabicName: string;
}

/**
 * Versets du Coran liés à un Nom d'Allah, avec bouton « Lire dans le Coran »
 * qui ouvre le lecteur sur la sourate:verset exacte.
 */
export function NameQuranLinks({ nameIndex, arabicName }: Props) {
  const { t } = useI18n();
  const [hits, setHits] = useState<NameVerseHit[] | null>(null);
  const [open, setOpen] = useState<NameVerseHit | null>(null);

  useEffect(() => {
    let alive = true;
    setHits(null);
    void findNameVerses(nameIndex, arabicName, { limit: 3 }).then((h) => {
      if (alive) setHits(h);
    });
    return () => { alive = false; };
  }, [nameIndex, arabicName]);

  if (hits === null) return null; // chargement silencieux
  if (hits.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="mb-2 text-center text-[11px] font-semibold text-gold-400">
        📖 {t('names99.quranVerses')}
      </p>
      <div className="space-y-2">
        {hits.map((h) => (
          <div key={`${h.chapter}:${h.verse}`} className="rounded-xl border border-stone-700/40 bg-stone-800/30 p-3">
            <p className="font-quran text-right text-lg leading-loose text-gold-50" dir="rtl">
              {h.arabic}
            </p>
            {h.translated && (
              <p className="mt-1 border-t border-stone-700/30 pt-1.5 text-xs leading-relaxed text-stone-300">
                {h.translated}
              </p>
            )}
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] text-emerald-400">
                {h.surahName} · {h.chapter}:{h.verse}
              </span>
              <button
                onClick={() => setOpen(h)}
                className="btn-ghost px-2 py-1 text-[10px] border-gold-500/40 text-gold-300"
              >
                📖 {t('names99.quranRead')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <VerseModal
          chapter={open.chapter}
          verse={open.verse}
          surahName={open.surahName}
          arabic={open.arabic}
          translated={open.translated}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}
