import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import type { Achievements } from '../hooks/useDevotion';

const TIER_ICONS: Record<string, string> = { bronze: '🥉', silver: '🥈', gold: '🥇' };

/**
 * Rangée compacte des badges débloqués (famille + niveaux obtenus).
 * Chaque famille s'affiche une fois, avec l'icône de son plus haut niveau.
 * Cliquer mène à la page Badges complète.
 */
export function BadgeStrip({ achievements }: { achievements: Achievements | null }) {
  const { t } = useI18n();
  const families = achievements?.families ?? [];

  const earnedFamilies = families
    .map((f) => {
      const earned = f.tiers.filter((tier) => tier.earned);
      if (earned.length === 0) return null;
      const top = earned[earned.length - 1];
      return { id: f.id, name: f.name, icon: f.icon, level: top.level };
    })
    .filter((f): f is NonNullable<typeof f> => f !== null);

  if (earnedFamilies.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-bold text-gold-400">🏅 {t('badges.title')}</p>
        <Link to="/badges" className="text-[10px] text-stone-400 underline underline-offset-2 hover:text-gold-300">
          {t('badges.seeAll')}
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {earnedFamilies.map((f) => (
          <Link
            key={f.id}
            to="/badges"
            className="card flex items-center gap-1.5 px-2.5 py-1.5 transition hover:border-gold-500/50"
            title={f.name}
          >
            <span className="text-lg leading-none">{TIER_ICONS[f.level] ?? '🏅'}</span>
            <span className="text-xs font-semibold text-gold-300">{f.icon}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
