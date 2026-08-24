import { Router } from 'express';
import { searchMosques, getMosqueInfo, getPrayerTimes } from '../mawaqit.js';
import { authMiddleware as auth } from './auth.js';

export const mawaqitRouter = Router();

/**
 * Recherche des mosquées par mot-clé.
 * GET /api/mawaqit/search?q=cergy
 */
mawaqitRouter.get('/search', auth, async (req: any, res) => {
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
 * Infos d'une mosquée.
 * GET /api/mawaqit/mosque/:id
 */
mawaqitRouter.get('/mosque/:id', auth, async (req: any, res) => {
  try {
    const info = await getMosqueInfo(req.params.id);
    res.json({ mosque: info });
  } catch (err) {
    console.error('[mawaqit] mosque info error:', (err as Error).message);
    res.status(502).json({ error: 'Informations de la mosquée indisponibles.' });
  }
});

/**
 * Horaires de prière du jour.
 * GET /api/mawaqit/mosque/:id/times
 */
mawaqitRouter.get('/mosque/:id/times', auth, async (req: any, res) => {
  try {
    const times = await getPrayerTimes(req.params.id);
    res.json({ times });
  } catch (err) {
    console.error('[mawaqit] prayer times error:', (err as Error).message);
    res.status(502).json({ error: 'Horaires de prière indisponibles. Réessayez plus tard.' });
  }
});