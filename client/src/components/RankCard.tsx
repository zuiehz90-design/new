import { useState } from 'react';
import { type Achievements, type RankInfo } from '../hooks/useDevotion';
import { useI18n } from '../i18n';
import { RankModal } from './RankModal';

/**
 * Carte de rang façon jeu vidéo : palier (Bronze/Argent/Or/…), divisions 3-2-1,
 * progression dans la division et points restants pour le rang suivant.
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
  // Divisions gagnées dans le palier : Bronze 3 → 0, Bronze 2 → 1, Bronze 1 → 2, Légende → 3
  const filledPips = r.division == null ? 3 : 3 - r.division;
  const { t } = useI18n();
  const [ranksOpen, setRanksOpen] = useState(false);

  return (
    <div className="card mb-4 p-4 border-gold-500/30 bg-gradient-to-r from-emerald-900/30 to-night-900/80">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{r.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-stone-400">Votre rang</p>
          <p className={"text-sm font-bold " + r.color}>{r.name}</p>
          {rp.maxed ? (
            <p className="text-[10px] font-semibold text-gold-400">Rang maximum atteint 👑</p>
          ) : (
            <p className="text-[10px] text-stone-500">
              → {achievements.nextRank} · {rp.pointsNeeded} pts
            </p>
          )}
        </div>
        <div className="text-right">
          {right ?? (
            <>
              <p className="text-lg font-bold text-gold-400">{points}⭐</p>
              <p className="text-[10px] text-stone-500">Points</p>
            </>
          )}
        </div>
      </div>
      {/* Pips de divisions (3 par palier) */}
      {r.division != null && (
        <div className="mt-2 flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={"h-1.5 flex-1 rounded-full " + (i < filledPips ? 'bg-gold-400' : 'bg-emerald-900/40')}
            />
          ))}
          <span className="ml-1 text-[9px] font-semibold uppercase tracking-wide text-stone-500">{r.tier}</span>
        </div>
      )}
      {/* Barre de progression vers le rang suivant */}
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-emerald-900/40">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-gold-400 transition-all duration-700"
          style={{ width: rp.maxed ? '100%' : rp.pct + '%' }}
        />
      </div>
      {/* Bouton "Voir tous les rangs" */}
      <button
        onClick={() => setRanksOpen(true)}
        className="mt-3 w-full rounded-xl border border-emerald-900/40 bg-emerald-900/10 py-2 text-center text-xs font-semibold text-stone-300 transition hover:border-gold-500/40 hover:bg-gold-500/10 hover:text-gold-300"
      >
        ⚔️ {t('rank.viewAll')}
      </button>
      <RankModal open={ranksOpen} onClose={() => setRanksOpen(false)} currentRank={r} points={points} />
    </div>
  );
}
