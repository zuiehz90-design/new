# 📦 Package « Nouveautés des 99 Noms » — Liste des fichiers

> Package à appliquer sur une autre version du projet pour intégrer :
> **Répétition espacée (SRS) · Audio de prononciation · Nom du jour · Lien vers le Coran · Défis hebdomadaires** (dont le défi « Apprends N noms »).
>
> Les sources complètes de chaque fichier sont dans le dossier `sources/` (chemins identiques au projet).

---

## 1. Fichiers NOUVEAUX (à copier tels quels)

| Fichier (chemin dans le projet) | Rôle |
|---|---|
| `client/src/lib/spacedRepetition.ts` | Moteur de répétition espacée (paliers 1j/3j/7j/14j/30j → maîtrisé) |
| `client/src/lib/spacedRepetition.test.ts` | Tests unitaires du moteur SRS |
| `client/src/hooks/useNameAudio.ts` | Lecture audio des noms (toggle lecture/stop, boucle) |
| `client/src/lib/nameOfTheDay.ts` | Logique pure du « Nom du jour » (seed journalier) |
| `client/src/lib/nameOfTheDay.test.ts` | Tests du nom du jour |
| `client/src/components/NameOfTheDay.tsx` | Carte « ✨ Nom du jour » pour l'accueil |
| `client/src/lib/nameQuran.ts` | Moteur de recherche des versets coraniques (4 stratégies) |
| `client/src/lib/nameQuran.test.ts` | Tests du moteur de recherche |
| `client/src/components/NameQuranLinks.tsx` | Affichage des versets + bouton « Lire dans le Coran » |
| `server/src/routes/challenges.ts` | Routeur des défis hebdomadaires (GET / claim / progress) |
| `server/src/routes/challenges.test.ts` | Tests des défis hebdomadaires |

## 2. Fichiers MODIFIÉS (à remplacer — voir l'explication pour les points d'attention)

| Fichier (chemin dans le projet) | Nature du changement |
|---|---|
| `client/src/lib/names99.ts` | **Liste reconstruite : 66 → 99 noms** + champ `audio` (URL MP3 islamicapi) pour chaque nom |
| `client/src/components/NamesView.tsx` | **Réécrit** : vue Révision avec cartes retournables, notation SRS, audio, versets Coran, report de progression du défi |
| `client/src/components/DashboardView.tsx` | Ajout de la carte « Nom du jour » (après les suggestions) |
| `client/src/i18n/fr.ts` | +~22 clés : `names99.*` (SRS, audio, Coran) + `challenges.*` |
| `client/src/i18n/en.ts` | Idem (anglais) |
| `client/src/i18n/ar.ts` | Idem (arabe) |
| `client/src/lib/api.ts` | Types `WeeklyChallenge`/`ChallengesData` + `apiChallenges`, `apiClaimChallenge`, `apiReportChallengeProgress` + invalidation cache `/api/challenges` |
| `client/src/hooks/useDevotion.tsx` | État `challenges`, `claimChallenge()`, `reportChallengeProgress()` + fetch dans `refresh()` |
| `server/src/routes/achievements.ts` | `userPoints()` inclut les points des défis réclamés (le rang monte) |
| `server/src/routes/quests.ts` | `lifetime` inclut les points des défis réclamés |
| `server/src/db.ts` | Table `weekly_challenges` (SQLite) |
| `server/src/pgSchema.ts` | Table `weekly_challenges` (PostgreSQL / Neon) |
| `server/src/app.ts` | Montage de la route `/api/challenges` |
| `package.json` | Script `test` : ajout de `nameOfTheDay.test.ts`, `nameQuran.test.ts`, `challenges.test.ts` |

## 3. Dépendances (déjà présentes dans la plupart des versions)

| Fichier | Pourquoi |
|---|---|
| `client/src/lib/storageScope.ts` | `storageKey()` utilisé par NamesView (stockage SRS par compte) |
| `client/src/context/AuthContext.tsx` | `useAuth()` → `scope` (clé de stockage) |
| `client/src/context/ToastContext.tsx` | `useToast()` utilisé par useDevotion |
| `client/src/lib/surahs.ts` | `SURAHS` utilisé par QuestsView (liens Coran) |

---

## ⚠️ Points d'attention pour le merge

1. **`client/src/hooks/useDevotion.tsx` et `client/src/lib/api.ts`** contiennent AUSSI d'autres évolutions indépendantes (système de sync hors-ligne/actionQueue, correctif des points de prière). Si votre autre version n'a pas ces évolutions, **ne remplacez pas les fichiers entiers** : appliquez uniquement les ajouts listés dans `02-EXPLICATION-MODIFICATIONS.md` (§5 et §6).
2. **`client/src/components/DashboardView.tsx`** : seule l'ajout de la carte `NameOfTheDay` concerne les 99 Noms (repérable par `import { NameOfTheDay }`).
3. **`server/src/routes/achievements.ts` et `server/src/routes/quests.ts`** : seule la requête SQL des points/lifetime concerne les défis.
4. **`client/src/lib/names99.ts`** : remplacement **complet** recommandé (la liste précédente était incomplète : 66 noms + 3 entrées arabes corrompues). La nouvelle liste est canonique (99 noms, ordre traditionnel, audio inclus).
5. La table `weekly_challenges` est créée automatiquement au démarrage (migration `CREATE TABLE IF NOT EXISTS`) — aucune migration manuelle requise.
