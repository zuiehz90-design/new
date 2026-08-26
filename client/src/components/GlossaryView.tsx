import { useState, useMemo, useEffect, type SVGProps, type ReactNode } from 'react';
import { useI18n } from '../i18n';
import {
  GLOSSARY,
  CATEGORY_LABELS,
  searchGlossary,
  ALL_CATEGORIES,
  type GlossaryCategory,
  type GlossaryTerm,
} from '../lib/islamicGlossary';

/** Icônes vectorielles fines par catégorie (lucide-style, stroke currentColor). */
const CATEGORY_PATHS: Record<GlossaryCategory, ReactNode> = {
  prayer: (<><path d="M4 21h16M6 21V10a6 6 0 0 1 12 0v11" /><path d="M12 2l3 5H9l3-5z" /></>),
  quran: (<><path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z" /><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z" /></>),
  fiqh: (<><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="M7 21h10" /><path d="M12 3v18" /><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" /></>),
  spirituality: (<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />),
  pillars: (<><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" /></>),
  people: (<><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>),
  places: (<><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>),
  times: (<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>),
  concepts: (<><path d="M9 18h6" /><path d="M10 22h4" /><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5" /></>),
};

function CatIcon({ cat, ...props }: { cat: GlossaryCategory } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      {CATEGORY_PATHS[cat]}
    </svg>
  );
}

function StarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function GlossaryView() {
  const { t, lang } = useI18n();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<GlossaryCategory | 'all'>('all');
  const [selected, setSelected] = useState<GlossaryTerm | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('nour:glossary-fav') || '[]')); } catch { return new Set(); }
  });

  useEffect(() => {
    localStorage.setItem('nour:glossary-fav', JSON.stringify([...favorites]));
  }, [favorites]);

  const toggleFav = (term: string) => {
    const next = new Set(favorites);
    if (next.has(term)) next.delete(term);
    else next.add(term);
    setFavorites(next);
  };

  const results = useMemo(() => searchGlossary(query, category), [query, category]);

  const favTerms = useMemo(
    () => GLOSSARY.filter((g) => favorites.has(g.term)),
    [favorites],
  );

  // Liste alphabétique quand pas de recherche
  const alphaIndex = useMemo(() => {
    if (query) return null;
    const terms = category === 'all' ? GLOSSARY : GLOSSARY.filter((t) => t.category === category);
    const sorted = [...terms].sort((a, b) => a.term.localeCompare(b.term));
    const groups: Record<string, GlossaryTerm[]> = {};
    for (const t of sorted) {
      const letter = t.term[0].toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(t);
    }
    return groups;
  }, [query, category]);

  const letters = alphaIndex ? Object.keys(alphaIndex).sort() : [];

  return (
    <div className="mx-auto max-w-3xl px-4 pb-8 pt-6 animate-fade-in">
      <div className="mb-4 text-center">
        <h2 className="font-display text-2xl font-bold text-[#D4AF37]">{t('glossary.title')}</h2>
        <p className="mt-1 text-xs text-stone-400">{t('glossary.subtitle')}</p>
      </div>

      {/* Barre de recherche */}
      <div className="relative mb-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('glossary.searchPlaceholder')}
          className="input w-full pl-10"
        />
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">🔍</span>
      </div>

      {/* Filtres par catégorie */}
      <div className="mb-4 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => setCategory('all')}
          className="flex items-center gap-2 rounded-full px-4 py-2 text-xs transition hover:shadow-[0_0_16px_rgba(212,175,55,0.3)]"
          style={category === 'all'
            ? { background: '#D4AF37', color: '#1a1a1a', border: '1px solid #D4AF37', fontWeight: 700 }
            : { background: '#112925', color: '#F4D03F', border: '1px solid #D4AF37' }}
        >
          <CatIcon cat="concepts" className="h-3.5 w-3.5" style={{ color: category === 'all' ? '#1a1a1a' : '#A3B1AC' }} />
          {t('glossary.all')}
        </button>
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-xs transition hover:shadow-[0_0_16px_rgba(212,175,55,0.3)]"
            style={category === cat
              ? { background: '#D4AF37', color: '#1a1a1a', border: '1px solid #D4AF37', fontWeight: 700 }
              : { background: '#112925', color: '#F4D03F', border: '1px solid #D4AF37' }}
          >
            <CatIcon cat={cat} className="h-3.5 w-3.5" style={{ color: category === cat ? '#D4AF37' : '#A3B1AC' }} />
            {lang === 'ar' ? CATEGORY_LABELS[cat].ar : lang === 'en' ? CATEGORY_LABELS[cat].en : CATEGORY_LABELS[cat].fr}
          </button>
        ))}
      </div>

      {/* Favoris */}
      {favTerms.length > 0 && !query && (
        <div className="mb-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37]"><StarIcon className="h-3.5 w-3.5" /> {t('glossary.favorites')}</p>
          <div className="flex flex-wrap gap-1.5">
            {favTerms.map((f) => (
              <button
                key={f.term}
                onClick={() => setSelected(f)}
                className="chip !border-[#D4AF37]/40 !text-[#F4D03F] text-xs"
              >
                {f.term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Résultats de recherche */}
      {query ? (
        <div className="space-y-2">
          {results.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-500">{t('glossary.noResults')}</p>
          ) : (
            results.map((term) => (
              <button
                key={term.term}
                onClick={() => setSelected(term)}
                className="card card-clickable w-full p-3 text-left transition hover:border-gold-500/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm font-bold text-white">{term.term}</span>
                      <span className="font-quran text-lg text-[#D4AF37]" style={{ textShadow: '0 0 6px rgba(212,175,55,0.3)' }} dir="rtl">{term.termAr}</span>
                    </div>
                    <p className="text-[11px] text-[#A3B1AC]">{term.termFr}</p>
                  </div>
                  <CatIcon cat={term.category} className="h-4 w-4 shrink-0" style={{ color: '#A3B1AC' }} />
                  {favorites.has(term.term) && <StarIcon className="h-4 w-4 shrink-0 text-[#D4AF37]" />}
                </div>
              </button>
            ))
          )}
        </div>
      ) : (
        /* Index alphabétique */
        <div className="space-y-4">
          {favTerms.length === 0 && (
            <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-[#A3B1AC]"><StarIcon className="h-3.5 w-3.5 text-[#D4AF37]" /> {t('glossary.tapFav')}</p>
          )}
          {letters.map((letter) => (
            <div key={letter}>
              <p className="font-display mb-2 mt-5 text-2xl font-bold text-[#D4AF37]">{letter}</p>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {alphaIndex![letter].map((term) => (
                  <button
                    key={term.term}
                    onClick={() => setSelected(term)}
                    className="card card-clickable p-2.5 text-left transition hover:border-gold-500/40"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-display text-sm font-bold text-white">{term.term}</span>
                          <span className="font-quran text-base text-[#D4AF37]" style={{ textShadow: '0 0 6px rgba(212,175,55,0.3)' }} dir="rtl">{term.termAr}</span>
                        </div>
                        <p className="truncate text-[10px] text-[#A3B1AC]">{term.termFr}</p>
                      </div>
                      <CatIcon cat={term.category} className="h-3.5 w-3.5 shrink-0" style={{ color: '#A3B1AC' }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal détail */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
          onClick={() => setSelected(null)}
        >
          <div
            className="card max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border-gold-500/40 p-5 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-xl font-bold text-white">{selected.term}</h3>
                  <span className="font-quran text-2xl text-[#D4AF37]" style={{ textShadow: '0 0 6px rgba(212,175,55,0.3)' }} dir="rtl">{selected.termAr}</span>
                </div>
                <p className="text-sm text-[#A3B1AC]">{selected.termFr}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-stone-500 hover:text-stone-300">✕</button>
            </div>
            <div className="mb-3">
              <span className="chip text-[11px]">
                {CATEGORY_LABELS[selected.category].icon} {lang === 'ar' ? CATEGORY_LABELS[selected.category].ar : lang === 'en' ? CATEGORY_LABELS[selected.category].en : CATEGORY_LABELS[selected.category].fr}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-stone-200">{selected.definition}</p>
            <button
              onClick={() => toggleFav(selected.term)}
              className={`mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${favorites.has(selected.term) ? 'text-black' : 'text-[#F4D03F]'}`}
              style={favorites.has(selected.term)
                ? { background: '#D4AF37', border: '1px solid #D4AF37' }
                : { background: '#112925', border: '1px solid #D4AF37' }}
            >
              {favorites.has(selected.term) ? `⭐ ${t('glossary.inFav')}` : `☆ ${t('glossary.addFav')}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
