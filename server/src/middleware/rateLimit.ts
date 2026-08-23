import type { NextFunction, Request, Response } from 'express';

const hits = new Map<string, number[]>();

/**
 * Limiteur simple en mémoire (fenêtre glissante) par adresse IP.
 * Suffisant pour une application sans base de données ; en production
 * multi-instances, remplacer par un store partagé (ex. Upstash Redis).
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
