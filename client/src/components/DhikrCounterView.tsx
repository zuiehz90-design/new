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
    <div className="mx-auto max-w-lg px-4 pb-8 pt-20 animate-fade-in">
      {/* Header */}
      <div className="mb-4 text-center">
        <h2 className="font-display text-2xl font-bold text-[#D4AF37]">{t('dhikr.title')}</h2>
        <p className="mt-1 text-xs text-[#A3B1AC]">{t('dhikr.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="mb-6 flex justify-center gap-5 text-center">
        <div className="rounded-xl px-6 py-3" style={{ background: '#112925', border: '1px solid #2A4A43' }}>
          <p className="text-xl font-bold text-[#D4AF37]">{stats.today}</p>
          <p className="text-[11px] text-[#A3B1AC]">{t('dhikr.todayCount')}</p>
        </div>
        <div className="rounded-xl px-6 py-3" style={{ background: '#112925', border: '1px solid #2A4A43' }}>
          <p className="text-xl font-bold text-[#D4AF37]">{stats.total}</p>
          <p className="text-[11px] text-[#A3B1AC]">{t('dhikr.totalCount')}</p>
        </div>
      </div>

      {/* Dhikr selector */}
      <button
        onClick={() => setShowList(!showList)}
        className="mb-4 flex w-full items-center gap-3 rounded-xl p-4 text-left transition hover:shadow-[0_0_16px_rgba(212,175,55,0.25)]"
        style={{ background: '#112925', border: '1px solid #D4AF37' }}
      >
        <div className="flex-1 min-w-0">
          <p className="font-quran text-2xl text-[#D4AF37] truncate" dir="rtl">{selected.arabic}</p>
          <p className="text-sm font-bold text-white">{selected.transliteration}</p>
          <p className="text-[11px] text-[#A3B1AC]">{selected.translation}</p>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0" style={{ color: '#D4AF37' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* List when open */}
      {showList && (
        <div className="card mb-4 max-h-60 overflow-y-auto p-2 space-y-1">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <p className="px-2 py-1 text-[10px] font-semibold text-[#A3B1AC]">{cat}</p>
              {items.map((d) => (
                <button
                  key={d.id}
                  onClick={() => { setSelected(d); setShowList(false); }}
                  className={`w-full rounded-lg p-2 text-left transition ${d.id === selected.id ? 'border border-[#D4AF37]/40 bg-[#D4AF37]/10' : 'hover:bg-stone-800/50'}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{d.transliteration}</p>
                      <p className="font-quran text-base text-[#D4AF37]" dir="rtl">{d.arabic}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-[#2A4A43] bg-[#112925] px-2 py-0.5 text-[10px] text-[#F4D03F]">{d.count}×</span>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Merit */}
      <div className="card mb-4 p-3" style={{ borderColor: 'rgba(212,175,55,0.35)' }}>
        <p className="text-[11px] text-white">⭐ {selected.merit}</p>
        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[#A3B1AC]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" style={{ color: '#D4AF37' }}>
            <path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z" /><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z" />
          </svg>
          {selected.source}
        </p>
      </div>

      {/* Counter circle */}
      <div className="mb-4 flex flex-col items-center">
        <div
          ref={tapRef}
          onClick={handleTap}
          className={`relative cursor-pointer select-none ${pulse ? 'scale-[1.02]' : 'scale-100'}`}
          style={{ width: 280, height: 280, touchAction: 'manipulation', transition: 'transform 0.12s ease' }}
        >
          <svg className="absolute inset-0 -rotate-90" width="280" height="280">
            {/* Background circle */}
            <circle
              cx="140" cy="140" r={radius}
              fill="none"
              stroke="#2A4A43"
              strokeWidth="12"
            />
            {/* Progress circle */}
            <defs>
              <linearGradient id="dhikrGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#F4D03F" />
              </linearGradient>
            </defs>
            <circle
              cx="140" cy="140" r={radius}
              fill="none"
              stroke={isComplete ? 'url(#dhikrGrad)' : 'url(#dhikrGrad)'}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.15s ease' }}
            />
          </svg>
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isComplete ? (
              <>
                <span className="mb-1 text-4xl">✅</span>
                <p className="font-display text-sm font-bold text-[#D4AF37]">{t('dhikr.complete')}</p>
                <p className="text-[11px] text-[#A3B1AC]">{selected.transliteration} ×{count}</p>
              </>
            ) : (
              <>
                <span className="font-display text-7xl font-bold text-[#F4D03F]">{count}</span>
                <span className="mt-1 font-display text-sm font-semibold text-[#D4AF37]">/ {target}</span>
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
              className="flex items-center gap-1 rounded-full border border-[#2A4A43] bg-[#112925] px-3 py-1.5 text-xs text-[#A3B1AC] transition hover:border-[#D4AF37]"
            >
              ↺ {t('dhikr.reset')}
            </button>
            <div className="flex items-center gap-1 rounded-full border border-[#2A4A43] bg-[#112925] px-3 py-1.5 text-xs text-[#A3B1AC]">
              <span>Objectif :</span>
              {editingTarget ? (
                <input
                  type="number"
                  value={target}
                  min={1}
                  max={10000}
                  autoFocus
                  className="w-16 bg-transparent border-b border-[#D4AF37] text-center text-xs text-[#F4D03F] outline-none"
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
                  className="font-bold text-[#F4D03F] underline underline-offset-2 decoration-[#D4AF37]/40"
                >
                  {target}
                </button>
              )}
            </div>
            <button
              onClick={() => setTarget((tg) => tg + selected.count)}
              className="rounded-full border border-[#2A4A43] bg-[#112925] px-3 py-1.5 text-xs text-[#F4D03F] transition hover:border-[#D4AF37]"
            >
              +{selected.count}
            </button>
          </>
        )}
        {isComplete && (
          <button
            onClick={() => { setCount(0); setTarget(selected.count); }}
            className="flex items-center gap-1 rounded-xl px-4 py-2 text-xs font-bold transition hover:shadow-[0_0_16px_rgba(212,175,55,0.3)]"
            style={{ background: '#D4AF37', color: '#1a1a1a' }}
          >
            🔄 {t('dhikr.again')}  <span className="text-[9px] opacity-60 ml-1">ou ␣</span>
          </button>
        )}
      </div>

      {/* Keyboard hint */}
      <p className="mt-3 text-center text-[10px] text-[#A3B1AC]">
        ␣ Espace = compter · {isComplete ? 'Espace = recommencer' : 'Maintiens pour rapide'}
      </p>
    </div>
  );
}
