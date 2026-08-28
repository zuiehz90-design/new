# 📦 Package « Jours Spéciaux & Événements » — Explication détaillée

> **Objectif** : Donner de l'anticipation, éduquer et motiver l'utilisateur autour des grands moments de l'islam — fêtes, jours bénis et événements historiques.
>
> **Dépendance unique** : votre `hijriCalendar.ts` doit exporter `gregorianToHijri` et `ISLAMIC_EVENTS`.
> **Zéro changement serveur** : tout est client.

---

## Sommaire

1. [Compte à rebours dynamique](#1-compte-à-rebours-dynamique)
2. [Jours spéciaux — Aïd, Arafah, Ramadan](#2-jours-spéciaux)
3. [Les 10 jours de Dhoul-Hijja](#3-les-10-jours-de-dhoul-hijja)
4. [Explications des événements](#4-explications-des-évènements)
5. [Quiz sur les événements](#5-quiz-sur-les-évènements)
6. [Étapes d'intégration](#6-étapes-dintégration)

---

## 1. Compte à rebours dynamique

### Quoi
Une carte sur l'accueil qui affiche **« J-XX »** avant le prochain grand événement islamique (Ramadan, Aïd al-Fitr, Aïd al-Adha, Laylat al-Qadr…).

### Comportement
- **> 45 jours** avant → pas de carte (pas de bruit)
- **45 à 4 jours** → affiche « J-XX jours » (récupéré une fois au chargement)
- **< 4 jours** → tick live à la seconde : « J-2 14h 32m 08s »
- **Jour J** → « 🎉 C'est aujourd'hui ! » avec bordure dorée
- Le nom est affiché en arabe ( RTL) + translittération + date grégorienne

### Fichiers
| Fichier | Rôle |
|---------|------|
| `eventCountdown.ts` | `nextMajorEvent()` scanne jour par jour depuis aujourd'hui ; `countdownParts()` calcule J/H/M/S |
| `eventCountdown.test.ts` | 5 tests (horizon,今天, relatif, fixe, bornes) |
| `EventCountdown.tsx` | Carte animée avec `useEffect` tick, lien vers le calendrier |

---

## 2. Jours spéciaux

### Quoi
Une carte qui apparaît **le jour même ou la veille** d'un grand événement, avec :
- **Notification push** (une seule par jour/événement, anti-doublon)
- **Lecture du takbir** en audio (Sheikh Ali Mullah, domaine public via archive.org)
- **Checklist d'actions** concrètes (jeûne, sadaqa, prière, invocations) cochables et persistées

### Comportement
- La carte apparaît **la veille au soir** (ex. veille de l'Aïd → « 🌙 Demain : Aïd al-Fitr »)
- Le jour J → « 🎉 C'est aujourd'hui ! » avec actions cochables
- Le takbir audio est disponible uniquement pour **Aïd al-Fitr, Jour de Arafah, Aïd al-Adha** (prescrits)
- Le quiz est accessible via un bouton « 🧠 Quiz » (si des questions existent pour cet événement)
- `?demo-special` dans l'URL pour forcer l'affichage (mode test)

### Fichiers
| Fichier | Rôle |
|---------|------|
| `specialDay.ts` | `getSpecialDay()` → détecte le jour/veille, extrait les actions, vérifie si takbir pertinent |
| `specialDay.test.ts` | 7 tests (jour même, veille, au-delà, mode force, takbir, clé anti-doublon) |
| `SpecialDayCard.tsx` | Carte complète : notification + audio + checklist + liens quiz/calendrier |

### Audio
- **Source** : `archive.org/download/EidTakbirBySheikhAliMullah` (domaine public)
- **Format** : MP3 64 kbps (~950 Ko), chargement rapide
- **Hook** : réutilise `useNameAudio()` existant (lecture/toggle/boucle)

### Persistence
- **Notifications** : clé `nour:specialday-notified:YYYY-MM-DD:month-day` dans localStorage
- **Checklist** : clé `nour:specialday-actions:YYYY-MM-DD:month-day` dans localStorage (par scope compte)

---

## 3. Les 10 jours de Dhoul-Hijja

### Quoi
Une carte dédiée pendant les 10 premiers jours de Dhoul-Hijja (les jours les plus bénis de l'année), avec :
- Compteur **« Jour X/10 »** avec barre de progression à 10 points
- Rappel du **jeûne de Arafah** (jour 9) : « expie 2 années de péchés »
- **Du'a de Arafah** en arabe avec translittération
- Lien vers le compteur de dhikr (preset `takbir-dhulhijja`)
- Actions spécifiques par jour (jeûne, sadaqa, dhikr, prières surérogatoires…)

### Fichiers
| Fichier | Rôle |
|---------|------|
| `dhulHijjah.ts` | `dhulHijjahStatus()` → jour actuel, `dayActions()` → actions du jour, `invocationFor()` → du'a |
| `dhulHijjah.test.ts` | 6 tests (hors période, jour 1, jour 9/Arafah, jour 10/Aïd, invocations) |
| `DhulHijjahCard.tsx` | Carte dédiée avec compteur, barre, du'a, CTA vers dhikr |

---

## 4. Explications des événements

### Quoi
Chaque événement du calendrier hégirien est accompagné d'un **court texte éducatif** :
- 💡 **Histoire** : ce qui s'est passé et pourquoi c'est important
- 🤲 **Signification** : ce que cela signifie spirituellement
- ✅ **Pratiques** : comment le vivre concrètement (jeûne, sadaqa, prières…)

### Événements couverts (13)
| Événement | Mois/Jour |
|-----------|-----------|
| Nouvel an hégirien | 1/1 |
| Mawlid (naissance du Prophète) | 3/12 |
| Isra wal-Mi'raj | 7/27 |
| Début du Ramadan | 9/1 |
| Laylat al-Qadr | 9/27 |
| Aïd al-Fitr | 10/1 |
| Arafah | 12/9 |
| Aïd al-Adha | 12/10 |
| Jours de Tashriq | 12/11-12 |
| Achoura | 1/10 |
| Mouled Nabi | 3/12 |
| Les 10 jours de Dhoul-Hijja | 12/1-10 |
| Jour de Ghadir Khumm | 12/18 |

### Fichiers
| Fichier | Rôle |
|---------|------|
| `eventExplanations.ts` | Map `getEventExplanation(month, day)` → `{ history, meaning, practices }` |

### Affichage
- Intégré dans `HijriCalendarView.tsx` : chaque carte d'événement a un `<details>` dépliable avec l'explication
- Les pratiques sont listées comme des items à cocher (utilisateur peut marquer ce qu'il a fait)

---

## 5. Quiz sur les événements

### Quoi
Un quiz pédagogique de **2-3 questions** par événement, accessible depuis :
- La carte « Jour spécial » (bouton « 🧠 Quiz »)
- La vue calendrier hégirien (bouton sur chaque carte d'événement)

### Comportement
- **1 question à la fois** avec 3 choix
- **Feedback immédiat** : ✅ correct (vert) ou ❌ incorrect (rouge) + explication courte
- **Barre de progression** entre les questions
- **Score final** : « 3/3 — Barakallahu fik ! 🌟 » ou encouragement
- **Bouton « Rejouer »** pour réessayer

### Événements avec quiz (10)
Aïd al-Fitr, Aïd al-Adha, Arafah, Ramadan, Laylat al-Qadr, Isra wal-Mi'raj, Achoura, Mawlid, Nouvel an hégirien, Jours de Tashriq

### Fichiers
| Fichier | Rôle |
|---------|------|
| `eventQuizzes.ts` | `getEventQuiz(month, day)` → tableau de questions avec choix et explications |
| `eventQuizzes.test.ts` | 4 tests (existe, n'existe pas, structure, count) |
| `EventQuizModal.tsx` | Modal interactif : une question à la fois, score final, rejeu |

---

## 6. Étapes d'intégration

### Étape 1 — Fichiers nouveaux (copie directe)
Copier les 13 fichiers depuis `sources/` vers les mêmes chemins dans votre projet.

### Étape 2 — `notifications.ts` (4 ajouts)
Ajouter `'special'` au type, aux prefs, aux defaults, aux icônes (voir patches dans 01-FICHIERS-MODIFIES.md).

### Étape 3 — `DashboardView.tsx` (import + placement)
Importer les 4 composants et les placer après `<DashboardSuggestions />` :
```
SpecialDayCard → DhulHijjahCard → EventCountdown → NameOfTheDay
```

### Étape 4 — `SettingsModal.tsx` (1 ligne)
Ajouter `['special', '🌙', t('notif.type.special')]` au tableau des types.

### Étape 5 — `HijriCalendarView.tsx` (explications + quiz)
Ajouter les imports de `eventExplanations`, `eventQuizzes`, `EventQuizModal` et les blocs `<details>` + bouton Quiz.

### Étape 6 — `dhikrList.ts` (preset takbir)
Ajouter l'entrée `takbir-dhulhijja` avec les noms en arabe/français/anglais.

### Étape 7 — i18n (33 clés × 3 langues)
Ajouter toutes les clés listées dans 01-FICHIERS-MODIFIES.md.

### Étape 8 — `package.json` (tests)
Ajouter les 4 fichiers de test au script `test` client.

### Étape 9 — Vérification
```bash
npm run typecheck        # doit passer
npm test                 # doit passer (dont 22 nouveaux tests)
npm run build            # doit passer
```

---

## Points d'attention

- **Zéro dépendance serveur** : tout est côté client, aucune migration de base
- **Audio takbir** : nécessite une connexion internet (fichier hébergé sur archive.org, domaine public)
- **Calendrier hégirien** : la précision dépend de votre `hijriCalendar.ts` — les dates sont calculées localement
- **Mode test** : `?demo-special=1` dans l'URL affiche la carte « Jour spécial » même sans événement imminent
- **Notifications** : une seule notification par jour et par événement (clé dans localStorage)
- **Dhoul-Hijja** : la carte ne s'affiche que pendant les 10 jours (1er au 10 Dhoul-Hijja hégirien)

## État vérifié sur la version d'origine

| Vérification | Résultat |
|--------------|----------|
| Typecheck | ✅ 0 erreurs |
| Tests | ✅ 127 → 134 (22 nouveaux, 0 échec) |
| Build | ✅ Produit |
| Preview | ✅ Cartes visibles sur Dashboard + Calendrier |
