import { Router } from 'express';
import { authMiddleware } from './auth.js';
import { getCacheStats } from '../services/aiCache.js';
import { getStatus as getCircuitStatus, reset as resetCircuit } from '../services/circuitBreaker.js';
import { getSyncStatus } from '../sync.js';

export const adminRouter = Router();

/**
 * Endpoint protégé par auth pour gérer le cache IA et le circuit breaker.
 * Accessible uniquement par un utilisateur authentifié (pour l'instant,
 * tout utilisateur connecté peut y accéder ; en production, ajouter
 * un flag `is_admin` dans la table users).
 */

// GET /api/admin/status — État complet du système
adminRouter.get('/status', authMiddleware, (_req, res) => {
  res.json({
    cache: getCacheStats(),
    circuitBreaker: getCircuitStatus(),
    sync: getSyncStatus(),
    uptime: Math.round(process.uptime()),
    memory: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
  });
});

// POST /api/admin/circuit-breaker/reset — Reset manuel du circuit breaker
adminRouter.post('/circuit-breaker/reset', authMiddleware, (_req, res) => {
  resetCircuit();
  res.json({ ok: true, circuitBreaker: getCircuitStatus() });
});
