import { useState } from 'react';
import { type Achievements, type RankInfo } from '../hooks/useDevotion';
import { useI18n } from '../i18n';
import { RankModal } from './RankModal';

/** Styles visuels par palier */
const TIER_STYLE: Record<string, { gradient: string; glow: string; border: string; bar: string }> = {
  Bronze: { gradient: 'linear-gradient(135deg, #7c4a21 0%, #a05a2c 50%, #7c4a21 100%)', glow: 'rgba(160, 90, 44, 0.5)', border: 'rgba(232, 162, 79, 0.6)', bar: '#e8a24f' },
  Argent: { gradient: 'linear-gradient(135deg, #4a5568 0%, #718096 50%, #4a5568 100%)', glow: 'rgba(113, 128, 144, 0.5)', border: 'rgba(203, 213, 225, 0.55)', bar: '#cbd5e1' },
  Or: { gradient: 'linear-gradient(135deg, #8a6d1f 0%, #d4af37 50%, #8a6d1f 100%)', glow: 'rgba(212, 175, 55, 0.5)', border: 'rgba(245, 215, 110, 0.6)', bar: '#f5d76e' },
  Platine: { gradient: 'linear-gradient(135deg, #0e5e6e 0%, #22b8cf 50%, #0e5e6e 100%)', glow: 'rgba(34, 184, 207, 0.5)', border: 'rgba(103, 232, 249, 0.55)', bar: '#67e8f9' },
  Diamant: { gradient: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1e3a8a 100%)', glow: 'rgba(59, 130, 246, 0.5)', border: 'rgba(147, 197, 253, 0.55)', bar: '#93c5fd' },
  Légende: { gradient: 'linear-gradient(135deg, #6b21a8 0%, #a855f7 50%, #6b21a8 100%)', glow: 'rgba(168, 85, 247, 0.55)', border: 'rgba(216, 180, 254, 0.6)', bar: '#d8b4fe' },
};

/**
 * Carte de rang façon jeu vidéo : écu avec icône, nom du palier,
 * barre de progression animée et divisions (3 → 1).
 */
export function RankCard({
  achievements,
  points,
  right,
}: {
  achievements: Achievements;
  points: number;
  right?: React.ReactNode;
}) {
  const r: RankInfo = achievements.rank;
  const rp = achievements.rankProgress;
  const filledPips = r.division == null ? 3 : 3 - r.division;
  const { t } = useI18n();
  const [ranksOpen, setRanksOpen] = useState(false);

  const tierName = r.tier === 'Légende' ? 'Légende' : r.tier;
  const style = TIER_STYLE[tierName] ?? TIER_STYLE.Bronze;

  return (
    <div
      className="card mb-4"
      style={{
        background: style.gradient,
        boxShadow: '0 0 40px -8px ' + style.glow,
        border: '1px solid ' + style.border,
      }}
    >
      {/* En-tête avec écu */}
      <div className="relative px-4 pt-4 pb-3">
        {/* Lueur d'ambiance */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, ' + style.glow + ', transparent 70%)',
          }}
        />

        <div className="relative flex items-center gap-4">
          {/* Grand écu */}
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-4xl"
            style={{
              background: 'rgba(0,0,0,0.35)',
              border: '2px solid ' + style.border,
              boxShadow: '0 0 20px -4px ' + style.glow,
            }}
          >
            {r.icon}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
              {t('rank.yourRank')}
            </p>
            <p className="mt-0.5 text-xl font-black text-white drop-shadow-lg">
              {r.name}
            </p>
            {rp.maxed ? (
              <p className="mt-0.5 text-xs font-bold text-yellow-300">
                👑 {t('rank.maxed')}
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-white/60">
                → {achievements.nextRank} · {rp.pointsNeeded} pts
              </p>
            )}
          </div>

          <div className="text-right shrink-0">
            {right ?? (
              <>
                <p className="text-2xl font-black text-white drop-shadow">{points}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">{t('rank.pts')}</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Divisions + barre de progression */}
      <div className="px-4 pb-4">
        {/* Pips de divisions */}
        {r.division != null && (
          <div className="mb-2 flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-2 flex-1 rounded-full transition-all duration-500"
                style={{
                  background: i < filledPips ? 'white' : 'rgba(255,255,255,0.15)',
                  boxShadow: i < filledPips ? '0 0 8px ' + style.glow : 'none',
                }}
              />
            ))}
            <span className="ml-1 text-[9px] font-bold uppercase tracking-widest text-white/40">
              {r.tier}
            </span>
          </div>
        )}

        {/* Barre de progression */}
        <div className="h-3 w-full overflow-hidden rounded-full bg-black/30">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: rp.maxed ? '100%' : rp.pct + '%',
              background: 'linear-gradient(90deg, rgba(255,255,255,0.4), white)',
              boxShadow: '0 0 12px ' + style.glow,
            }}
          />
        </div>

        {/* Bouton voir tous les rangs */}
        <button
          onClick={() => setRanksOpen(true)}
          className="mt-3 w-full rounded-xl py-2 text-center text-xs font-bold uppercase tracking-wider text-white/80 transition hover:text-white"
          style={{
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          ⚔️ {t('rank.viewAll')}
        </button>
      </div>

      <RankModal open={ranksOpen} onClose={() => setRanksOpen(false)} currentRank={r} points={points} />
    </div>
  );
}
