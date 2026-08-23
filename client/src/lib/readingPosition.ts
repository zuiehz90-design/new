/**
 * Position de lecture : conserve le verset le plus avancé.
 *
 * La position sauvegardée représente « où j'ai arrêté de lire ». Remonter
 * dans la sourate (pour relire un verset, vérifier le début, etc.) ne doit
 * jamais écraser cette position : on garde le verset le plus profond atteint.
 */
export function nextReadingVerse(current: number | undefined, candidate: number): number {
  return current == null || candidate >= current ? candidate : current;
}
