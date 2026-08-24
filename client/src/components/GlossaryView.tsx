import { useState, useMemo, useEffect } from 'react';
import { useI18n } from '../i18n';
import {
  GLOSSARY,
  CATEGORY_LABELS,
  searchGlossary,
  ALL_CATEGORIES,
  type GlossaryCategory,
  type GlossaryTerm,
} from '../lib/islamicGlossary';

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
        <h2 className="text-2xl font-bold text-gold-400">{t('glossary.title')}</h2>
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
      <div className="mb-4 flex flex-wrap gap-1.5 justify-center">
        <button
          onClick={() => setCategory('all')}
          className={`chip text-xs ${category === 'all' ? '!border-gold-500/70 !text-gold-300' : ''}`}
        >
          📚 {t('glossary.all')}
        </button>
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`chip text-xs ${category === cat ? '!border-gold-500/70 !text-gold-300' : ''}`}
          >
            {CATEGORY_LABELS[cat].icon} {lang === 'ar' ? CATEGORY_LABELS[cat].ar : lang === 'en' ? CATEGORY_LABELS[cat].en : CATEGORY_LABELS[cat].fr}
          </button>
        ))}
      </div>

      {/* Favoris */}
      {favTerms.length > 0 && !query && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold text-gold-400">⭐ {t('glossary.favorites')}</p>
          <div className="flex flex-wrap gap-1.5">
            {favTerms.map((f) => (
              <button
                key={f.term}
                onClick={() => setSelected(f)}
                className="chip !border-gold-500/40 !text-gold-200 text-xs"
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
                      <span className="font-semibold text-stone-100 text-sm">{term.term}</span>
                      <span className="font-quran text-lg text-gold-300" dir="rtl">{term.termAr}</span>
                    </div>
                    <p className="text-[11px] text-stone-400">{term.termFr}</p>
                  </div>
                  <span className="text-xs text-stone-500 shrink-0">{CATEGORY_LABELS[term.category].icon}</span>
                  {favorites.has(term.term) && <span className="text-xs text-gold-400">⭐</span>}
                </div>
              </button>
            ))
          )}
        </div>
      ) : (
        /* Index alphabétique */
        <div className="space-y-4">
          {favTerms.length === 0 && (
            <p className="text-center text-[11px] text-stone-500">{t('glossary.tapFav')}</p>
          )}
          {letters.map((letter) => (
            <div key={letter}>
              <p className="mb-1.5 text-sm font-bold text-gold-400">{letter}</p>
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
                          <span className="text-sm font-medium text-stone-200">{term.term}</span>
                          <span className="font-quran text-base text-gold-300" dir="rtl">{term.termAr}</span>
                        </div>
                        <p className="text-[10px] text-stone-500 truncate">{term.termFr}</p>
                      </div>
                      <span className="text-[10px] shrink-0">{CATEGORY_LABELS[term.category].icon}</span>
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
                  <h3 className="text-xl font-bold text-gold-300">{selected.term}</h3>
                  <span className="font-quran text-2xl text-gold-400" dir="rtl">{selected.termAr}</span>
                </div>
                <p className="text-sm text-stone-400">{selected.termFr}</p>
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
              className={`mt-4 w-full rounded-lg py-2 text-xs font-semibold transition ${favorites.has(selected.term) ? 'bg-gold-500/20 text-gold-300 border border-gold-500/50' : 'bg-stone-800 text-stone-400 border border-stone-700'}`}
            >
              {favorites.has(selected.term) ? `⭐ ${t('glossary.inFav')}` : `☆ ${t('glossary.addFav')}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
