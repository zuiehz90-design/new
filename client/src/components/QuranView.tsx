import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useSettings } from '../context/SettingsContext';
import { SURAHS } from '../lib/surahs';
import { useReadingPosition } from '../context/ReadingPositionContext';
import { EDITIONS, fetchSurah, searchQuran, type TranslationKey } from '../lib/quran';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { storageKey } from '../lib/storageScope';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { getToken } from '../lib/api';
import { VerseShareButton } from './VerseShareCard';
import type { SearchResult, Verse } from '../lib/types';

function debounce<F extends (...args: unknown[]) => void>(fn: F, ms: number): F {
  let t: ReturnType<typeof setTimeout>;
  return ((...a: unknown[]) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }) as unknown as F;
}

export function QuranView() {
  const { t } = useI18n();
  const { scope } = useAuth();

  // Preuve « Coran ouvert aujourd'hui » : sert a verifier les quetes de lecture
  useEffect(() => {
    const d = new Date();
    const today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    localStorage.setItem(storageKey(scope, 'quranVisited:' + today), '1');
  }, [scope]);
  const { settings, setSettings } = useSettings();
  const [params, setParams] = useSearchParams();
  const surahParam = Number(params.get('surah'));
  const verseParam = Number(params.get('verse'));
  const initialSurah = Number.isInteger(surahParam) && surahParam >= 1 && surahParam <= 114 ? surahParam : null;

  const [selected, setSelected] = useState<number | null>(initialSurah);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [pinsOpen, setPinsOpen] = useState(false);
  const { getPosition, positions, clearPosition } = useReadingPosition();
  const pinCount = Object.keys(positions).length;

  useEffect(() => {
    // Naviguer vers /quran sans paramètre → retour à la liste des sourates
    setSelected(initialSurah);
  }, [initialSurah]);

  useEffect(() => {
    const s = Number(params.get('surah'));
    const v = Number(params.get('verse'));
    if (Number.isInteger(s) && s >= 1 && s <= 114 && Number.isInteger(v) && v >= 1) {
      setSelected(s);
    }
  }, [params]);

  const openSurah = (n: number) => {
    setSelected(n);
    setParams({ surah: String(n) }, { replace: true });
  };

  const doSearch = debounce(async () => {
    if (query.trim().length < 2) return;
    setSelected(null);
    setParams({}, { replace: true });
    setSearching(true);
    try {
      const r = await searchQuran(query, settings.translation as TranslationKey);
      setResults(r);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, 300);

  return (
    <div className="mx-auto max-w-4xl px-4 pb-8 pt-4">
      <div className="mb-4 text-center">
        <h2 className="font-quran text-3xl font-bold text-gold-400">القرآن الكريم</h2>
        <p className="mt-1 text-sm text-stone-400">{t('quran.title')}</p>
        {/* Mode concentration : toggle rapide, surtout utile en lecture */}
        <button
          onClick={() => setSettings((s) => ({ ...s, focusMode: !s.focusMode }))}
          className={`mt-2 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition ${
            settings.focusMode
              ? 'border-gold-500/70 bg-gold-500/15 text-gold-300'
              : 'border-stone-600/60 bg-stone-800/40 text-stone-400 hover:border-gold-500/50 hover:text-gold-300'
          }`}
          title={t('quran.focusMode')}
        >
          🧘 {settings.focusMode ? t('quran.focusOn') : t('quran.focusOff')}
        </button>
        {pinCount > 0 && (
          <button
            onClick={() => setPinsOpen(true)}
            className="mt-2 inline-flex items-center gap-1 rounded-full border border-gold-500/40 bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-300 transition hover:bg-gold-500/20"
          >
            📍 {t('quran.pins')} ({pinCount})
          </button>
        )}
      </div>

      {/* Recherche */}
      <div className="mb-5 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && doSearch()}
          placeholder={t('quran.searchPlaceholder')}
          className="input"
        />
        <button onClick={doSearch} className="btn-primary shrink-0">
          {t('quran.search')}
        </button>
      </div>

      {searching && <p className="text-sm text-stone-400">{t('quran.loading')}</p>}

      {results.length > 0 && !selected && (
        <>
          <button
            onClick={() => { setResults([]); setQuery(''); }}
            className="btn-ghost mb-2 text-xs"
          >
            ← Retour à la liste
          </button>
          <div className="card mb-4 p-3" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <SearchResults
            results={results}
            onOpen={(s, v) => {
              setSelected(s);
              setParams({ surah: String(s), verse: String(v) }, { replace: true });
            }}
          />
        </div>
        </>
      )}

      {results.length === 0 && !searching && query.trim().length >= 2 && !selected && (
        <p className="text-sm text-stone-500">{t('quran.noResults')}</p>
      )}

      {selected ? (
        <SurahReader
          chapter={selected}
          translation={settings.translation as TranslationKey}
          reciter={settings.reciter}
          highlightVerse={Number.isInteger(verseParam) && verseParam >= 1 ? verseParam : null}
          hasSearch={results.length > 0 || query.trim().length >= 2}
          onBack={() => {
            setSelected(null);
            setParams({}, { replace: true });
          }}
          onBackToSearch={() => {
            setSelected(null);
            setParams({}, { replace: true });
            // Garder la requête et les résultats pour les réafficher
            if (query.trim().length >= 2 && results.length === 0) {
              doSearch();
            }
          }}
        />
      ) : (
        <SurahList onOpen={openSurah} getPosition={getPosition} onClear={(n) => clearPosition(n)} />
      )}

      {pinsOpen && (
        <PinsPanel
          pins={positions}
          onOpen={(s, v) => {
            setResults([]);
            setQuery('');
            setSelected(s);
            setParams({ surah: String(s), verse: String(v) }, { replace: true });
            setPinsOpen(false);
          }}
          onRemove={(n) => {
            const remaining = Object.keys(positions).length - 1;
            clearPosition(n);
            if (remaining <= 0) setPinsOpen(false);
          }}
          onClose={() => setPinsOpen(false)}
        />
      )}
    </div>
  );
}

function PinsPanel({
  pins,
  onOpen,
  onRemove,
  onClose,
}: {
  pins: Record<number, number>;
  onOpen: (surah: number, verse: number) => void;
  onRemove: (surah: number) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const entries = SURAHS.filter((s) => pins[s.number] != null).map((s) => ({ ...s, verse: pins[s.number]! }));
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-night-950/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md border-gold-500/30 bg-night-900 p-5 shadow-glow animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gold-300">
            📍 {t('quran.pinsTitle')} ({entries.length})
          </h3>
          <button onClick={onClose} className="chip" aria-label={t('quran.close')}>
            ✕
          </button>
        </div>
        {entries.length === 0 ? (
          <p className="text-sm text-stone-400">{t('quran.noPins')}</p>
        ) : (
          <ul className="space-y-2">
            {entries.map((e) => (
              <li key={e.number} className="card flex items-center gap-2 border-emerald-900/40 p-2">
                <button onClick={() => onOpen(e.number, e.verse)} className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-sm font-semibold">
                    {e.number} · {e.name}
                  </span>
                  <span className="block text-xs text-gold-300">
                    📍 {t('quran.savedVerse', { n: e.verse })}
                  </span>
                </button>
                <button
                  onClick={() => onRemove(e.number)}
                  className="chip !border-red-500/40 !text-red-300"
                  title={t('quran.removePin')}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SurahList({
  onOpen,
  getPosition,
  onClear,
}: {
  onOpen: (n: number) => void;
  getPosition: (n: number) => number | undefined;
  onClear: (n: number) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {SURAHS.map((s) => (
        <button
          key={s.number}
          onClick={() => onOpen(s.number)}
          className="card card-clickable flex items-center gap-3 p-3 text-left transition"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-800/60 text-xs font-bold text-gold-300">
            {s.number}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{s.name}</span>
            <span className="block text-xs text-stone-500">
              {t(s.revelation === 'Meccan' ? 'quran.meccan' : 'quran.medinan')} · {s.ayahs} {t('quran.verses')}
            </span>
            {getPosition(s.number) != null && (
              <span
                className="mt-1 inline-flex cursor-pointer items-center gap-1 rounded-full border border-gold-500/40 bg-gold-500/10 px-2 py-0.5 text-[10px] font-semibold text-gold-300 transition hover:border-red-500/50 hover:text-red-300"
                title={t('quran.removePin')}
                onClick={(e) => {
                  e.stopPropagation();
                  onClear(s.number);
                }}
              >
                📍 {t('quran.savedVerse', { n: getPosition(s.number)! })} ✕
              </span>
            )}
          </span>
          <span className="font-quran text-lg text-gold-400" dir="rtl">
            {s.arabic}
          </span>
        </button>
      ))}
    </div>
  );
}

const MATCH_TYPE_STYLES: Record<string, string> = {
  number: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
  arabic: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  phonetic: 'bg-violet-500/15 text-violet-300 border-violet-500/40',
  french: 'bg-gold-500/15 text-gold-300 border-gold-500/40',
  english: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
  keyword: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
  verse: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
};

function MatchTypeBadge({ type }: { type?: string }) {
  const { t } = useI18n();
  if (!type) return null;
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${MATCH_TYPE_STYLES[type] ?? 'bg-stone-500/15 text-stone-300 border-stone-500/40'}`}>
      {t(`quran.match.${type}`)}
    </span>
  );
}

function SearchResults({
  results,
  onOpen,
}: {
  results: SearchResult[];
  onOpen: (surah: number, verse: number) => void;
}) {
  const { t } = useI18n();
  const surahMatches = results.filter((r) => r.isSurahMatch);
  const verseMatches = results.filter((r) => !r.isSurahMatch);
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gold-400">{t('quran.searchResults')} ({results.length})</h3>
      {surahMatches.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-semibold text-gold-500 uppercase tracking-wide">📖 Sourates</div>
          {surahMatches.map((r) => (
            <button
              key={`surah-${r.chapter}`}
              onClick={() => onOpen(r.chapter, r.verse)}
              className="card card-clickable w-full p-3 text-left transition border border-gold-600/30"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-600/20 text-sm font-bold text-gold-400">
                  {r.chapter}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-stone-100">{r.surahName}</div>
                    <MatchTypeBadge type={r.matchType} />
                  </div>
                  <div className="text-xs text-stone-400 truncate">{r.translated}</div>
                </div>
                <div className="font-quran text-lg text-stone-300 shrink-0" dir="rtl">{r.arabic}</div>
              </div>
            </button>
          ))}
        </div>
      )}
      {verseMatches.length > 0 && (
        <div className="space-y-1">
          {surahMatches.length > 0 && <div className="text-xs font-semibold text-emerald-500 uppercase tracking-wide">🔍 Versets</div>}
          {verseMatches.map((r) => (
            <button
              key={`verse-${r.chapter}-${r.verse}`}
              onClick={() => onOpen(r.chapter, r.verse)}
              className="card card-clickable w-full p-3 text-left transition"
            >
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-emerald-400">
                {r.surahName} · {r.chapter}:{r.verse}
                <MatchTypeBadge type={r.matchType} />
              </div>
              {r.arabic && (
                <div className="font-quran text-right text-xl text-stone-100" dir="rtl">
                  {r.arabic}
                </div>
              )}
              {r.translated && <div className="mt-1 text-sm text-stone-300">{r.translated}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}function SurahReader({
  chapter,
  translation,
  reciter,
  highlightVerse,
  hasSearch,
  onBack,
  onBackToSearch,
}: {
  chapter: number;
  translation: TranslationKey;
  reciter: string;
  highlightVerse: number | null;
  hasSearch: boolean;
  onBack: () => void;
  onBackToSearch: () => void;
}) {
  const { t } = useI18n();
  const [ar, setAr] = useState<Verse[] | null>(null);
  const [tr, setTr] = useState<Verse[] | null>(null);
  const [error, setError] = useState(false);
  const { state: audioState, play: audioPlay, stop: audioStop, toggle: audioToggle } = useAudioPlayer();
  const [playingSurah, setPlayingSurah] = useState(false);

  const [jumpFlash, setJumpFlash] = useState<number | null>(null);
  const { show: showToast } = useToast();
  const { setPosition, getPosition, clearPosition } = useReadingPosition();
  const togglePin = (verse: number) => {
    if (getPosition(chapter) === verse) {
      clearPosition(chapter);
      showToast('📍', t('quran.pinRemoved'), undefined, 'bg-stone-700');
    } else {
      setPosition(chapter, verse);
      showToast('📍', t('quran.pinSet', { s: chapter, v: verse }), undefined, 'bg-emerald-600');
    }
  };
  // Défilement robuste vers un verset (scrollIntoView est inopérant dans certains webviews)
  const scrollToVerse = (verse: number) => {
    const el = document.getElementById('verse-' + chapter + '-' + verse);
    const container = el?.closest('.overflow-y-auto') as HTMLElement | null;
    if (!el || !container) return;
    const top = el.offsetTop - container.offsetTop - container.clientHeight / 2 + el.clientHeight / 2;
    container.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
  };
  const savedPos = getPosition(chapter);
  // Miroir à jour de la position sauvegardée (utilisé par le handler de scroll
  // sans ajouter de dépendance instable au useEffect ci-dessous)

  const meta = SURAHS[chapter - 1];

  // Bouton « remonter en haut » : apparaît après défilement, remonte en douceur
  const [showTopBtn, setShowTopBtn] = useState(false);
  useEffect(() => {
    const container = document.querySelector('main .overflow-y-auto') as HTMLElement | null;
    if (!container) return;
    const onScroll = () => setShowTopBtn(container.scrollTop > 600);
    container.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => container.removeEventListener('scroll', onScroll);
  }, [chapter]);

  const scrollToTop = () => {
    const container = document.querySelector('main .overflow-y-auto') as HTMLElement | null;
    container?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    let alive = true;
    setAr(null);
    setTr(null);
    setError(false);
    Promise.all([fetchSurah('ara-quranacademy', chapter), fetchSurah(EDITIONS[translation], chapter)])
      .then(([a, trr]) => {
        if (!alive) return;
        setAr(a);
        setTr(trr);
      })
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [chapter, translation]);

  const play = (verse: number, surahMode = false) => {
    if (surahMode) setPlayingSurah(true);
    audioPlay(reciter, chapter, verse, ar?.length ?? 0, meta.name, surahMode);
  };

  const stop = () => {
    audioStop();
    setPlayingSurah(false);
  };

  // Auto-scroll : suivre le verset en cours de lecture + sauver la position
  useEffect(() => {
    if (!audioState || audioState.chapter !== chapter) return;
    setPosition(chapter, audioState.verse);
    const el = document.getElementById(`verse-${chapter}-${audioState.verse}`);
    const container = el?.closest('.overflow-y-auto') as HTMLElement | null;
    if (el && container) {
      const top = el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2;
      container.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
  }, [audioState?.verse, audioState?.chapter, chapter, setPosition]);

  // Défilement vers un verset cible (raccourci « Coran », résultat de recherche) :
  // attend le chargement du contenu, centre le verset et le surligne brièvement
  useEffect(() => {
    if (!ar || highlightVerse == null) return;
    scrollToVerse(highlightVerse);
    setJumpFlash(highlightVerse);
    const id = setTimeout(() => setJumpFlash(null), 3000);
    return () => clearTimeout(id);
  }, [ar, chapter, highlightVerse]);

  const verseRows = useMemo(() => {
    if (!ar || !tr) return [];
    return ar.map((a) => {
      const match = tr.find((x) => x.verse === a.verse);
      return { chapter, verse: a.verse, arabic: a.text, translated: match?.text ?? '' };
    });
  }, [ar, tr, chapter]);




if (error) return <p className="text-sm text-red-400">{t('quran.error')}</p>;
  if (!ar) return <p className="text-sm text-stone-400">{t('quran.loading')}</p>;

  return (
    <div className="animate-fade-in">
      <div className="card mb-4 overflow-hidden p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onBack} className="btn-ghost text-xs">← {t('quran.back')}</button>
            {hasSearch && (
              <button onClick={onBackToSearch} className="btn-ghost text-xs border-gold-500/40 text-gold-300">
                🔍 {t('quran.backToSearch')}
              </button>
            )}
          </div>
          <button
            onClick={() => (playingSurah ? stop() : play(1, true))}
            className="btn-gold shrink-0 text-xs"
          >
            {playingSurah ? `⏹ ${t('quran.audioStop')}` : `▶ ${t('quran.playSurah')}`}
          </button>
        </div>

        <div className="mt-4 text-center">
          <div className="font-quran text-4xl text-gold-300" dir="rtl">
            {meta.arabic}
          </div>
          <h3 className="mt-2 text-2xl font-bold text-gold-400">{meta.name}</h3>
          <p className="text-xs text-stone-500">{meta.ayahs} {t('quran.verses')}</p>
        </div>
      </div>

      <div className="space-y-3">

        {verseRows.map((v) => {
          const isActive = audioState && audioState.chapter === v.chapter && audioState.verse === v.verse;
          const isHighlight = highlightVerse === v.verse;
          const isJump = jumpFlash === v.verse;
          const isSaved = savedPos === v.verse;
          return (
            <div
              key={v.verse}
              id={`verse-${v.chapter}-${v.verse}`}
              // onClick removed: pin is now done via pin button only
              className={`card card-clickable cursor-pointer p-4 transition ${isHighlight ? 'ring-2 ring-gold-500/70' : ''} ${isActive ? 'verse-active border-2' : ''} ${isJump ? 'ring-2 ring-gold-500/70' : ''} ${isSaved && !isActive ? 'border-gold-500/40' : ''}`}
            >
              <div className="mb-2 flex items-center justify-between text-xs text-stone-500">
                <span className={`verse-ref font-semibold ${isActive ? '' : 'text-emerald-400'}`}>
                  {v.chapter}:{v.verse}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isActive) stop();
                    else play(v.verse);
                  }}
                  className={`chip ${isActive ? '!border-gold-500/80 !bg-gold-500/20 !text-gold-200' : ''}`}
                >
                  {isActive ? `⏹ ${t('quran.audioStop')}` : `▶ ${t('quran.audio')}`}
                </button>
                <div className="flex items-center gap-2">
                  {isActive && audioState?.playing && (
                    <span className="chip !border-emerald-500/70 !bg-emerald-500/15 !text-emerald-300 animate-pulse">
                      ▶ {t('quran.reciting')}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePin(v.verse);
                    }}
                    className={isSaved ? "chip !border-gold-500/70 !text-gold-300 hover:!border-red-500/50 hover:!text-red-300" : "chip hover:!border-gold-500/50 hover:!text-gold-300"}
                    title={isSaved ? t('quran.removePin') : t('quran.pinSet', { s: v.chapter, v: v.verse })}
                  >
                    {isSaved ? '📍 ✕' : '📌'}
                  </button>

                  <VerseShareButton
                    chapter={v.chapter}
                    verse={v.verse}
                    arabic={v.arabic}
                    translated={v.translated}
                    surahName={meta.name}
                    surahArabic={meta.arabic}
                  />
                </div>
              </div>
              <div className={`verse-arabic font-quran text-right text-2xl leading-loose ${isActive ? 'text-gold-50' : 'text-stone-100'}`} dir="rtl">
                {v.arabic}
              </div>
              {v.translated && (
                <div className="mt-2 border-t border-emerald-900/30 pt-2 text-sm leading-relaxed text-stone-300">
                  {v.translated}
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Bouton remonter en haut */}
      {showTopBtn && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-gold-500/50 bg-night-900/90 text-lg text-gold-300 shadow-glow transition hover:bg-gold-600/20 animate-fade-in"
          title={t('quran.scrollTop')}
          aria-label={t('quran.scrollTop')}
        >
          ↑
        </button>
      )}
    </div>
  );
}
