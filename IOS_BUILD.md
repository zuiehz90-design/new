# Build Nour iOS

## Prérequis (sur Mac)

- macOS 13+ (Ventura ou plus récent)
- Xcode 15+ (depuis le Mac App Store)
- CocoaPods (`gem install cocoapods`) ou Swift Package Manager (recommandé)
- Node.js 22+
- Apple Developer Account (gratuit suffit pour le dev local, payant pour l'App Store)

## Étapes de build

### 1. Build web (sur ta machine actuelle ou sur Mac)

```bash
npm run build
```

### 2. Synchroniser les assets web vers iOS

```bash
npx cap sync ios
```

Cela copie le `client/dist` vers le projet Xcode et met à jour les plugins.

### 3. Ouvrir dans Xcode (sur Mac)

```bash
npx cap open ios
```

Ou ouvre directement `ios/App/App.xcodeproj` dans Xcode.

### 4. Configurer la signature

Dans Xcode :
1. Sélectionne le projet **App** dans le navigator
2. Onglet **Signing & Capabilities**
3. Coche **Automatically manage signing**
4. Sélectionne ton **Team** (Apple Developer account)
5. Modifie le **Bundle Identifier** si nécessaire (ex: `com.toncompte.nour`)

### 5. Build & run sur simulateur

Dans Xcode :
1. Sélectionne un **iPhone Simulator** (ex: iPhone 15 Pro)
2. Cmd + R pour build & lancer

### 6. Build pour l'App Store

Dans Xcode :
1. **Product → Archive**
2. **Distribute App → App Store Connect**
3. Follow the upload wizard

## Architecture

### Modèle offline-first (identique au desktop)

```
iOS App → SQLite local (rapide) → sync 30s → Neon (cloud)
                                  ← pull 2min ←
```

- **SQLite local** : `@capacitor-community/sqlite` pour les lectures/écritures rapides
- **Sync arrière-plan** : le même `server/src/sync.ts` tourne côté serveur
- **DATABASE_URL** : configurée automatiquement (hardcodée dans le code, modifiable via les settings)
- **Notifications** : `@capacitor/local-notifications` pour les rappels de prière

### Plugins natifs utilisés

| Plugin | Usage |
|--------|-------|
| `@capacitor-community/sqlite` | Cache SQLite local pour les données offline |
| `@capacitor/local-notifications` | Notifications de prière dans le centre de notifications iOS |
| `@capacitor/core` (Preferences) | Stockage sécurisé de la DATABASE_URL |

### Fichiers créés/modifiés

| Fichier | Description |
|---------|-------------|
| `capacitor.config.ts` | Config Capacitor (appId, webDir, plugins) |
| `client/src/lib/capacitor.ts` | Adapter iOS : SQLite, notifications, préférences |
| `client/src/lib/desktop.ts` | Détection Capacitor + notify() iOS |
| `ios/` | Projet Xcode généré par Capacitor |

## Mode dev (hot reload)

Pour tester avec le serveur Vite en dev :

1. Modifie `capacitor.config.ts` : décommente `url` avec l'IP locale de ton Mac
2. Lance `npm run dev:client` sur le Mac
3. Dans Xcode, sélectionne le simulateur et Cmd+R

## Communication avec le serveur

L'app iOS appelle le serveur Express sur Render (`https://nour-ydnz.onrender.com/api/...`) pour :
- Authentification / profil
- Sync SQLite ↔ Neon
- Recherche de mosquée (mawaqit)
- Chat IA

Les données lues sont cachées en SQLite local pour des lectures instantanées.

## Notes importantes

- **Ne pas committer** le dossier `ios/` — il sera régénéré par `npx cap sync ios`
- Le build iOS doit toujours se faire sur un **Mac avec Xcode**
- La première compilation prend 30-60 secondes (compilation Swift)
- Les builds suivants sont beaucoup plus rapides (incrémenteux)
