# Déployer Nour gratuitement

Cette procédure publie Nour sur une URL gratuite Render, par exemple `https://nour.onrender.com`, avec Neon PostgreSQL pour conserver les comptes et les données.

## Ce qui reste gratuit

- **Render Free** héberge le serveur Express et le frontend compilé. Le service peut s'endormir après une période sans trafic ; le premier chargement suivant peut prendre quelques secondes.
- Le service actuel reste dans sa région Render existante. Pour réduire la latence avec Neon US, il faudrait créer un nouveau service Render en région **Ohio** ; Render ne permet pas de déplacer une instance existante.
- **Neon Free** héberge la base PostgreSQL persistante.
- **OpenRouter** est utilisé avec les quotas gratuits disponibles. Chaque utilisateur associe sa propre clé dans son compte Nour ; aucune clé utilisateur n'est envoyée au navigateur ni partagée avec un autre compte.
- L'URL `onrender.com` est fournie gratuitement. Un domaine personnalisé n'est pas nécessaire pour être indexé par Google.

## Préparer Neon

1. Ouvrir [neon.tech](https://neon.tech) et créer un compte gratuit.
2. Créer un projet PostgreSQL, par exemple `nour`.
3. Dans **Connect**, choisir `Node.js` et copier la chaîne `DATABASE_URL` complète.
4. Garder `sslmode=require` dans cette chaîne. Ne jamais publier cette valeur dans GitHub, le navigateur ou une capture d'écran.

Le serveur crée automatiquement les tables et les index au premier démarrage. Il n'est pas nécessaire d'exécuter une migration manuelle.

## Publier sur Render

1. Mettre le projet sur un dépôt GitHub privé ou public.
2. Ouvrir [dashboard.render.com](https://dashboard.render.com), puis **New > Blueprint**.
3. Sélectionner le dépôt. Render détecte `render.yaml`.
4. Choisir le plan **Free**.
5. Renseigner les variables demandées :

| Variable | Valeur |
| --- | --- |
| `DATABASE_URL` | La chaîne Neon complète avec `sslmode=require` |
| `SITE_URL` | L'URL Render attribuée au service, par exemple `https://nour.onrender.com` |
| `CORS_ORIGIN` | La même URL Render, sans slash final |
| `OPENROUTER_MODEL` | `openrouter/free` |

6. Cliquer sur **Apply** et attendre la fin du build.
7. Ouvrir `https://<nom-du-service>.onrender.com/api/health`. La réponse doit contenir `"ok":true`.
8. Ouvrir l'URL publique, vérifier l'inscription, la création du profil fantôme, une prière, une quête et l'ouverture du Coran.

Le build utilisé par Render est `npm ci --include=dev && npm run build` et le démarrage est `npm start`. Le serveur sert l'API et `client/dist` sur le même domaine.

## Vérification des données

Après avoir créé un compte réel, vérifier :

1. Se déconnecter puis constater qu'un profil temporaire séparé est créé.
2. Se reconnecter avec le compte réel et vérifier que son historique et ses prières reviennent.
3. Configurer une clé OpenRouter sur ce compte ; le chat doit fonctionner.
4. Créer un second compte ou utiliser un autre navigateur ; il ne doit pas voir la clé, les conversations ou les données du premier compte.
5. Redémarrer le service Render depuis le tableau de bord ; les données Neon doivent rester présentes.

Neon est la source persistante. Ne pas remplacer `DATABASE_URL` par SQLite sur Render : le disque d'un service gratuit peut être éphémère.

## Google Search Console

1. Ouvrir [Google Search Console](https://search.google.com/search-console).
2. Ajouter la propriété avec l'URL exacte Render, par exemple `https://nour.onrender.com`.
3. Choisir la validation par balise HTML ou par DNS selon l'option proposée.
4. Dans **Sitemaps**, soumettre `sitemap.xml`.
5. Dans **Inspection de l'URL**, tester l'accueil puis demander l'indexation.
6. Vérifier ensuite les rapports de couverture et d'expérience.

Les URLs publiques prévues sont `/`, `/quran` et `/prayer`. Les pages `/chat`, `/quests`, `/profile` et `/api/` sont exclues du sitemap ou des robots car elles dépendent d'un compte ou d'une session.

L'indexation n'est pas immédiate : Google peut prendre plusieurs jours ou semaines, surtout pour un nouveau domaine. L'URL gratuite Render est techniquement indexable ; acheter un domaine n'est pas obligatoire.

## Variables locales

Copier `.env.example` vers `.env`. En local, laisser `DATABASE_URL` vide pour utiliser SQLite. Pour tester Neon localement, renseigner uniquement une base de test et ne jamais utiliser une base de production.

Commandes utiles :

```bash
npm ci
npm run typecheck
npm test
npm run build
npm start
```

## Dépannage

- **Erreur Node ou `node:sqlite`** : utiliser Node `22.5.0` ou plus récent.
- **Chargement lent après veille** : c'est le comportement du plan Render Free. Le shell local est mis en cache après la première visite. Pour aligner le serveur avec Neon US, créer un nouveau service en région Ohio ; Render ne déplace pas le service existant.
- **Page blanche après déploiement** : vérifier que le build a bien produit `client/dist` et que le service démarre avec `npm start`.
- **404 sur `/quran`** : vérifier que le service utilise bien la dernière version et que le fallback SPA Express est actif.
- **Erreur de base au démarrage** : vérifier `DATABASE_URL`, le mot de passe Neon et `sslmode=require`.
- **CORS en local** : définir `CORS_ORIGIN=http://localhost:5173`. En production, utiliser exactement l'URL Render sans slash final.
- **Ancienne interface en cache** : recharger avec Ctrl+F5 ; le service worker est versionné et `index.html` est envoyé sans cache.
