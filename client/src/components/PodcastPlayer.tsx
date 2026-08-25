import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { type ProphetAudio } from '../lib/prophetsAudio';

const RATES = [0.75, 1, 1.25, 1.5];

function fmt(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Lecteur de podcast (streaming MP3) pour les histoires des prophètes.
 * Play/pause, barre de progression, vitesse réglable (playbackRate).
 */
export function PodcastPlayer({ audio }: { audio: ProphetAudio }) {
  const { t } = useI18n();
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reset quand on change de prophète / d'épisode
  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
    setError(false);
    setLoading(false);
  }, [audio.url]);

  const toggle = () => {
    const el = ref.current;
    if (!el || error) return;
    if (el.paused) {
      setLoading(true);
      el.play().catch(() => setError(true));
    } else {
      el.pause();
    }
  };

  const seek = (value: number) => {
    const el = ref.current;
    if (!el) return;
    el.currentTime = value;
    setCurrent(value);
  };

  const changeRate = (r: number) => {
    setRate(r);
    if (ref.current) ref.current.playbackRate = r;
  };

  const progress = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;

  return (
    <div className="card mb-4 p-4 !border-emerald-500/40">
      <audio
        ref={ref}
        src={audio.url}
        preload="metadata"
        onPlay={() => { setPlaying(true); setLoading(false); }}
        onPause={() => { setPlaying(false); setLoading(false); }}
        onEnded={() => { setPlaying(false); setLoading(false); setCurrent(0); }}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onError={() => { setError(true); setLoading(false); setPlaying(false); }}
      />

      {/* Ligne 1 : lecture + titre */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          disabled={error}
          className="btn-gold flex-shrink-0 !px-4 !py-2 text-sm"
          aria-label={playing ? t('prophets.pause') : t('prophets.play')}
        >
          {loading ? '⏳' : playing ? '⏸' : '▶️'}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-stone-100 truncate">🎙️ {audio.title}</p>
          <p className="text-[10px] text-stone-500 truncate">{audio.source}</p>
        </div>
      </div>

      {/* Ligne 2 : progression + temps */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-[10px] tabular-nums text-stone-500 w-10 text-right">{fmt(current)}</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.5}
          value={current}
          onChange={(e) => seek(Number(e.target.value))}
          className="flex-1 accent-emerald-500"
          disabled={error}
          aria-label="Progression"
        />
        <span className="text-[10px] tabular-nums text-stone-500 w-10">{duration ? fmt(duration) : '--:--'}</span>
      </div>

      {/* Ligne 3 : vitesse */}
      <div className="mt-2 flex items-center gap-1.5">
        <span className="text-[10px] text-stone-500">{t('prophets.speed')}</span>
        {RATES.map((r) => (
          <button
            key={r}
            onClick={() => changeRate(r)}
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition ${
              rate === r
                ? 'bg-emerald-500/25 text-emerald-300 ring-1 ring-emerald-500/60'
                : 'bg-white/5 text-stone-400 hover:bg-white/10'
            }`}
          >
            {r}×
          </button>
        ))}
        {error && (
          <span className="ml-auto text-[10px] text-red-400">⚠️ Épisode indisponible</span>
        )}
      </div>
    </div>
  );
}
