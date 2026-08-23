// Modération légère côté client : le serveur applique des règles similaires,
// et le prompt système de l'IA refuse les contenus inappropriés.
const BLOCKED = [
  'connard', 'connasse', 'salope', 'enculé', 'enfoiré', 'ntm',
  'fdp', 'bâtard', 'chienne', 'abruti', 'crétin', 'pute',
  'nique ta mère', 'nique ta mere', 'saloperie',
];

export interface ModerationResult {
  blocked: boolean;
  reason?: string;
}

export function moderate(text: string): ModerationResult {
  if (!text.trim()) return { blocked: true, reason: 'EMPTY' };
  if (text.length > 3000) return { blocked: true, reason: 'LONG' };
  const lower = text.toLowerCase();
  for (const w of BLOCKED) {
    if (lower.includes(w)) return { blocked: true, reason: 'PROFANITY' };
  }
  const links = (text.match(/https?:\/\//g) ?? []).length;
  if (links > 4) return { blocked: true, reason: 'LINKS' };
  if (/(.)\1{9,}/.test(text)) return { blocked: true, reason: 'SPAM' };
  return { blocked: false };
}

export const MODERATION_REASONS: Record<string, string> = {
  EMPTY: 'Le message est vide.',
  LONG: 'Le message est trop long (3000 caractères maximum).',
  PROFANITY: 'Veuillez rester respectueux : ce langage n\'est pas accepté.',
  LINKS: 'Trop de liens dans le message.',
  SPAM: 'Message répétitif détecté.',
};
