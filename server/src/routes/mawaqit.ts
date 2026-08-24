import { Router } from 'express';
import { searchMosques, calculateTimes, METHODS, DEFAULT_METHOD } from '../mawaqit.js';

export const mawaqitRouter = Router();

/**
 * Recherche des mosquées par mot-clé (publique, pas d'auth).
 * GET /api/mawaqit/search?q=cergy
 */
mawaqitRouter.get('/search', async (req: any, res) => {
  const q = (req.query.q as string)?.trim() ?? '';
  if (q.length < 2) return res.json({ mosques: [] });
  try {
    const mosques = await searchMosques(q);
    res.json({ mosques });
  } catch (err) {
    console.error('[mawaqit] search error:', (err as Error).message);
    res.status(502).json({ error: 'Recherche de mosquée indisponible. Réessayez plus tard.' });
  }
});

/**
 * Calcule les horaires de prière à partir de coordonnées GPS + méthode.
 * GET /api/mawaqit/times?lat=49.05&lon=2.02&method=uoif&date=2026-08-24
 */
mawaqitRouter.get('/times', (req: any, res) => {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);
  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: 'Paramètres lat et lon requis.' });
  }
  const method = (req.query.method as string)?.trim() || DEFAULT_METHOD;
  const dateStr = (req.query.date as string)?.trim() || new Date().toISOString().slice(0, 10);

  try {
    const times = calculateTimes(lat, lon, dateStr, method);
    res.json({ times });
  } catch (err) {
    console.error('[mawaqit] times error:', (err as Error).message);
    res.status(500).json({ error: 'Erreur lors du calcul des horaires.' });
  }
});

/**
 * Liste des méthodes de calcul disponibles.
 * GET /api/mawaqit/methods
 */
mawaqitRouter.get('/methods', (_req, res) => {
  const list = Object.entries(METHODS).map(([id, cfg]) => ({ id, label: cfg.label }));
  res.json({ methods: list, default: DEFAULT_METHOD });
});