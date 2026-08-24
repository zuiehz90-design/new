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
 * Carte de rang compacte : nom du palier, points, barre de progression, pips.
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
      <div className="card mb-4 border p-4" style={{ borderColor: color + '40' }}>
        <div className="flex items-center gap-3">
          {/* Icône */}
          <span className="text-2xl">{r.icon}</span>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold" style={{ color }}>{r.name}</span>
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

            {/* Barre de progression */}
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: (rp.maxed ? 100 : rp.pct) + '%', background: color }}
                />
              </div>
              {!rp.maxed && (
                <span className="text-[10px] tabular-nums text-stone-500">{rp.pct}%</span>
              )}
            </div>

            <p className="mt-1 text-[10px] text-stone-500">
              {points} pts {!rp.maxed && <span className="text-stone-600">· {t('rank.next')} : {rp.pointsNeeded} pts</span>}
            </p>
          </div>

          {/* Debouton voir tous les rangs */}
          <button
            onClick={() => setRanksOpen(true)}
            className="shrink-0 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold text-stone-400 transition hover:border-gold-500/40 hover:text-gold-300"
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
          >
            ⚔️ {t('rank.viewAll')}
          </button>
        </div>
      </div>

      <RankModal open={ranksOpen} onClose={() => setRanksOpen(false)} currentRank={r} points={points} />
    </>
  );
}