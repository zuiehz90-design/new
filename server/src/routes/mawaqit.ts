import { Router } from 'express';
import { searchMosques, getPrayerTimes } from '../mawaqit.js';

export const mawaqitRouter = Router();

/**
 * Recherche des mosquées par mot-clé (publique, aucune auth).
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
 * Horaires officiels du jour d'une mosquée (scrapés sur mawaqit.net).
 * GET /api/mawaqit/mosque/:id/times
 *   :id = slug (ex. "gm-cergy") ou uuid.
 */
mawaqitRouter.get('/mosque/:id/times', async (req: any, res) => {
  try {
    const times = await getPrayerTimes(req.params.id);
    res.json({ times });
  } catch (err) {
    const message = (err as Error).message;
    console.error('[mawaqit] times error:', message);
    const status = message.includes('introuvable') ? 404 : 502;
    res.status(status).json({ error: message });
  }
});
