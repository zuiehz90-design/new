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
}

const win = window as typeof window & { nourDesktop?: NourDesktop };

/** true si l'app tourne dans Electron (app desktop native) */
export const isDesktop = !!win.nourDesktop?.isDesktop;

/** API desktop sécurisée, null si mode web */
export const desktop: NourDesktop | null = win.nourDesktop ?? null;