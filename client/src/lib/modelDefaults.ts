/**
 * Modèle par défaut de l'assistant Nour (côté client).
 * Doit correspondre à server/src/modelDefaults.ts.
 *
 * On évite « openrouter/free » comme défaut : c'est un routeur qui choisit un
 * modèle au hasard, dont des reasoning models qui écrivent leur réflexion en
 * anglais. On préfère un modèle instruct fixe, rapide et non-raisonneur.
 */
export const DEFAULT_MODEL = 'minimax/minimax-m3:free';
export const DEFAULT_MODEL_LABEL = 'Llama 3.1 8B (rapide — recommandé)';
export const FREE_ROUTER_MODEL = 'openrouter/free';
