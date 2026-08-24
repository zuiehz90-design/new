import { app } from './app.js';
import { config } from './config.js';
import { cleanupAnonymousProfiles } from './auth.js';
import { startSync, stopSync } from './sync.js';

app.listen(config.port, () => {
  console.log(`Nour - serveur démarré sur http://localhost:${config.port}`);
});

// La purge ne doit pas bloquer le premier affichage ni la création du profil.
// Elle s'exécute après le démarrage puis toutes les six heures.
setTimeout(() => cleanupAnonymousProfiles(), 10_000);
setInterval(() => cleanupAnonymousProfiles(), 6 * 60 * 60 * 1000);

// Desktop sync: push/pull SQLite <-> Neon when ENABLE_SYNC is set
if (process.env.ENABLE_SYNC === 'true' && process.env.DATABASE_URL) {
  startSync(process.env.DATABASE_URL).catch(e => console.error('[sync] Failed:', e.message));
  process.on('SIGTERM', () => stopSync());
  process.on('SIGINT', () => stopSync());
}
