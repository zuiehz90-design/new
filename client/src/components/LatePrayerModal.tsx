import { useI18n } from '../i18n';

/**
 * Modal de confirmation quand on coche une prière qui est déjà passée.
 * Deux options :
 *  1. « J'ai oublié de cocher » → aucun malus, points normaux
 *  2. « J'ai prié en retard » → malus proportionnel au retard
 */
export function LatePrayerModal({
  open,
  prayer,
  prayerTime,
  onClose,
  onConfirm,
}: {
  open: boolean;
  prayer: string;
  prayerTime: Date;
  onClose: () => void;
  onConfirm: (late: boolean, lateMinutes?: number) => void;
}) {
  const { t } = useI18n();

  if (!open) return null;

  const now = Date.now();
  const diff = now - prayerTime.getTime();
  const lateMinutes = Math.floor(diff / 60_000);
  const hours = Math.floor(lateMinutes / 60);
  const mins = lateMinutes % 60;
  const timeLabel = hours > 0 ? `${hours}h ${mins}min` : `${mins} min`;

  const prayerLabel = t(`prayer.${prayer}`).split(' ')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="card w-full max-w-sm p-5 animate-fade-in"
        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-3xl">⏰</div>
          <h2 className="mt-3 text-lg font-bold" style={{ color: 'var(--accent-gold)' }}>
            {prayerLabel} — {t('prayer.lateTitle')}
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {t('prayer.lateMessage', { time: timeLabel })}
          </p>
        </div>

        <div className="mt-5 space-y-3">
          {/* Option 1 : Oubli */}
          <button
            onClick={() => onConfirm(false)}
            className="w-full rounded-xl px-4 py-3 text-left transition"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📝</span>
              <div className="flex-1">
                <p className="text-sm font-semibold">{t('prayer.lateForgot')}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{t('prayer.lateForgotHint')}</p>
              </div>
              <span className="text-xs font-bold text-emerald-400">+10 pts</span>
            </div>
          </button>

          {/* Option 2 : Vraiment en retard */}
          <button
            onClick={() => onConfirm(true, lateMinutes)}
            className="w-full rounded-xl px-4 py-3 text-left transition"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌙</span>
              <div className="flex-1">
                <p className="text-sm font-semibold">{t('prayer.lateReallyLate')}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{t('prayer.lateReallyLateHint')}</p>
              </div>
              <span className="text-xs font-bold text-amber-400">
                {lateMinutes <= 15 ? '+10 pts' : lateMinutes <= 60 ? '+8 pts' : lateMinutes <= 120 ? '+5 pts' : lateMinutes <= 240 ? '+2 pts' : '+0 pts'}
              </span>
            </div>
          </button>

          {/* Annuler */}
          <button
            onClick={onClose}
            className="w-full rounded-xl px-4 py-2 text-center text-xs font-semibold transition"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
