import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import {
  subscribeNotifications,
  getHistory,
  unreadCount,
  markAllRead,
  markRead,
  clearHistory,
  removeNotification,
  type NotificationItem,
} from '../lib/notifications';

function timeAgo(ts: number, t: (k: string) => string): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return t('notif.justNow');
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  return `${d} j`;
}

/** Cloche 🔔 + tiroir d'historique des notifications. */
export function NotificationCenter() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>(() => getHistory());
  const [count, setCount] = useState(() => unreadCount());

  useEffect(() => {
    const refresh = () => {
      setItems(getHistory());
      setCount(unreadCount());
    };
    const unsub = subscribeNotifications(refresh);
    return unsub;
  }, []);

  const onOpen = () => {
    setOpen((o) => !o);
    if (!open) {
      // Marque tout comme lu à l'ouverture du tiroir
      markAllRead();
    }
  };

  const handleClick = (n: NotificationItem) => {
    markRead(n.id);
    setOpen(false);
    if (n.clickUrl) navigate(n.clickUrl);
  };

  return (
    <>
      <button
        onClick={onOpen}
        aria-label={t('notif.title')}
        className="relative rounded-xl p-2 transition active:scale-90 hover:bg-white/5"
        style={{ color: 'var(--text-secondary)' }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-night-950"
            style={{ background: 'var(--accent-gold)' }}>
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div
            className="fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto p-0 animate-fade-in sm:my-3 sm:mr-3 sm:rounded-2xl sm:border"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'rgba(207, 161, 74, 0.2)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            {/* En-tête */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
              style={{ background: 'var(--bg-surface)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 className="text-base font-bold" style={{ color: 'var(--accent-gold)' }}>🔔 {t('notif.title')}</h2>
              <div className="flex items-center gap-1">
                {items.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="rounded-lg px-2 py-1 text-[11px] font-semibold transition hover:bg-white/5"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {t('notif.clearAll')}
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="rounded-lg px-2.5 py-1 text-xs font-bold transition hover:bg-white/5"
                  style={{ color: 'var(--text-tertiary)' }}>
                  ✕
                </button>
              </div>
            </div>

            {/* Liste */}
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
                <span className="text-4xl">🔕</span>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('notif.empty')}</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t('notif.emptyHint')}</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {items.map((n) => (
                  <div
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleClick(n)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleClick(n); }}
                    className="flex w-full cursor-pointer items-start gap-3 rounded-xl p-3 text-left transition hover:bg-white/5"
                    style={{ background: n.read ? 'transparent' : 'rgba(207, 161, 74, 0.06)' }}
                  >
                    <span className="text-2xl shrink-0">{n.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                        {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--accent-gold)' }} />}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{n.body}</p>
                      <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>{timeAgo(n.createdAt, t)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }}
                      className="shrink-0 rounded p-1 text-xs transition hover:bg-white/10"
                      style={{ color: 'var(--text-tertiary)' }}
                      aria-label={t('notif.dismiss')}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </>
  );
}
