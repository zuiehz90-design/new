import { useState } from 'react';
import { useI18n } from '../i18n';
import { type PrayerStatus } from '../lib/api';
import { prayerLabel } from '../lib/prayer';
import { LatePrayerModal } from './LatePrayerModal';

const SALAT_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

/**
 * Cinq cercles alignés pour l'état des prières :
 * · pointillé gris  = en attente (heure pas encore passée, impossible de cocher)
 * · vert rempli ✓   = accomplie (avec animation pop)
 * · rouge doux ✕    = manquée (rattrapable)
 */
export function PrayerCircles({
  prayers,
  missed,
  onToggle,
  timeOf,
}: {
  prayers: PrayerStatus | null;
  missed: string[];
  onToggle: (key: string, opts?: { late?: boolean; lateMinutes?: number }) => void;
  timeOf?: (key: string) => Date | null | undefined;
}) {
  const { t } = useI18n();
  const [lateModal, setLateModal] = useState<{ key: string; prayerTime: Date } | null>(null);
  const [justToggled, setJustToggled] = useState<string | null>(null);

  return (
    <>
    <div className="mx-auto flex w-full max-w-md items-center justify-center gap-2 sm:gap-3">
      {SALAT_KEYS.map((key) => {
        const done = prayers?.checked.includes(key) ?? false;
        const isMissed = missed.includes(key);
        const time = timeOf ? timeOf(key) : undefined;
        const hasPassed = time != null && time.getTime() < Date.now();
        const blocked = !done && time != null && !hasPassed;

        const stateKey = done ? 'done' : isMissed ? 'missed' : blocked ? 'blocked' : 'pending';

        let circle = 'border border-[#2A4A43] bg-[#081b16] text-stone-500 shadow-inner';
        if (done) {
          const isFresh = justToggled === key;
          circle = 'border border-emerald-300/60 text-white shadow-[0_0_22px_-8px_rgba(31,110,92,0.9)]';
          if (isFresh) circle += ' animate-pop prayer-pulse';
        }
        else if (isMissed) circle = 'border-2 border-red-400/70 bg-red-500/15 text-red-300';
        else if (blocked) circle = 'border-2 border-dashed border-stone-700/60 text-stone-600 opacity-60';

        let label = 'text-stone-400';
        if (done) label = 'text-emerald-300 font-semibold';
        else if (isMissed) label = 'text-red-300 font-semibold';
        else if (blocked) label = 'text-stone-500 opacity-70';

        return (
          <button
            key={key}
            onClick={() => {
              if (done) {
                // Already done — uncheck
                onToggle(key);
                setJustToggled(null);
              } else if (hasPassed && time) {
                // Prayer already passed — open late modal
                setLateModal({ key, prayerTime: time });
              } else {
                // Future prayer — mark as done instantly
                setJustToggled(key);
                try { navigator.vibrate?.(30); } catch {}
                setTimeout(() => setJustToggled(null), 800);
                onToggle(key);
              }
            }}
            disabled={blocked}
            title={blocked ? t('prayer.notYet') : undefined}
            aria-disabled={blocked}
            className="group flex flex-col items-center gap-1.5 transition-transform active:scale-90"
          >
            <span
              key={stateKey}
              className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 ${circle}`}
              style={done ? { background: 'linear-gradient(135deg, #1F6E5C, #2e9d82)' } : undefined}
            >
              {done ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : isMissed ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              ) : null}
            </span>
            <span className={`text-[10px] ${label}`}>
              {t(prayerLabel(key as (typeof SALAT_KEYS)[number])).split(' ')[0]}
            </span>
          </button>
        );
      })}
    </div>

      {lateModal && (
        <LatePrayerModal
          open={true}
          prayer={lateModal.key}
          prayerTime={lateModal.prayerTime}
          onClose={() => setLateModal(null)}
          onConfirm={(late, lateMinutes) => {
            onToggle(lateModal.key, { late, lateMinutes });
            setJustToggled(lateModal.key);
            try { navigator.vibrate?.(30); } catch {}
            setTimeout(() => setJustToggled(null), 600);
            setLateModal(null);
          }}
        />
      )}
    </>
  );
}
