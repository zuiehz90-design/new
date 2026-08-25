import { useDevotion } from '../hooks/useDevotion';
import { useI18n } from '../i18n';

const TIER_ICON: Record<string, string> = { bronze: '🥉', silver: '🥈', gold: '🥇' };
const TIER_LABEL: Record<string, string> = { bronze: 'Bronze', silver: 'Argent', gold: 'Or' };

const FAMILY_COLORS: Record<string, string> = {
  salat: 'border-amber-500/40 bg-amber-500/5',
  five: 'border-yellow-500/40 bg-yellow-500/5',
  streak: 'border-orange-500/40 bg-orange-500/5',
  quests: 'border-emerald-500/40 bg-emerald-500/5',
  rank: 'border-gold-500/40 bg-gold-500/5',
  stories: 'border-rose-500/40 bg-rose-500/5',
};

export function BadgesView() {
  const { t } = useI18n();
  const { achievements } = useDevotion();

  const totalEarned = achievements?.badges?.length ?? 0;
  const totalTiers = achievements?.families?.reduce((sum, f) => sum + f.tiers.length, 0) ?? 18;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-8 pt-6 animate-fade-in">
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-500/15 text-4xl">🏅</div>
        <h2 className="mt-3 text-2xl font-bold text-gold-400">{t('badges.title')}</h2>
        <p className="mt-1 text-xs text-stone-400">{t('badges.subtitle')}</p>
      </div>

      {/* Barre de progression globale */}
      <div className="card mb-4 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-gold-400">🏅 {t('badges.progress')}</p>
          <p className="text-xs font-semibold text-stone-300">{totalEarned}/{totalTiers}</p>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-stone-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-gold-500 to-emerald-500 transition-all duration-500"
            style={{ width: totalTiers > 0 ? Math.round((totalEarned / totalTiers) * 100) + '%' : '0%' }}
          />
        </div>
      </div>

      {!achievements || !achievements.families ? (
        <div className="text-center py-12">
          <p className="text-sm text-stone-500">{t('badges.loading')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {achievements.families.map((family) => {
            const earnedCount = family.tiers.filter((t) => t.earned).length;
            const maxLevel = family.tiers.length;
            const nextTier = family.tiers.find((t) => !t.earned);
            const colors = FAMILY_COLORS[family.id] ?? 'border-stone-500/40 bg-stone-500/5';

            return (
              <div key={family.id} className={'card p-4 ' + colors}>
                {/* En-tête famille */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-800/60 text-2xl">
                    {family.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-stone-100">{family.name}</h3>
                    <p className="text-[11px] text-stone-400">{family.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-gold-300">
                      {earnedCount}/{maxLevel}
                    </p>
                    <p className="text-[10px] text-stone-500">{t('badges.unlocked')}</p>
                  </div>
                </div>

                {/* Barre de progression de la famille */}
                <div className="mb-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-800">
                    <div
                      className="h-full rounded-full bg-gold-500/70 transition-all duration-500"
                      style={{ width: Math.round((family.current / (family.tiers[family.tiers.length - 1]?.threshold ?? 1)) * 100) + '%' }}
                    />
                  </div>
                </div>

                {/* Paliers (tiers) */}
                <div className="grid grid-cols-3 gap-2">
                  {family.tiers.map((tier) => {
                    const earned = tier.earned;
                    return (
                      <div
                        key={tier.level}
                        className={
                          'rounded-lg border p-2 text-center transition ' +
                          (earned
                            ? 'border-gold-500/60 bg-gold-500/15'
                            : 'border-stone-700/40 bg-stone-800/30 opacity-60')
                        }
                      >
                        <p className="text-xl">{TIER_ICON[tier.level]}</p>
                        <p className={'text-[10px] font-semibold ' + (earned ? 'text-gold-300' : 'text-stone-500')}>
                          {TIER_LABEL[tier.level] ?? tier.level}
                        </p>
                        <p className={'text-[9px] ' + (earned ? 'text-gold-400/70' : 'text-stone-600')}>
                          {earned
                            ? t('badges.earned')
                            : t('badges.goal') + ' ' + tier.threshold}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Prochain palier */}
                {nextTier && (
                  <div className="mt-3 rounded-lg border border-stone-700/40 bg-stone-800/40 px-3 py-2">
                    <p className="text-[10px] text-stone-400">
                      {t('badges.next')} :{' '}
                      <span className="font-semibold text-gold-300">
                        {TIER_ICON[nextTier.level]} {TIER_LABEL[nextTier.level] ?? nextTier.level}
                      </span>
                      {' — '}
                      <span className="text-stone-300">{family.current}/{nextTier.threshold}</span>
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Légende */}
      <div className="mt-6 rounded-xl border border-stone-700/40 bg-stone-800/30 p-4 text-center">
        <p className="text-[11px] text-stone-400">{t('badges.footer')}</p>
      </div>
    </div>
  );
}
