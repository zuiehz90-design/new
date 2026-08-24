import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { apiGetRankDistribution, type RankDistributionEntry } from '../lib/api';
import { type RankInfo } from '../hooks/useDevotion';

const TIER_COLOR: Record<string, string> = {
  Bronze: '#e8a24f',
  Argent: '#cbd5e1',
  Or: '#f5d76e',
  Platine: '#67e8f9',
  Diamant: '#93c5fd',
  Légende: '#d8b4fe',
};

/**
 * Modal des rangs : n'affiche que les paliers qui ont au moins un joueur.
 */
export function RankModal({
  open,
  onClose,
  currentRank,
  points,
}: {
  open: boolean;
  onClose: () => void;
  currentRank: RankInfo;
  points: number;
}) {
  const { t } = useI18n();
  const [data, setData] = useState<{ ranks: RankDistributionEntry[]; total: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    apiGetRankDistribution()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const tiers = data?.ranks ?? [];

  // Grouper par palier, ne garder que ceux qui ont au moins 1 joueur
  const tierGroups: { tier: string; icon: string; color: string; entries: RankDistributionEntry[] }[] = [];
  for (const r of tiers.filter((x) => x.id !== 'legende')) {
    const last = tierGroups[tierGroups.length - 1];
    if (last && last.tier === r.tier) last.entries.push(r);
    else tierGroups.push({ tier: r.tier, icon: r.icon, color: r.color, entries: [r] });
  }
  const populatedGroups = tierGroups.filter(g => g.entries.reduce((a, e) => a + e.count, 0) > 0);

  const legendeEntry = tiers.find((r) => r.id === 'legende');
  const isCurrentRank = (r: RankDistributionEntry) => r.id === currentRank.id;
  const currentEntry = tiers.find((r) => r.id === currentRank.id);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-3" onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl animate-fade-in"
        style={{
          background: 'linear-gradient(180deg, #0f1a18 0%, #081210 100%)',
          border: '1px solid rgba(207, 161, 74, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="sticky top-0 z-10 px-4 pt-4 pb-2" style={{ background: 'linear-gradient(180deg, #0f1a18 0%, #0f1a18 80%, transparent)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gold-400">⚔️ {t('rank.title')}</h2>
            <button onClick={onClose} className="rounded-lg px-2.5 py-1 text-xs font-bold text-stone-400 hover:text-white hover:bg-white/5 transition">
              ✕
            </button>
          </div>
          {data && (
            <p className="text-[10px] text-stone-500 mt-0.5">
              {data.total} {t('rank.players')} · {t('rank.subtitle').toLowerCase()}
            </p>
          )}
        </div>

        <div className="px-4 pb-6">
          {/* Rang actuel (carte hero) */}
          {currentEntry && (
            <div
              className="mb-4 rounded-xl p-4 text-center"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid ' + (TIER_COLOR[currentEntry.tier] ?? '#e8a24f') + '30',
              }}
            >
              <span className="text-4xl">{currentEntry.icon}</span>
              <p className="mt-1 text-xl font-bold" style={{ color: TIER_COLOR[currentEntry.tier] ?? '#e8a24f' }}>
                {currentEntry.name}
              </p>
              <p className="text-sm text-stone-300">{points} pts</p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: Math.max(currentEntry.pct, currentEntry.pct > 0 ? 5 : 0) + '%',
                    background: TIER_COLOR[currentEntry.tier] ?? '#e8a24f',
                  }}
                />
              </div>
              <p className="mt-1 text-[10px] text-stone-500">{currentEntry.pct}% des joueurs</p>
            </div>
          )}

          {loading && (
            <div className="py-10 text-center text-sm text-stone-500">{t('common.loading')}</div>
          )}

          {!loading && populatedGroups.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-stone-400">{t('rank.noPlayers')}</p>
            </div>
          )}

          {/* Ladder : seuls les paliers peuplés */}
          {!loading && populatedGroups.map((group, gi) => {
            const color = TIER_COLOR[group.tier] ?? '#e8a24f';
            const groupCount = group.entries.reduce((a, e) => a + e.count, 0);
            return (
              <div key={group.tier} className={gi > 0 ? 'mt-3' : ''}>
                {/* Bandeau du palier */}
                <div
                  className="mb-1.5 flex items-center gap-2 rounded-lg px-3 py-1.5"
                  style={{
                    background: color + '15',
                    border: '1px solid ' + color + '25',
                  }}
                >
                  <span className="text-base">{group.icon}</span>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{group.tier}</span>
                  <span className="ml-auto text-[10px] text-stone-500">{groupCount} {t('rank.players')}</span>
                </div>

                {/* Entrées du palier */}
                <div className="space-y-1">
                  {group.entries.filter(e => e.count > 0 || e.id === currentRank.id).map((r) => {
                    const isCurrent = isCurrentRank(r);
                    return (
                      <div
                        key={r.id}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all"
                        style={{
                          border: '1px solid ' + (isCurrent ? color + '40' : 'transparent'),
                          background: isCurrent ? color + '0a' : 'transparent',
                        }}
                      >
                        <span className="text-lg">{r.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-white/90">{r.name}</span>
                            {isCurrent && (
                              <span className="rounded-full px-1.5 py-px text-[8px] font-bold text-black" style={{ background: color }}>
                                ⭐
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-stone-500">{r.min} pts</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold" style={{ color }}>{r.count}</p>
                          <p className="text-[9px] text-stone-600">{r.pct}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Prochains paliers (vides) */}
          {!loading && populatedGroups.length > 0 && (
            <div className="mt-4 text-center">
              <p className="text-[10px] text-stone-600">
                {t('rank.next')} — {t('rank.noPlayers')}
              </p>
            </div>
          )}

          {/* Légende (toujours visible en dernier) */}
          {!loading && legendeEntry && (
            <div className="mt-3">
              <div
                className="mb-1.5 flex items-center gap-2 rounded-lg px-3 py-1.5"
                style={{
                  background: '#d8b4fe15',
                  border: '1px solid #d8b4fe25',
                }}
              >
                <span className="text-base">{legendeEntry.icon}</span>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#d8b4fe' }}>Légende</span>
              </div>
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{
                  border: isCurrentRank(legendeEntry) ? '1px solid #d8b4fe40' : '1px solid transparent',
                  background: isCurrentRank(legendeEntry) ? '#d8b4fe0a' : 'transparent',
                }}
              >
                <span className="text-lg">{legendeEntry.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-white/60">{legendeEntry.name}</span>
                  <p className="text-[10px] text-stone-600">{legendeEntry.min} pts</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold" style={{ color: '#d8b4fe' }}>{legendeEntry.count}</p>
                  <p className="text-[9px] text-stone-600">{legendeEntry.pct}%</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}