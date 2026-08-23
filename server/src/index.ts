import { app } from './app.js';
import { config } from './config.js';
import { cleanupAnonymousProfiles } from './auth.js';

// Purge periodique des profils fantomes inactifs : aucune accumulation en base.
// (declenchee aussi a chaque creation de fantome dans /api/auth/anonymous)
cleanupAnonymousProfiles();
setInterval(() => cleanupAnonymousProfiles(), 6 * 60 * 60 * 1000);

app.listen(config.port, () => {
  console.log(`Nour - serveur démarré sur http://localhost:${config.port}`);
});
