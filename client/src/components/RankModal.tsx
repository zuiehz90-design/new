import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { apiGetRankDistribution, type RankDistributionEntry } from '../lib/api';
import { type RankInfo } from '../hooks/useDevotion';

/** Styles visuels par palier : dégradé, lueur, bordure, barre de progression */
const TIER_STYLE: Record<string, { gradient: string; glow: string; border: string; bar: string; text: string }> = {
  Bronze: { gradient: 'linear-gradient(135deg, #7c4a21 0%, #a05a2c 50%, #7c4a21 100%)', glow: 'rgba(160, 90, 44, 0.4)', border: 'rgba(232, 162, 79, 0.6)', bar: '#e8a24f', text: '#e8a24f' },
  Argent: { gradient: 'linear-gradient(135deg, #4a5568 0%, #718096 50%, #4a5568 100%)', glow: 'rgba(113, 128, 144, 0.4)', border: 'rgba(203, 213, 225, 0.55)', bar: '#cbd5e1', text: '#cbd5e1' },
  Or: { gradient: 'linear-gradient(135deg, #8a6d1f 0%, #d4af37 50%, #8a6d1f 100%)', glow: 'rgba(212, 175, 55, 0.4)', border: 'rgba(245, 215, 110, 0.6)', bar: '#f5d76e', text: '#f5d76e' },
  Platine: { gradient: 'linear-gradient(135deg, #0e5e6e 0%, #22b8cf 50%, #0e5e6e 100%)', glow: 'rgba(34, 184, 207, 0.4)', border: 'rgba(103, 232, 249, 0.55)', bar: '#67e8f9', text: '#67e8f9' },
  Diamant: { gradient: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1e3a8a 100%)', glow: 'rgba(59, 130, 246, 0.4)', border: 'rgba(147, 197, 253, 0.55)', bar: '#93c5fd', text: '#93c5fd' },
  Legende: { gradient: 'linear-gradient(135deg, #6b21a8 0%, #a855f7 50%, #6b21a8 100%)', glow: 'rgba(168, 85, 247, 0.45)', border: 'rgba(216, 180, 254, 0.6)', bar: '#d8b4fe', text: '#d8b4fe' },
};

/**
 * Modal « Classement des rangs » façon jeu vidéo : chaque palier a sa couleur
 * (dégradé bronze → or → platine → diamant → légende), le rang actuel est
 * mis en évidence avec une lueur dorée, et la distribution est visuelle.
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
  const legendeStyle = TIER_STYLE.Legende;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="card w-full max-w-lg max-h-[88vh] overflow-y-auto p-5 animate-fade-in"
        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--accent-gold)' }}>⚔️ {t('rank.title')}</h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t('rank.subtitle')}</p>
          </div>
          <button onClick={onClose} className="btn-ghost text-xs">{t('rank.close')}</button>
        </div>

        {currentEntry && (
          <div
            className="mb-4 rounded-2xl p-4 text-center"
            style={{
              background: TIER_STYLE[currentEntry.tier]?.gradient ?? TIER_STYLE.Bronze.gradient,
              boxShadow: '0 0 30px -6px ' + (TIER_STYLE[currentEntry.tier]?.glow ?? TIER_STYLE.Bronze.glow),
              border: '1px solid ' + (TIER_STYLE[currentEntry.tier]?.border ?? TIER_STYLE.Bronze.border),
            }}
          >
            <span className="text-4xl drop-shadow-lg">{currentEntry.icon}</span>
            <p className="mt-1 text-2xl font-black text-white drop-shadow">{currentEntry.name}</p>
            <p className="text-xs font-semibold text-white/80">
              {points} {t('rank.pts')} · {currentEntry.pct}% {t('rank.distribution').toLowerCase()}
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/30">
              <div
                className="h-full rounded-full bg-white/90 transition-all duration-700"
                style={{ width: Math.max(currentEntry.pct, currentEntry.pct > 0 ? 6 : 0) + '%' }}
              />
            </div>
          </div>
        )}

        {data && (
          <div
            className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}
          >
            <span className="text-lg">👥</span>
            <div className="flex-1">
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t('rank.distribution')}</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {data.total} {t('rank.players')}
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="py-8 text-center">
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{t('common.loading')}</p>
          </div>
        )}

        {!loading && tierGroups.map((group) => {
          const style = TIER_STYLE[group.tier] ?? TIER_STYLE.Bronze;
          return (
            <div key={group.tier} className="mb-5">
              <div
                className="mb-2 flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: style.gradient, boxShadow: '0 2px 12px -4px ' + style.glow }}
              >
                <span className="text-lg">{group.icon}</span>
                <span className="text-sm font-black uppercase tracking-wider text-white drop-shadow">{group.tier}</span>
                <span className="ml-auto text-[10px] font-semibold text-white/70">
                  {group.entries.map((e) => e.count).reduce((a, b) => a + b, 0)} {t('rank.players')}
                </span>
              </div>
              <div className="space-y-2">
                {group.entries.map((r) => {
                  const isCurrent = isCurrentRank(r);
                  return (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition"
                      style={{
                        border: '1px solid ' + (isCurrent ? style.border : 'var(--border-subtle)'),
                        background: isCurrent ? 'color-mix(in srgb, ' + style.glow + ', transparent 50%)' : 'var(--bg-card)',
                        boxShadow: isCurrent ? '0 0 18px -4px ' + style.glow : 'none',
                      }}
                    >
                      <span className="text-2xl drop-shadow">{r.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{r.name}</span>
                          {isCurrent && (
                            <span
                              className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-black"
                              style={{ background: style.bar }}
                            >
                              {t('rank.youAreHere')} ⭐
                            </span>
                          )}
                        </div>
                        <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                          {t('rank.min')} : {r.min} {t('rank.pts')}
                        </p>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(0,0,0,0.25)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: Math.max(r.pct, r.pct > 0 ? 4 : 0) + '%', background: style.bar }}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-black" style={{ color: style.text }}>{r.pct}%</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                          {r.count > 0 ? r.count + ' ' + t('rank.players') : t('rank.noPlayers')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {!loading && legendeEntry && (
          <div className="mb-4">
            <div
              className="mb-2 flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: legendeStyle.gradient, boxShadow: '0 2px 12px -4px ' + legendeStyle.glow }}
            >
              <span className="text-lg">{legendeEntry.icon}</span>
              <span className="text-sm font-black uppercase tracking-wider text-white drop-shadow">Légende</span>
            </div>
            <div
              className="flex items-center gap-3 rounded-xl px-3 py-2.5"
              style={{
                border: '1px solid ' + (isCurrentRank(legendeEntry) ? legendeStyle.border : 'var(--border-subtle)'),
                background: isCurrentRank(legendeEntry) ? 'rgba(168,85,247,0.15)' : 'var(--bg-card)',
                boxShadow: isCurrentRank(legendeEntry) ? '0 0 18px -4px rgba(168,85,247,0.4)' : 'none',
              }}
            >
              <span className="text-2xl">{legendeEntry.icon}</span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{legendeEntry.name}</span>
                <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{t('rank.min')} : {legendeEntry.min} {t('rank.pts')}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-base font-black" style={{ color: legendeStyle.text }}>{legendeEntry.pct}%</p>
                <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                  {legendeEntry.count > 0 ? legendeEntry.count + ' ' + t('rank.players') : t('rank.noPlayers')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
