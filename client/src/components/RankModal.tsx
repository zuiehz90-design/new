import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { apiGetRankDistribution, type RankDistributionEntry } from '../lib/api';
import { type RankInfo } from '../hooks/useDevotion';

/** Styles visuels par palier */
const TIER_STYLE: Record<string, { gradient: string; glow: string; border: string; bar: string; text: string }> = {
  Bronze: { gradient: 'linear-gradient(135deg, #7c4a21 0%, #a05a2c 50%, #7c4a21 100%)', glow: 'rgba(160, 90, 44, 0.4)', border: 'rgba(232, 162, 79, 0.6)', bar: '#e8a24f', text: '#e8a24f' },
  Argent: { gradient: 'linear-gradient(135deg, #4a5568 0%, #718096 50%, #4a5568 100%)', glow: 'rgba(113, 128, 144, 0.4)', border: 'rgba(203, 213, 225, 0.55)', bar: '#cbd5e1', text: '#cbd5e1' },
  Or: { gradient: 'linear-gradient(135deg, #8a6d1f 0%, #d4af37 50%, #8a6d1f 100%)', glow: 'rgba(212, 175, 55, 0.4)', border: 'rgba(245, 215, 110, 0.6)', bar: '#f5d76e', text: '#f5d76e' },
  Platine: { gradient: 'linear-gradient(135deg, #0e5e6e 0%, #22b8cf 50%, #0e5e6e 100%)', glow: 'rgba(34, 184, 207, 0.4)', border: 'rgba(103, 232, 249, 0.55)', bar: '#67e8f9', text: '#67e8f9' },
  Diamant: { gradient: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1e3a8a 100%)', glow: 'rgba(59, 130, 246, 0.4)', border: 'rgba(147, 197, 253, 0.55)', bar: '#93c5fd', text: '#93c5fd' },
  Légende: { gradient: 'linear-gradient(135deg, #6b21a8 0%, #a855f7 50%, #6b21a8 100%)', glow: 'rgba(168, 85, 247, 0.45)', border: 'rgba(216, 180, 254, 0.6)', bar: '#d8b4fe', text: '#d8b4fe' },
};

/**
 * Modal « Ladder des rangs » style jeu vidéo.
 * Affiche tous les rangs du plus bas au plus haut avec la distribution.
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
  const tierGroups: { tier: string; icon: string; entries: RankDistributionEntry[] }[] = [];
  for (const r of tiers.filter((x) => x.id !== 'legende')) {
    const last = tierGroups[tierGroups.length - 1];
    if (last && last.tier === r.tier) last.entries.push(r);
    else tierGroups.push({ tier: r.tier, icon: r.icon, entries: [r] });
  }
  const legendeEntry = tiers.find((r) => r.id === 'legende');
  const isCurrentRank = (r: RankDistributionEntry) => r.id === currentRank.id;
  const currentEntry = tiers.find((r) => r.id === currentRank.id);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 backdrop-blur-lg" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl animate-fade-in"
        style={{
          background: 'linear-gradient(180deg, #0a1a14 0%, #041210 100%)',
          border: '1px solid rgba(207, 161, 74, 0.2)',
          boxShadow: '0 0 60px -12px rgba(207, 161, 74, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black" style={{ color: '#cfa14a' }}>⚔️ {t('rank.title')}</h2>
              <p className="text-xs text-stone-500">{t('rank.subtitle')}</p>
            </div>
            <button onClick={onClose} className="rounded-xl px-3 py-1.5 text-xs font-bold text-stone-400 transition hover:text-white" style={{ background: 'rgba(255,255,255,0.05)' }}>
              ✕
            </button>
          </div>

          {/* Rang actuel (hero) */}
          {currentEntry && (
            <div
              className="mt-4 rounded-2xl p-5 text-center"
              style={{
                background: TIER_STYLE[currentEntry.tier]?.gradient ?? TIER_STYLE.Bronze.gradient,
                boxShadow: '0 0 40px -8px ' + (TIER_STYLE[currentEntry.tier]?.glow ?? TIER_STYLE.Bronze.glow),
                border: '1px solid ' + (TIER_STYLE[currentEntry.tier]?.border ?? TIER_STYLE.Bronze.border),
              }}
            >
              <span className="text-5xl drop-shadow-lg">{currentEntry.icon}</span>
              <p className="mt-1 text-3xl font-black text-white drop-shadow-lg">{currentEntry.name}</p>
              <p className="mt-1 text-sm font-bold text-white/80">
                {points} {t('rank.pts')}
              </p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/30">
                <div
                  className="h-full rounded-full bg-white/90 transition-all duration-700"
                  style={{ width: Math.max(currentEntry.pct, currentEntry.pct > 0 ? 6 : 0) + '%' }}
                />
              </div>
              <p className="mt-1 text-[10px] font-semibold text-white/60">
                {currentEntry.pct}% {t('rank.distribution').toLowerCase()}
              </p>
            </div>
          )}

          {/* Stats globales */}
          {data && (
            <div className="mt-4 mb-2 flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-lg">👥</span>
              <p className="text-xs text-stone-400">{data.total} {t('rank.players')}</p>
            </div>
          )}
        </div>

        {/* Ladder */}
        <div className="px-5 pt-2 pb-5">
          {loading && (
            <div className="py-8 text-center">
              <p className="text-sm text-stone-500">{t('common.loading')}</p>
            </div>
          )}

          {!loading && tierGroups.map((group, gi) => {
            const style = TIER_STYLE[group.tier] ?? TIER_STYLE.Bronze;
            const groupCount = group.entries.reduce((a, e) => a + e.count, 0);
            return (
              <div key={group.tier} className={gi > 0 ? 'mt-5' : ''}>
                {/* Header du palier */}
                <div
                  className="mb-2 flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background: style.gradient, boxShadow: '0 2px 16px -4px ' + style.glow }}
                >
                  <span className="text-lg">{group.icon}</span>
                  <span className="text-sm font-black uppercase tracking-wider text-white drop-shadow">{group.tier}</span>
                  <span className="ml-auto text-[10px] font-bold text-white/60">{groupCount} {t('rank.players')}</span>
                </div>

                {/* Rangs du palier */}
                <div className="space-y-2">
                  {group.entries.map((r) => {
                    const isCurrent = isCurrentRank(r);
                    return (
                      <div
                        key={r.id}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 transition-all"
                        style={{
                          border: '1px solid ' + (isCurrent ? style.border : 'rgba(255,255,255,0.05)'),
                          background: isCurrent ? 'color-mix(in srgb, ' + style.glow + ', transparent 40%)' : 'rgba(255,255,255,0.02)',
                          boxShadow: isCurrent ? '0 0 20px -4px ' + style.glow : 'none',
                        }}
                      >
                        <span className="text-2xl">{r.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{r.name}</span>
                            {isCurrent && (
                              <span
                                className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-black"
                                style={{ background: style.bar }}
                              >
                                ⭐ {t('rank.youAreHere')}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-stone-500">{r.min} {t('rank.pts')}</p>
                          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/5">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: Math.max(r.pct, r.pct > 0 ? 4 : 0) + '%', background: style.bar }}
                            />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-black" style={{ color: style.text }}>{r.pct}%</p>
                          <p className="text-[10px] text-stone-500">
                            {r.count > 0 ? r.count : '—'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Légende */}
          {!loading && legendeEntry && (
            <div className="mt-4">
              <div
                className="mb-2 flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: TIER_STYLE.Légende.gradient, boxShadow: '0 2px 16px -4px ' + TIER_STYLE.Légende.glow }}
              >
                <span className="text-lg">{legendeEntry.icon}</span>
                <span className="text-sm font-black uppercase tracking-wider text-white drop-shadow">Légende</span>
              </div>
              <div
                className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{
                  border: '1px solid ' + (isCurrentRank(legendeEntry) ? TIER_STYLE.Légende.border : 'rgba(255,255,255,0.05)'),
                  background: isCurrentRank(legendeEntry) ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.02)',
                  boxShadow: isCurrentRank(legendeEntry) ? '0 0 20px -4px rgba(168,85,247,0.4)' : 'none',
                }}
              >
                <span className="text-2xl">{legendeEntry.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-white">{legendeEntry.name}</span>
                  <p className="text-[10px] text-stone-500">{legendeEntry.min} {t('rank.pts')}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-black" style={{ color: TIER_STYLE.Légende.text }}>{legendeEntry.pct}%</p>
                  <p className="text-[10px] text-stone-500">{legendeEntry.count > 0 ? legendeEntry.count : '—'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
