import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { NAMES_99, type Name99 } from '../lib/names99';

function daySeed(): number {
  const now = new Date();
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000);
}

export function NamesView() {
  const { t } = useI18n();
  const [view, setView] = useState<'grid' | 'card'>('grid');
  const [cardIdx, setCardIdx] = useState(() => daySeed() % NAMES_99.length);
  const [flipped, setFlipped] = useState(false);
  const [readNames, setReadNames] = useState<Set<number>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('nour:names-read') || '[]')); } catch { return new Set(); }
  });
  const [shuffle, setShuffle] = useState(0);

  useEffect(() => {
    setCardIdx((daySeed() + shuffle) % NAMES_99.length);
    setFlipped(false);
  }, [shuffle]);

  const daily: Name99 = NAMES_99[cardIdx];

  const markRead = (idx: number) => {
    const next = new Set(readNames);
    next.add(idx);
    setReadNames(next);
    localStorage.setItem('nour:names-read', JSON.stringify([...next]));
  };

  const progress = Math.round((readNames.size / NAMES_99.length) * 100);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-8 pt-6 animate-fade-in">
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-bold text-gold-400">{t('names99.title')}</h2>
        <p className="mt-1 text-xs text-stone-400">{t('names99.subtitle')}</p>
        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-stone-400">
          <span>{readNames.size}/{NAMES_99.length} {t('names99.memorized')}</span>
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-stone-700">
            <div className="h-full rounded-full bg-gold-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 flex justify-center gap-1">
          <button onClick={() => setView('grid')} className={`chip text-xs ${view === 'grid' ? '!border-gold-500/70 !text-gold-300' : ''}`}>📋 {t('names99.allNames')}</button>
          <button onClick={() => setView('card')} className={`chip text-xs ${view === 'card' ? '!border-gold-500/70 !text-gold-300' : ''}`}>🃏 {t('names99.flashcard')}</button>
        </div>
      </div>

      {view === 'card' ? (
        <div className="space-y-4">
          <button onClick={() => setFlipped(!flipped)}
            className="card w-full min-h-[200px] p-6 text-center transition-all cursor-pointer border-gold-500/30 hover:border-gold-500/60"
            style={{ perspective: '600px' }}>
            {!flipped ? (
              <>
                <p className="font-quran text-5xl text-gold-300" dir="rtl">{daily.arabic}</p>
                <p className="mt-2 text-sm text-stone-300">{daily.transliteration}</p>
              </>
            ) : (
              <>
                <p className="text-xl font-bold text-gold-400">{daily.translation}</p>
                <p className="mt-2 text-sm text-stone-300">{daily.description}</p>
              </>
            )}
          </button>
          <div className="flex justify-center gap-2">
            <button onClick={() => markRead(cardIdx)} className="chip !border-emerald-500/50 !text-emerald-300 text-xs">✅ {t('names99.known')}</button>
            <button onClick={() => setShuffle((s) => s + 1)} className="chip hover:!border-gold-500/50 text-xs">🎲 {t('names99.next')}</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {NAMES_99.map((n, i) => {
            const isRead = readNames.has(i);
            return (
              <button key={i} onClick={() => { setCardIdx(i); setView('card'); }}
                className={`card p-3 text-center transition-all ${isRead ? 'border-emerald-500/40 bg-emerald-500/5' : 'hover:border-gold-500/50'}`}>
                <p className="font-quran text-2xl text-gold-300" dir="rtl">{n.arabic}</p>
                <p className="mt-1 text-[11px] text-stone-300">{n.transliteration}</p>
                <p className="text-[10px] text-stone-500">{n.translation}</p>
                {isRead && <span className="text-[10px] text-emerald-400">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
