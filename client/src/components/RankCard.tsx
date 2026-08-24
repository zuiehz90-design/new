import { useState } from 'react';
import { type Achievements, type RankInfo } from '../hooks/useDevotion';
import { useI18n } from '../i18n';
import { RankModal } from './RankModal';

const TIER_COLOR: Record<string, string> = {
  Bronze: '#e8a24f',
  Argent: '#cbd5e1',
  Or: '#f5d76e',
  Platine: '#67e8f9',
  Diamant: '#93c5fd',
  Légende: '#d8b4fe',
};

/**
 * Carte de rang mobile-first : icône grande + nom + barre + bouton.
 */
export function RankCard({
  achievements,
  points,
}: {
  achievements: Achievements;
  points: number;
}) {
  const r: RankInfo = achievements.rank;
  const rp = achievements.rankProgress;
  const filledPips = r.division == null ? 3 : 3 - r.division;
  const { t } = useI18n();
  const [ranksOpen, setRanksOpen] = useState(false);

  const tierName = r.tier === 'Légende' ? 'Légende' : r.tier;
  const color = TIER_COLOR[tierName] ?? TIER_COLOR.Bronze;

  return (
    <>
      <div className="card mb-4" style={{ borderColor: color + '40' }}>
        {/* Top section: icon + rank name + pips */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <span className="text-3xl flex-shrink-0">{r.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold truncate" style={{ color }}>{r.name}</span>
              {r.division != null && (
                <div className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="inline-block h-1.5 w-3 rounded-full"
                      style={{ background: i < filledPips ? color : 'rgba(255,255,255,0.1)' }}
                    />
                  ))}
                </div>
              )}
            </div>
            <p className="text-[10px] text-stone-500 mt-0.5">
              {points} pts
              {!rp.maxed && (
                <span className="text-stone-600"> · {t('rank.next')} : {rp.pointsNeeded} pts</span>
              )}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: (rp.maxed ? 100 : rp.pct) + '%', background: color }}
              />
            </div>
            {!rp.maxed && (
              <span className="text-xs tabular-nums font-semibold" style={{ color }}>{rp.pct}%</span>
            )}
            {rp.maxed && (
              <span className="text-xs font-bold" style={{ color }}>MAX</span>
            )}
          </div>
        </div>

        {/* Button */}
        <button
          onClick={() => setRanksOpen(true)}
          className="w-full border-t px-4 py-3 text-xs font-bold text-stone-400 transition active:scale-[0.98] active:bg-white/5"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          ⚔️ {t('rank.viewAll')}
        </button>
      </div>

      <RankModal open={ranksOpen} onClose={() => setRanksOpen(false)} currentRank={r} points={points} />
    </>
  );
}