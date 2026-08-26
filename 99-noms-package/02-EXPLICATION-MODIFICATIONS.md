# 📦 Package « Nouveautés des 99 Noms » — Explication détaillée

> Ce document explique **quoi** a été modifié, **pourquoi**, et **comment** l'intégrer dans une autre version.
> Les fichiers sources complets sont dans `sources/` (mêmes chemins que le projet).

---

## Sommaire

1. [Répétition espacée (SRS)](#1-répétition-espacée-srs)
2. [Audio de prononciation](#2-audio-de-prononciation)
3. [Nom du jour](#3-nom-du-jour)
4. [Lien vers le Coran](#4-lien-vers-le-coran)
5. [Défis hebdomadaires](#5-défis-hebdomadaires)
6. [Intégration dans `useDevotion` et `api.ts` (partie 99 Noms)](#6-intégration-dans-usedevotion-et-apit-ss-partie-99-noms)
7. [Traductions ajoutées](#7-traductions-ajoutées)
8. [Vérifications](#8-vérifications)

---

## 1. Répétition espacée (SRS)

**Objectif :** mémorisation durable des 99 Noms — chaque nom est reprogrammé automatiquement selon la performance de l'utilisateur (revoir dans 1 j, 3 j, 7 j, 14 j, 30 j, puis « maîtrisé »).

### Nouveau fichier : `client/src/lib/spacedRepetition.ts`
Moteur **pur et testable** (aucun React) :
- `applyRating(entry, rating)` → calcule le prochain palier selon la notation :
  - **😅 Oublié** (`again`) : redescend d'un palier + compte un échec (`lapses`)
  - **✅ Je le connais** (`good`) : monte d'un palier
  - **🚀 Facile** (`easy`) : monte de deux paliers
- Paliers : `0 → 1j → 3j → 7j → 14j → 30j → maîtrisé (6)`
- `dueNameIndexes(store, count)` → indices des noms dont `dueAt <= maintenant`, triés par échéance
- `masteredCount` / `seenCount` / `nextReviewLabel`
- Type `NamesSrsStore` : `{ [index]: { level, dueAt, reviews, lapses } }`

### Stockage
Par compte, en `localStorage` : clé `storageKey(scope, 'namesSrs')` (via `storageScope.ts`). Migration automatique de l'ancien marqueur « lu » (`nour:names-read`) → palier 1.

### Interface : `client/src/components/NamesView.tsx` (réécrit)
- **Vue Grille** : 99 cartes avec statut (à réviser / 🔁 dans X jours / ✓ maîtrisé) + bouton 🔊
- **Vue Révision** : carte retournable (arabe → traduction), 3 boutons de notation, compteurs « à réviser / en cours / maîtrisés », mode libre 🎲 quand la file est vide, bouton réinitialiser
- **Bug corrigé au passage** : la file de révision sautait un nom à chaque notation (l'incrément de `queueIdx` était conservé alors que le nom noté quitte la file) — corrigé en n'incrémentant **pas** `queueIdx` dans `rate()`.

### Intégration
1. Copier `spacedRepetition.ts` + `spacedRepetition.test.ts`
2. Remplacer `NamesView.tsx`
3. Ajouter les clés `names99.*` (voir §7)

---

## 2. Audio de prononciation

**Objectif :** prononciation correcte — chaque nom est enregistré par un récitateur, avec lecture en boucle.

### Source audio (gratuite, sans clé API)
**islamicapi.com** sert les 99 MP3 en accès public : `https://islamicapi.com/audio/asma-ul-husna/<slug>.mp3` (vérifié : HTTP 200 pour les 99). Aucun coût serveur, lecture directe depuis le client.

### Nouveau fichier : `client/src/hooks/useNameAudio.ts`
- Un **seul objet `Audio` partagé** (évite les chevauchements)
- `play(url)` : toggle lecture/stop si la même URL est en cours
- `toggleLoop()` : répétition en boucle
- État exposé : `playing`, `looping`

### Données : `client/src/lib/names99.ts`
Champ `audio` ajouté aux 99 entrées (ex. `{ ..., audio: 'https://islamicapi.com/audio/asma-ul-husna/rahman.mp3' }`).

### Interface
- Grille : bouton 🔊 sur chaque carte
- Révision : boutons « 🔊 Écouter » et « 🔁 Boucle »

### Intégration
1. Copier `useNameAudio.ts`
2. Remplacer `names99.ts` (contient aussi la liste complète — voir §1) et `NamesView.tsx`
3. Clés : `names99.audioPlay`, `names99.audioLoop`

---

## 3. Nom du jour

**Objectif :** rituel quotidien — un nom mis en avant chaque jour sur l'accueil, avec sa signification, une méditation et l'audio.

### Nouveau fichier : `client/src/lib/nameOfTheDay.ts`
Logique pure :
- `daySeed()` : seed basé sur le **jour local** (le nom change à minuit chez l'utilisateur)
- `nameOfTheDay()` : `NAMES_99[daySeed % 99]` — **identique pour tous les utilisateurs** le même jour, cycle complet sur 99 jours
- `meditationFor(seed)` : phrase de méditation tournante sur 3 jours (dhikr / méditation / invocation par le Nom)

### Nouveau composant : `client/src/components/NameOfTheDay.tsx`
Carte « ✨ Nom du jour » : nom arabe + translittération + signification + description + méditation + bouton « 🔊 Écouter » + section « 📖 Dans le Coran » (versets du nom du jour) + lien « Tous les noms ».

### Intégration : `client/src/components/DashboardView.tsx`
Import + placement de `<NameOfTheDay />` (entre les suggestions et la « Citation du jour »).

### Clés
`names99.daily` (existait déjà, désormais utilisée) + `names99.audioPlay`.

---

## 4. Lien vers le Coran

**Objectif :** afficher les versets où le nom apparaît (ou la racine associée) avec un bouton « Lire dans le Coran » → `/quran?surah=X&verse=Y`.

### Défi technique résolu
Sur l'édition arabe `ara-quranacademy`, seulement **32/99 noms** apparaissent littéralement. Le moteur de recherche utilise 4 stratégies en cascade :
1. **Nom complet** (normalisation coranique : sukoon `ۡ`, alef wasla `ٱ`, tatweel `ـٰ`, conversion **« ی » persan U+06CC → « ي » arabe**)
2. **Nom sans « ال »**
3. **Racine trilitère** (table manuelle de 98 racines — contenu islamique précis)
4. **Repli manuel** (le seul nom absent littéralement, « Al-Majid الماجد », est relié à 85:15 « ذو العرش المجيد »)

Résultat : **99/99 noms reliés** à des versets réels.

### Nouveau fichier : `client/src/lib/nameQuran.ts`
- `normalizeQuranicArabic()` : normalisation complète
- `findNameVerses(nameIndex)` : recherche en cache, renvoie jusqu'à 3 versets `{ surah, verse, arabic, french }` (via l'API Coran existante de l'app)

### Nouveau composant : `client/src/components/NameQuranLinks.tsx`
Section « 📖 Dans le Coran » : versets (arabe + traduction française) + bouton « Lire dans le Coran » par verset.

### Intégration
- `NamesView.tsx` (vue Révision) : `<NameQuranLinks nameIndex={...} arabicName={...} />` sous la carte
- `NameOfTheDay.tsx` : mêmes liens pour le nom du jour

### Clés : `names99.quranVerses`, `names99.quranRead`

---

## 5. Défis hebdomadaires

**Objectif :** stimuler l'apprentissage régulier — ex. « Apprends 5 nouveaux noms cette semaine » avec récompense en points.

### Principe
- **3 défis par semaine**, générés déterministiquement par seed de semaine (mêmes défis pour tous, comme les quêtes du jour)
- Rotation sur 7 types : prières 🕌, quêtes ⚔️, Coran 📖, dhikr 📿, quiz 🧠, série 🔥, **99 Noms 📍**
- Progression **calculée côté serveur** pour les métriques serveur ; **rapportée par le client** pour les 99 Noms (données localStorage)

### Nouveau fichier : `server/src/routes/challenges.ts`
- `weekStart()` : date ISO du lundi
- `pickWeekly(seed)` : 3 défis à types distincts (7 types, pas de 5 → toujours distincts)
- `computeProgress(userId, type, week)` : comptages SQL (prières, quêtes, Coran, dhikr, quiz) + `computeStreak` pour la série
- **GET `/api/challenges`** : génère les 3 défis si absents, renvoie `{ week_start, challenges: [{ challenge_id, title, description, type, target, points, progress, claimed, completed }] }`
- **POST `/api/challenges/:id/claim`** : réclame la récompense **une seule fois** → points + `checkAchievements` + nouveau rang
- **POST `/api/challenges/:id/progress`** : incrément de progression pour les types rapportés par le client (`names` uniquement)

### Table `weekly_challenges` (SQLite + PostgreSQL)
`db.ts` et `pgSchema.ts` : `user_id, week_start, challenge_id, title, description, type, target, points, progress, claimed` + index + `UNIQUE(user_id, week_start, challenge_id)`. **Créée automatiquement** au démarrage.

### Points
- `achievements.ts` → `userPoints()` : `+ (SELECT COALESCE(SUM(points),0) FROM weekly_challenges WHERE user_id=? AND claimed=1)` → **le rang monte automatiquement**
- `quests.ts` → `lifetime` : même ajout (le compteur de points total est cohérent)

### Client
- **`QuestsView.tsx`** : section « 🏆 Défis hebdomadaires » (au-dessus des quêtes du jour) avec barres de progression, compteur `progress/target`, bouton « Réclamer » quand `completed && !claimed`, badge « ✓ Réclamé » ensuite
- **`NamesView.tsx`** : dans `rate()`, après chaque notation → `reportChallengeProgress(challenge_id du défi `names` non réclamé)` en **fire-and-forget** (la page reste prioritaire, la barre se met à jour en fond)

---

## 6. Intégration dans `useDevotion` et `api.ts` (partie 99 Noms)

> ⚠️ Ces deux fichiers contiennent **aussi** d'autres évolutions indépendantes. Pour ne récupérer QUE la partie 99 Noms, appliquez les ajouts ci-dessous plutôt qu'un remplacement complet.

### `client/src/lib/api.ts` — à ajouter
```ts
export interface WeeklyChallenge {
  challenge_id: string; title: string; description: string; type: string;
  target: number; points: number; progress: number; claimed: boolean; completed: boolean;
}
export interface ChallengesData { week_start: string; challenges: WeeklyChallenge[]; }

export function apiChallenges(options: ApiFetchOptions = {}): Promise<ChallengesData> {
  return apiFetch<ChallengesData>('/api/challenges', {}, DEFAULT_API_TIMEOUT_MS, options);
}
export function apiClaimChallenge(challengeId: string): Promise<{ ok: boolean; claimed: boolean; points: number; newBadges?: string[]; newRank?: any; code?: string }> {
  return apiFetch(`/api/challenges/${challengeId}/claim`, { method: 'POST' });
}
export function apiReportChallengeProgress(challengeId: string): Promise<{ ok: boolean; progress: number; target: number; completed: boolean; claimed: boolean }> {
  return apiFetch(`/api/challenges/${challengeId}/progress`, { method: 'POST' });
}
```
+ dans `cacheDomains()` : `if (base.startsWith('/api/challenges')) return ['/api/challenges'];`

### `client/src/hooks/useDevotion.tsx` — à ajouter
- État : `const [challenges, setChallenges] = useState<ChallengesData | null>(null);`
- Dans `refresh()` : ajouter `apiChallenges(fetchOptions)` au `Promise.allSettled` et `setChallenges(...)` sur succès
- `claimChallenge(challengeId)` : appelle `apiClaimChallenge`, applique `applyServerMeta` (badges/rang), toast « +X pts », puis `refresh({ force: true, silent: true })`
- `reportChallengeProgress(challengeId)` : **mise à jour optimiste** de la barre, puis appel réseau silencieux (échec ignoré → resynchronisé au prochain refresh)
- Exposer les deux dans l'interface `DevotionStore` et le `value` du contexte

---

## 7. Traductions ajoutées

Dans `fr.ts`, `en.ts`, `ar.ts` (22 clés au total) :

**Clés `names99.*` (SRS + audio + Coran)**
`review`, `reviewDue`, `reviewDone`, `reviewDoneHint`, `rateAgain`, `rateGood`, `rateEasy`, `reviewIn`, `mastered`, `learning`, `practice`, `practiceHint`, `reset`, `audioPlay`, `audioLoop`, `quranVerses`, `quranRead`

**Clés `challenges.*`**
`title` (« Défis hebdomadaires »), `weekOf` (« Semaine en cours — objectifs jusqu'au {date} »), `claim` (« Réclamer »), `claimed` (« Réclamé »)

---

## 8. Vérifications

Sur la version d'origine, tout est vert :
- **Typecheck** : `npm run typecheck` ✅
- **Tests** : `npm test` → **112 tests / 0 échec** (71 client + 41 serveur) ✅
- **Build** : `npm run build` ✅

### Testé en conditions réelles (Preview)
| Action | Résultat |
|---|---|
| Page 99 Noms | **99 noms** (au lieu de 66), entrées arabes corrigées |
| Notation « Je le connais » | Compteur décrémenté, « 🔁 1 jour » sur le nom |
| Bouton 🔊 | Chargement MP3 islamicapi (requête réseau 206 Media) |
| Nom du jour (accueil) | Carte avec signification + méditation + audio + versets |
| « Lire dans le Coran » | Navigation vers `/quran?surah=1&verse=1` |
| Notation d'un nom | Défi « Apprends 5 nouveaux noms » → 1/5 |
| 5 notations + « Réclamer » | **+50 pts**, rang Bronze 3 → Bronze 2, « ✓ Réclamé » |

---

## Ordre d'intégration recommandé

1. **Serveur** : `db.ts` + `pgSchema.ts` (table) → `app.ts` (route) → `challenges.ts` (+ test) → `achievements.ts` + `quests.ts` (points)
2. **Client données** : `names99.ts` → `spacedRepetition.ts` → `nameQuran.ts` → `nameOfTheDay.ts` → `useNameAudio.ts`
3. **Client état** : `api.ts` → `useDevotion.tsx` (ajouts §6)
4. **Client interface** : `NamesView.tsx` → `NameQuranLinks.tsx` → `NameOfTheDay.tsx` → `DashboardView.tsx` → `QuestsView.tsx`
5. **i18n** : `fr.ts` / `en.ts` / `ar.ts`
6. **Tests** : copier les 4 fichiers de test + mettre à jour le script `test` de `package.json`
7. **Vérifier** : `npm run typecheck && npm test && npm run build`
