/**
 * Modèle par défaut de l'assistant Nour.
 *
 * IMPORTANT : on utilise un modèle INSTRUCT fixe (non-raisonneur) et non le
 * routeur « openrouter/free » qui choisit un modèle AU HASARD parmi tous les
 * modèles gratuits — dont des modèles de raisonnement (DeepSeek R1, etc.)
 * qui écrivent leur réflexion interne en anglais avant la réponse.
 *
 * minimax/minimax-m3:free :
 *  - gratuit (20 req/min, 200 req/jour)
 *  - NON-raisonneur : répond directement dans la langue de l'utilisateur
 *  - rapide et excellent en multilingue (français, anglais, arabe)
 */
export const DEFAULT_MODEL = 'minimax/minimax-m3:free';

/**
 * Nom d'affichage du modèle par défaut (liste des réglages).
 * Utilisé quand la liste des modèles n'est pas chargée (hors ligne).
 */
export const DEFAULT_MODEL_LABEL = 'MiniMax M3 (rapide — recommandé)';

/** Routeur automatique : reste disponible en option, mais plus par défaut. */
export const FREE_ROUTER_MODEL = 'openrouter/free';
