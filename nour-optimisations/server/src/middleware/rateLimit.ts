import type { NextFunction, Request, Response } from 'express';

const hits = new Map<string, number[]>();

/**
 * Limiteur simple en mémoire (fenêtre glissante) par adresse IP.
 * Nettoyage automatique des anciennes entrées toutes les 60 secondes.
 */
export function rateLimit(max: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const now = Date.now();
    const list = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
    if (list.length >= max) {
      res.status(429).json({ error: 'Trop de requêtes. Veuillez patienter un instant.' });
      return;
    }
    list.push(now);
    hits.set(ip, list);
    next();
  };
}

// Nettoyage périodique : supprimer les IPs inactives (> 5 min sans requête)
const CLEANUP_INTERVAL_MS = 60_000;
const INACTIVE_THRESHOLD_MS = 5 * 60_000;

setInterval(() => {
  const now = Date.now();
  for (const [ip, list] of hits) {
    const lastHit = list[list.length - 1] ?? 0;
    if (now - lastHit > INACTIVE_THRESHOLD_MS) {
      hits.delete(ip);
    }
  }
}, CLEANUP_INTERVAL_MS);

/** Statistiques du rate limiter (pour /api/health/metrics) */
export function getRateLimitStats(): { trackedIPs: number } {
  return { trackedIPs: hits.size };
}
