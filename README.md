# Nour — Chat islamique

Nour est une application web gratuite pour lire le Coran, consulter les horaires de prière, suivre ses prières et poser des questions islamiques avec des réponses sourcées.

## Fonctionnalités

- Chat IA avec rendu Markdown, tableaux et sources cliquables.
- Lecture du Coran, recherche, traduction, tafsir et audio.
- Horaires de prière par position, ville ou coordonnées manuelles.
- Comptes sans adresse e-mail obligatoire, profils anonymes temporaires et séparation stricte des données.
- Prières, streaks, quêtes vérifiées, badges à niveaux et rangs façon jeu vidéo.
- Interface française, anglaise et arabe, mode sombre et clair, PWA et fonctionnement hors ligne du Coran déjà chargé.
- Application gratuite et sans publicité.

## Stack

- Frontend : React 18, TypeScript, Vite, Tailwind CSS.
- Backend : Node.js 22.5+, Express, TypeScript.
- Base locale : SQLite via `node:sqlite`.
- Base production : PostgreSQL Neon via `DATABASE_URL`.
- IA : OpenRouter ; chaque compte peut enregistrer sa propre clé, stockée côté serveur.
- Déploiement : Render Free avec serveur Express unique.

## Lancer en local

Prérequis : Node.js `22.5.0` ou plus récent.

```bash
npm ci
cp .env.example .env
npm run dev
```

Le frontend est disponible sur `http://localhost:5173` et l'API sur `http://localhost:3001`.

Pour tester le mode production local :

```bash
npm run build
npm start
```

L'application est alors servie sur `http://localhost:3001`.

Sous Windows, `lancer.bat` réalise les vérifications et lance le serveur de production.

## IA par compte

La clé OpenRouter n'est pas une variable publique obligatoire. L'utilisateur ouvre les réglages de Nour, suit les étapes vers [openrouter.ai/keys](https://openrouter.ai/keys), puis enregistre sa clé sur son compte. La clé n'est jamais renvoyée au navigateur et n'est jamais utilisée pour un autre compte.

Les modèles `:free` et `openrouter/free` restent soumis aux quotas gratuits d'OpenRouter. Sans clé, le Coran, les prières et les fonctions locales restent utilisables, mais le chat IA est désactivé.

## Déploiement gratuit et Google

Le chemin recommandé est **Render Free + Neon Free** :

1. Pousser le projet sur GitHub.
2. Créer une base PostgreSQL gratuite sur Neon et copier sa `DATABASE_URL`.
3. Créer un Blueprint Render depuis le dépôt ; `render.yaml` contient le build, le démarrage et le health check.
4. Renseigner `DATABASE_URL`, `SITE_URL` et `CORS_ORIGIN` avec l'URL gratuite Render.
5. Vérifier `https://<service>.onrender.com/api/health`.
6. Ajouter cette URL dans Google Search Console et soumettre `/sitemap.xml`.

Le serveur Express sert l'API et le frontend sur le même domaine. Les comptes et les streaks restent persistants dans Neon. Le plan Render Free peut mettre le service en veille après inactivité ; le réveil peut prendre quelques secondes.

La procédure détaillée se trouve dans [DEPLOYMENT.md](DEPLOYMENT.md).

## Variables d'environnement

| Variable | Usage |
| --- | --- |
| `DATABASE_URL` | PostgreSQL Neon en production ; vide en local pour SQLite |
| `SITE_URL` | URL publique Render utilisée par `robots.txt` et `sitemap.xml` |
| `CORS_ORIGIN` | Origines autorisées, par exemple `http://localhost:5173` ou l'URL Render |
| `OPENROUTER_MODEL` | Modèle par défaut, `openrouter/free` |
| `PORT` | Port Express, fourni par Render en production |

Voir [.env.example](.env.example) pour un exemple complet.

## Sources et avertissements

Le texte et les traductions du Coran proviennent de quran-api, l'audio de everyayah.com et les calculs de prière de adhan-js. L'IA peut se tromper ou citer une source incorrecte : vérifiez toujours les références et consultez un savant qualifié pour les questions importantes. L'application est éducative et ne remplace pas un enseignement religieux.

## Licence

MIT — voir [LICENSE](LICENSE).
