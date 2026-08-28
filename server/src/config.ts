// Charge .env (racine du projet) au démarrage : sans cela, les clés API
// (OPENROUTER_API_KEY, DATABASE_URL…) ne sont jamais lues.
try {
  process.loadEnvFile();
} catch {
  /* .env absent — on continue avec les variables d'environnement du système */
}

import { DEFAULT_MODEL } from './modelDefaults.js';

const siteUrl = (process.env.SITE_URL ?? '').trim().replace(/\/+$/, '');

export const config = {
  /** Clé OpenRouter du serveur (fallback) : tous les comptes peuvent utiliser l’IA sans configurer leur propre clé. */
  openRouterApiKey: (process.env.OPENROUTER_API_KEY ?? '').trim() || null,
  // Défaut : modèle instruct fixe et rapide (non-raisonneur). Le routeur
  // « openrouter/free » choisit des modèles au hasard, dont des reasoning
  // models — à éviter comme défaut.
  openRouterModel: process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL,
  port: Number(process.env.PORT) || 3001,
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  siteUrl,
  isVercel: Boolean(process.env.VERCEL),
};
