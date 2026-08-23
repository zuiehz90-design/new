import type { Conversation } from './types';

export type SyncDecision = 'download' | 'upload' | 'none';

/**
 * Décide du sens de synchronisation entre les données locales (appareil)
 * et le serveur (compte) : le dernier écrit gagne, comparé par updatedAt.
 */
export function decideSync(local: Conversation[], server: Conversation[]): SyncDecision {
  if (local.length === 0 && server.length === 0) return 'none';
  const localMax = local.reduce((m, c) => Math.max(m, c.updatedAt), 0);
  const serverMax = server.reduce((m, c) => Math.max(m, c.updatedAt), 0);
  if (serverMax > localMax) return 'download';
  if (localMax > serverMax) return 'upload';
  return 'none';
}
