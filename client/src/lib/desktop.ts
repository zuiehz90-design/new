/**
 * Détection du mode desktop (Electron).
 * window.nourDesktop est exposé par le preload d'Electron.
 */
export interface NourDesktop {
  isDesktop: boolean;
  getUserDataPath: () => Promise<string>;
  saveFile: (name: string, content: string) => Promise<boolean>;
  openFile: (path: string) => Promise<void>;
  getDbPath: () => Promise<string>;
  getVersion: () => Promise<string>;
  getDatabaseUrl: () => Promise<string>;
  showNotification: (opts: { title: string; body: string; clickUrl?: string }) => Promise<boolean>;
}

const win = window as typeof window & { nourDesktop?: NourDesktop };

/** true si l'app tourne dans Electron (app desktop native) */
export const isDesktop = !!win.nourDesktop?.isDesktop;

/** API desktop sécurisée, null si mode web */
export const desktop: NourDesktop | null = win.nourDesktop ?? null;

/** Vérifie si l'app desktop est connectée à la base en ligne */

/** Envoie une notification native via le desktop.
 *  Sur le web, utilise l'API Notification standard. */
export async function notify(opts: { title: string; body: string; clickUrl?: string }): Promise<void> {
  if (desktop) {
    await desktop.showNotification(opts);
  } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification(opts.title, { body: opts.body });
  } else if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      new Notification(opts.title, { body: opts.body });
    }
  }
}

export async function isDesktopOnline(): Promise<boolean> {
  if (!desktop) return false;
  try {
    const url = await desktop.getDatabaseUrl();
    return !!url;
  } catch {
    return false;
  }
}