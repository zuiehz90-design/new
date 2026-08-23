// Filtre de base côté serveur. Il ne remplace pas une vraie modération :
// l'IA (prompt système) refuse également les contenus inappropriés.
const BLOCKED_TERMS = [
  'connard', 'connasse', 'salope', 'enculé', 'enfoiré', 'ntm',
  'fdp', 'bâtard', 'chienne', 'abruti', 'crétin', 'nique ta mère',
  'nique ta mere', 'pute', 'saloperie',
];

export function moderateContent(text: string): string | null {
  if (typeof text !== 'string') return 'Message invalide.';
  const trimmed = text.trim();
  if (trimmed.length === 0) return 'Message vide.';
  if (trimmed.length > 4000) return 'Message trop long (4000 caractères maximum).';
  const lower = trimmed.toLowerCase();
  for (const term of BLOCKED_TERMS) {
    if (lower.includes(term)) return 'Message inapproprié détecté.';
  }
  const links = (trimmed.match(/https?:\/\//g) ?? []).length;
  if (links > 5) return 'Trop de liens dans le message.';
  if (/(.)\1{11,}/.test(trimmed)) return 'Message répétitif détecté.';
  return null;
}
