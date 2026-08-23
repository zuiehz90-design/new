/**
 * Séparation stricte des données locales entre le mode invité et chaque compte.
 * Conversations, position de lecture et localisation sont rangées sous une clé
 * propre à l'identité courante (guest ou u{userId}) — aucun appareil partagé
 * ne peut voir les données d'une autre personne.
 */

const LEGACY_SUFFIXES = ['conversations', 'activeChat', 'readingPositions', 'coords'] as const;

export const MIGRATION_FLAG = 'nour:migrated:v1';

/** Clé de stockage locale propre à une identité (guest ou u{id}). */
export function storageKey(scope: string, suffix: string): string {
  return `nour:${scope}:${suffix}`;
}

function legacyKey(suffix: string): string {
  return `nour:${suffix}`;
}

function pendingKey(suffix: string): string {
  return `nour:pending:${suffix}`;
}

/**
 * Migration unique : les anciennes clés non scopées (« nour:conversations », …)
 * sont mises de côté dans un bac « pending », jamais exposé au mode invité.
 * Elles seront attribuées au premier compte connecté via claimPendingData.
 */
export function migrateLegacyData(): void {
  if (localStorage.getItem(MIGRATION_FLAG)) return;
  for (const suffix of LEGACY_SUFFIXES) {
    const raw = localStorage.getItem(legacyKey(suffix));
    if (raw == null) continue;
    if (localStorage.getItem(pendingKey(suffix)) == null) {
      localStorage.setItem(pendingKey(suffix), raw);
    }
    localStorage.removeItem(legacyKey(suffix));
  }
  localStorage.setItem(MIGRATION_FLAG, '1');
}

/** Attribue le bac « pending » (anciennes données) au compte qui se connecte. */
export function claimPendingData(userId: number): void {
  for (const suffix of LEGACY_SUFFIXES) {
    const raw = localStorage.getItem(pendingKey(suffix));
    if (raw == null) continue;
    const target = storageKey(`u${userId}`, suffix);
    if (localStorage.getItem(target) == null) {
      localStorage.setItem(target, raw);
    }
    localStorage.removeItem(pendingKey(suffix));
  }
}
