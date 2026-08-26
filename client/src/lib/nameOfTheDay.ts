import { NAMES_99, type Name99 } from './names99';

/**
 * Seed stable par jour : change à minuit (UTC), identique toute la journée
 * et pour tous les utilisateurs — le rituel quotidien est partagé.
 */
export function daySeed(now: Date = new Date()): number {
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000);
}

/** Le Nom du jour, choisi de façon déterministe (1 des 99, tourne chaque jour). */
export function nameOfTheDay(seed: number = daySeed(), total: number = NAMES_99.length): Name99 {
  // seed peut être négatif si l'on remonte avant 1970 ; garde un index valide.
  const idx = ((seed % total) + total) % total;
  return NAMES_99[idx];
}

/** Méditation associée : une courte invitation à pratiquer le dhikr du Nom. */
export function meditationFor(name: Name99, days: number = daySeed()): string {
  const cycle = days % 3;
  if (cycle === 0) {
    return `Récite « ${name.transliteration} » en dhikr pour imprégner ton cœur de cette signification.`;
  }
  if (cycle === 1) {
    return `Médite sur la signification de « ${name.transliteration} » : ${name.translation.toLowerCase()}.`;
  }
  return `Demande à Allah par ce Nom aujourd'hui : « Ô ${name.transliteration} », et laisse cette lumière guider tes actions.`;
}
