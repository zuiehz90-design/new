/**
 * Filtre anti-raisonnement (côté serveur).
 *
 * Certains modèles écrivent leur réflexion interne (« Je vais répondre... »,
 * « L'utilisateur demande... », « Je dois restructurer... ») avant ou pendant
 * leur réponse. Ce filtre détecte ces paragraphes et les retire du flux SSE.
 */

const THINKING_PATTERNS = /\b(okay|alright|let me|i need to|i should|i will|i'll|i can|i think|i'm|the user|user just said|user asked|let's|to be|check if|remember|to be safe|so maybe|to answer|actually|hmm|first,|wait,|maybe|to avoid|to keep|to make|to cover|to structure|recall|guidelines|instruction|l'utilisateur|l'utilisateur me demande|mon objectif|je dois répondre|je dois fournir|je dois compléter|je dois reprendre|je dois faire attention|je dois donc|je dois structurer|je dois m'assurer|je dois vérifier|je dois rester|je dois ajouter|je dois couvrir|je dois expliquer|je vais répondre|je vais structurer|je vais restructurer|je vais utiliser|je vais ajouter|je vais couvrir|je vais fournir|je vais commencer|je vais donc|je vais maintenant|je vais faire attention|je vais m'assurer|je vais vérifier|je vais expliquer|je vais présenter|je vais donner|je vais conclure|je vais terminer|il faut que je|il est nécessaire|il est important|ce qui a été coupé|ma réponse précédente|la réponse précédente|compléter ma réponse|finir ce qui a été coupé|ajouter d'autres aspects|repose la même question|repose la question|reprend la question|reprendre la question|aspects importants non couverts|aspects non couverts|non couverts|pas eu le temps de couvrir|je n'ai pas eu le temps|je n'ai pas encore|je dois donc compléter|en résumé|pour résumer|en conclusion|pour conclure|pour répondre à cette question|afin de répondre|comme un agent|je dois être clair|je dois être précis|je dois rester concis|je dois citer|je vais citer|je dois m'appuyer|je vais m'appuyer|je dois me baser|je vais me baser|je dois vérifier l'authenticité|ne pas inventer|je peux utiliser en toute confiance|je vais restructurer ma réponse|je dois structurer ma réponse|je dois inclure|je vais inclure|je dois mentionner|je vais mentionner|je dois parler|je vais parler|je dois aborder|je vais aborder|je dois détailler|je vais détailler|je dois développer|je vais développer|je dois présenter|je vais présenter|je dois donner|je vais donner|je dois terminer|je vais terminer|je dois conclure|je vais conclure)\b/i;

/** Débuts de phrase typiques d'une planification interne (« Je dois... », « Je vais... »). */
const PLAN_STARTS = /\b(je dois|je vais|je vais devoir|je dois absolument|je dois aussi|je dois maintenant|je dois à présent|je dois d'abord|je dois tout d'abord|je vais d'abord|je vais aussi|je vais donc|je vais maintenant|je vais tout d'abord|je vais ensuite|je vais enfin|je vais à présent|mon objectif|mon but|je me propose|je vais essayer|je dois essayer|je vais tenter|je dois tenter)\b/i;

/** Verbes « méta » : l'action porte sur la rédaction de la réponse elle-même. */
const META_VERBS = /\b(répondre|repondre|fournir|compléter|structurer|restructurer|m'assurer|vérifier|ajouter|couvrir|expliquer|présenter|donner|conclure|terminer|utiliser|inclure|mentionner|parler|aborder|détailler|développer|citer|m'appuyer|me baser|faire attention|finir|résumer|organiser|planifier|récapituler|décrire|illustrer|reprendre|commencer|essayer|tenter|être clair|être précis|rester concis)\b/i;

/**
 * Détecte si un paragraphe ressemble à du raisonnement interne : soit une
 * phrase précise listée dans THINKING_PATTERNS, soit un début de planification
 * (« Je dois... », « Je vais... ») suivi d'un verbe « méta ».
 */
export function isThinkingParagraph(text: string): boolean {
  if (THINKING_PATTERNS.test(text)) return true;
  return PLAN_STARTS.test(text) && META_VERBS.test(text);
}

/**
 * Filtre de flux : accumule le buffer, découpe en paragraphes et ne renvoie
 * que les paragraphes « réponse ». Le préambule de raisonnement (avant la
 * première vraie réponse) est entièrement supprimé, tout comme les
 * paragraphes de raisonnement qui apparaissent au milieu de la réponse.
 */
export class ThinkingStreamFilter {
  private buffer = '';
  private started = false;

  push(chunk: string): string {
    this.buffer += chunk;
    let out = '';
    const parts = this.buffer.split(/\n{2,}/);
    this.buffer = parts.pop() ?? '';
    for (const part of parts) {
      const p = part.trim();
      if (!p) continue;
      if (!this.started && isThinkingParagraph(p)) continue;
      this.started = true;
      if (isThinkingParagraph(p)) continue;
      out += p + '\n\n';
    }
    return out;
  }

  /** Libère le contenu restant en fin de flux. */
  flush(): string {
    const rest = this.buffer.trim();
    this.buffer = '';
    if (!rest) return '';
    if (!this.started && isThinkingParagraph(rest)) return '';
    this.started = true;
    return isThinkingParagraph(rest) ? '' : rest;
  }
}
