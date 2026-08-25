import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useI18n } from '../i18n';
import { notify } from '../lib/desktop';
import {
  DHIKR_LIST,
  DHIKR_CATEGORIES,
  saveDhikrSession,
  getDhikrStats,
  type DhikrItem,
} from '../lib/dhikrList';

export function DhikrCounterView() {
  const { t, lang } = useI18n();
  const [searchParams] = useSearchParams();
  const initialDhikr = (() => {
        const id = searchParams.get('id');
        return id ? (DHIKR_LIST.find(d => d.id === id) ?? DHIKR_LIST[0]) : DHIKR_LIST[0];
      })();
  const [selected, setSelected] = useState<DhikrItem>(initialDhikr);
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(DHIKR_LIST[0].count);
  const [editingTarget, setEditingTarget] = useState(false);
  const [showList, setShowList] = useState(false);
  const [stats, setStats] = useState(() => getDhikrStats());
  const [pulse, setPulse] = useState(false);
  const tapRef = useRef<HTMLDivElement>(null);

  // Reset count when dhikr changes
  useEffect(() => {
    setCount(0);
    setTarget(selected.count);
  }, [selected]);

  const progress = Math.min(100, (count / target) * 100);
  const isComplete = count >= target;

  // Detect double-tap speed for haptic
  const lastTapRef = useRef(0);

  const handleTap = () => {
    if (isComplete) return;
    const now = Date.now();
    const fast = now - lastTapRef.current < 400;
    lastTapRef.current = now;

    const newCount = count + 1;
    setCount(newCount);
    setPulse(true);
    setTimeout(() => setPulse(false), 100);

    // Vibration feedback (desktop + mobile)
    if (fast && 'vibrate' in navigator) {
      navigator.vibrate(10);
    } else if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }

    // Target reached
    if (newCount >= target) {
      saveDhikrSession({
        id: `${selected.id}-${Date.now()}`,
        dhikrId: selected.id,
        count: newCount,
        target,
        date: new Date().toISOString(),
        completed: true,
      });
      setStats(getDhikrStats());
      if ('vibrate' in navigator) navigator.vibrate([50, 30, 50]);
      notify({ title: '✅ Dhikr terminé', body: `${selected.transliteration} ×${newCount}` });
    }
  };

  // Keyboard support (spacebar)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        if (isComplete) {
          setCount(0);
          setTarget(selected.count);
        } else {
          handleTap();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const grouped = useMemo(() => {
    const groups: Record<string, DhikrItem[]> = {};
    for (const d of DHIKR_LIST) {
      const cat = DHIKR_CATEGORIES[d.category];
      const key = `${cat.icon} ${lang === 'ar' ? cat.ar : lang === 'en' ? cat.en : cat.fr}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    }
    return groups;
  }, [lang]);

  // Circle parameters
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="mx-auto max-w-lg px-4 pb-8 pt-6 animate-fade-in">
      {/* Header */}
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-bold text-gold-400">{t('dhikr.title')}</h2>
        <p className="mt-1 text-xs text-stone-400">{t('dhikr.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="mb-4 flex justify-center gap-4 text-center">
        <div className="card px-4 py-2">
          <p className="text-lg font-bold text-gold-300">{stats.today}</p>
          <p className="text-[10px] text-stone-400">{t('dhikr.todayCount')}</p>
        </div>
        <div className="card px-4 py-2">
          <p className="text-lg font-bold text-emerald-300">{stats.total}</p>
          <p className="text-[10px] text-stone-400">{t('dhikr.totalCount')}</p>
        </div>
      </div>

      {/* Dhikr selector */}
      <button
        onClick={() => setShowList(!showList)}
        className="card w-full p-3 mb-4 text-left transition hover:border-gold-500/40 flex items-center gap-3"
      >
        <div className="flex-1 min-w-0">
          <p className="font-quran text-xl text-gold-300 truncate" dir="rtl">{selected.arabic}</p>
          <p className="text-sm font-semibold text-stone-200">{selected.transliteration}</p>
          <p className="text-[11px] text-stone-400">{selected.translation}</p>
        </div>
        <span className="text-xs text-stone-500 shrink-0">▼</span>
      </button>

      {/* List when open */}
      {showList && (
        <div className="card mb-4 max-h-60 overflow-y-auto p-2 space-y-1">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <p className="text-[10px] font-semibold text-stone-500 px-2 py-1">{cat}</p>
              {items.map((d) => (
                <button
                  key={d.id}
                  onClick={() => { setSelected(d); setShowList(false); }}
                  className={`w-full rounded-lg p-2 text-left transition ${d.id === selected.id ? 'bg-gold-500/15 border border-gold-500/30' : 'hover:bg-stone-800/50'}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-200">{d.transliteration}</p>
                      <p className="font-quran text-base text-gold-300" dir="rtl">{d.arabic}</p>
                    </div>
                    <span className="chip !text-[10px] shrink-0">{d.count}×</span>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Merit */}
      <div className="card mb-4 p-3 border-emerald-500/20">
        <p className="text-[11px] text-stone-300">⭐ {selected.merit}</p>
        <p className="text-[10px] text-stone-500 mt-0.5">📖 {selected.source}</p>
      </div>

      {/* Counter circle */}
      <div className="mb-4 flex flex-col items-center">
        <div
          ref={tapRef}
          onClick={handleTap}
          className="relative cursor-pointer select-none"
          style={{ width: 280, height: 280, touchAction: 'manipulation' }}
        >
          <svg className="absolute inset-0 -rotate-90" width="280" height="280">
            {/* Background circle */}
            <circle
              cx="140" cy="140" r={radius}
              fill="none"
              stroke="rgba(120, 113, 108, 0.2)"
              strokeWidth="12"
            />
            {/* Progress circle */}
            <circle
              cx="140" cy="140" r={radius}
              fill="none"
              stroke={isComplete ? '#10b981' : '#cfa14a'}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.15s ease' }}
            />
          </svg>
          {/* Center content */}
          <div className={`absolute inset-0 flex flex-col items-center justify-center ${pulse ? 'scale-95' : 'scale-100'}`}
            style={{ transition: 'transform 0.1s ease' }}>
            {isComplete ? (
              <>
                <span className="text-4xl mb-1">✅</span>
                <p className="text-sm font-bold text-emerald-400">{t('dhikr.complete')}</p>
                <p className="text-[11px] text-stone-400">{selected.transliteration} ×{count}</p>
              </>
            ) : (
              <>
                <span className="text-5xl font-bold text-gold-300">{count}</span>
                <span className="text-sm text-stone-500">/ {target}</span>
                <span className="mt-1 text-[10px] text-stone-600">{t('dhikr.tapHint')}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-2 items-center">
        {!isComplete && (
          <>
            <button
              onClick={() => setCount(0)}
              className="chip text-xs"
            >
              ↺ {t('dhikr.reset')}
            </button>
            <div className="flex items-center gap-1 chip text-xs">
              <span className="text-stone-400">Objectif :</span>
              {editingTarget ? (
                <input
                  type="number"
                  value={target}
                  min={1}
                  max={10000}
                  autoFocus
                  className="w-16 bg-transparent border-b border-gold-500 text-gold-300 text-xs text-center outline-none"
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (v > 0) setTarget(v);
                  }}
                  onBlur={() => setEditingTarget(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setEditingTarget(false);
                  }}
                />
              ) : (
                <button
                  onClick={() => setEditingTarget(true)}
                  className="font-bold text-gold-300 underline underline-offset-2 decoration-gold-500/40"
                >
                  {target}
                </button>
              )}
            </div>
            <button
              onClick={() => setTarget((tg) => tg + selected.count)}
              className="chip text-xs"
            >
              +{selected.count}
            </button>
          </>
        )}
        {isComplete && (
          <button
            onClick={() => { setCount(0); setTarget(selected.count); }}
            className="btn-gold text-xs"
          >
            🔄 {t('dhikr.again')}  <span className="text-[9px] opacity-60 ml-1">ou ␣</span>
          </button>
        )}
      </div>

      {/* Keyboard hint */}
      <p className="mt-3 text-center text-[10px] text-stone-600">
        ␣ Espace = compter · {isComplete ? 'Espace = recommencer' : 'Maintiens pour rapide'}
      </p>
    </div>
  );
}
