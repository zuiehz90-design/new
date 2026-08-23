import { app } from './app.js';
import { config } from './config.js';
import { cleanupAnonymousProfiles } from './auth.js';

app.listen(config.port, () => {
  console.log(`Nour - serveur démarré sur http://localhost:${config.port}`);
});

// La purge ne doit pas bloquer le premier affichage ni la création du profil.
// Elle s'exécute après le démarrage puis toutes les six heures.
setTimeout(() => cleanupAnonymousProfiles(), 10_000);
setInterval(() => cleanupAnonymousProfiles(), 6 * 60 * 60 * 1000);
