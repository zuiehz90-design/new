import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';

interface VerseModalProps {
  chapter: number;
  verse: number;
  surahName: string;
  arabic: string;
  translated?: string;
  onClose: () => void;
}

export function VerseModal({ chapter, verse, surahName, arabic, translated, onClose }: VerseModalProps) {
  const { t } = useI18n();
  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-lg p-5 animate-fade-in"
        style={{ borderColor: 'rgba(212,175,55,0.45)', boxShadow: 'var(--shadow-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-gold-400">
            {surahName} · {chapter}:{verse}
          </p>
          <button onClick={onClose} className="rounded-lg p-1.5 text-stone-400 transition hover:bg-white/5 hover:text-white" aria-label={t('common.close')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-5 w-5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="font-quran text-right text-2xl leading-loose text-gold-50" dir="rtl">{arabic}</p>
        {translated && (
          <p className="mt-3 border-t border-gold-500/20 pt-3 text-sm leading-relaxed text-stone-200">{translated}</p>
        )}
        <Link
          to={`/quran?surah=${chapter}&verse=${verse}`}
          className="btn-gold mt-4 w-full justify-center text-sm"
          onClick={onClose}
        >
          📖 {t('names99.quranRead')}
        </Link>
      </div>
    </div>,
    document.body
  );
}
