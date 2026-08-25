import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

interface Toast {
  id: number;
  icon: string;
  title: string;
  subtitle?: string;
  color: string;
}

interface ToastCtx {
  toasts: Toast[];
  show: (icon: string, title: string, subtitle?: string, color?: string) => void;
}

const ToastContext = createContext<ToastCtx | null>(null);
let toastId = 0;

export function useToast() { return useContext(ToastContext)!; }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((icon: string, title: string, subtitle?: string, color = 'bg-gold-500') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, icon, title, subtitle, color }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  // Écoute les toasts émis par le gestionnaire de notifications (lib/notifications.ts)
  useEffect(() => {
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<{ icon: string; title: string; subtitle?: string; color?: string }>).detail;
      if (detail) show(detail.icon, detail.title, detail.subtitle, detail.color);
    };
    window.addEventListener('nour:toast', onToast);
    return () => window.removeEventListener('nour:toast', onToast);
  }, [show]);

  return (
    <ToastContext.Provider value={{ toasts, show }}>
      {children}
      <div className="toast-stack fixed bottom-24 right-4 z-50 flex flex-col gap-2 lg:bottom-6">
        {toasts.map(t => (
          <div key={t.id} className={`animate-fade-in flex items-center gap-3 rounded-2xl ${t.color} px-4 py-3 text-night-950 shadow-xl`}>
            <span className="text-2xl">{t.icon}</span>
            <div>
              <p className="text-sm font-bold">{t.title}</p>
              {t.subtitle && <p className="text-xs opacity-80">{t.subtitle}</p>}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
