/** Noms des profils fantomes : module pur (aucune dependance DB). */

/** Duree de conservation d'un profil fantome sans activite (en jours). */
export const ANONYMOUS_MAX_AGE_DAYS = 7;

/** Genere un nom de fantome unique, ex. « Invite-4F2A ». */
export function randomAnonymousName(isTaken: (name: string) => boolean): string {
  for (let i = 0; i < 20; i++) {
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const name = 'Invité-' + suffix;
    if (!isTaken(name)) return name;
  }
  return 'Invité-' + Date.now().toString(36).toUpperCase();
}
