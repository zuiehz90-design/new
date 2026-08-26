# 📦 Package « Calendrier & Événements » — Explication détaillée

> Ce document explique **quoi** a été modifié, **pourquoi**, et **comment** l'intégrer dans une autre version.
> Sources complètes dans `sources/` (mêmes chemins que le projet). Aucune dépendance serveur.

---

## Sommaire

1. [Compte à rebours dynamique](#1-compte-à-rebours-dynamique)
2. [Les 10 jours de Dhoul-Hijja](#2-les-10-jours-de-dhoul-hijja)
3. [Explication des événements](#3-explication-des-événements)
4. [Quiz sur les événements](#4-quiz-sur-les-événements)
5. [Clés i18n ajoutées](#5-clés-i18n-ajoutées)
6. [Intégration pas à pas](#6-intégration-pas-à-pas)
7. [Vérifications](#7-vérifications)

---

## 1. Compte à rebours dynamique

**Objectif :** créer de l'anticipation et de la motivation en affichant en grand le compte à rebours avant les grands événements (Ramadan, Aïd al-Fitr, Aïd al-Adha, Laylat al-Qadr, Achoura, Jour de Arafah).

### `client/src/lib/eventCountdown.ts` (logique pure)
- `MAJOR_EVENT_KEYS` : les 6 grands événements par date hégirienne (9/1 Ramadan, 9/27 Qadr, 10/1 Aïd al-Fitr, 12/9 Arafah, 12/10 Aïd al-Adha, 1/10 Achoura)
- `nextMajorEvent(now?, horizonDays?)` : **scan jour par jour** avec la conversion `gregorianToHijri` existante (source de vérité unique → cohérence garantie avec le calendrier) ; renvoie `{ event, targetDate, hijriDate, daysLeft }`
- `countdownParts(target, now?)` : décomposition jours/heures/minutes/secondes, jamais négative
- `COUNTDOWN_HORIZON_DAYS = 45` : au-delà, la carte ne s'affiche pas (pas de « J-200 » inutile)

### `client/src/components/EventCountdown.tsx`
Trois états visuels :
| Situation | Affichage |
|---|---|
| > 3 jours | Grand **J-X** + dates hégirienne/grégorienne + description |
| ≤ 3 jours | Compte à rebours **live J/H/M/S** (tick chaque seconde) |
| Jour J | 🎉 **« C'est aujourd'hui ! »** |

Recalcul automatique chaque minute ; lien vers `/hijri`.

---

## 2. Les 10 jours de Dhoul-Hijja

**Objectif :** encourager les bonnes actions pendant la période bénie : compteur dédié, rappels pour le jeûne de Arafat, invocations spécifiques.

### `client/src/lib/dhulHijjah.ts` (logique pure)
- `dhulHijjahStatus(now?)` : détecte si aujourd'hui est dans les 10 premiers jours du mois hégirien 12 → `{ active, day, isArafah (jour 9), isEid (jour 10), daysUntilStart, startDate }` ; sinon scan jusqu'au prochain 1er Dhoul-Hijja
- `dayActions(day)` : rappels adaptés :
  - jours 1-8 : jeûne recommandé · dhikr · sadaqa · Coran
  - jour 9 (**Arafah**) : jeûne fortement recommandé (expie 2 années) · meilleure du'a · takbir · sadaqa
  - jour 10 (**Aïd**) : pas de jeûne · takbir · udhiya/sacrifice
- `invocationFor('takbir' | 'arafahDua')` : textes arabes + translittération

### `client/src/components/DhulHijjahCard.tsx`
- **Pendant la période** : carte dorée « Jour X/10 » avec 10 points de progression, état spécial Arafah/Eid, checklist des actions du jour, du'a de Arafah en arabe, takbir dépliable, bandeau « Jeûne de Arafah dans N jours », liens rapides vers le compteur de dhikr (`/dhikr?id=takbir-dhulhijja`, `tahlil-100`, `istighfar-100`)
- **≤ 15 jours avant** : annonce « J-N » avec date de début + hadith (« Il n'y a pas d'œuvres meilleures que celles de ces dix jours » — Bukhari)
- Sinon : masquée

### Preset dhikr ajouté (`client/src/lib/dhikrList.ts`)
`id: 'takbir-dhulhijja'` — texte complet du takbir (arabe + traduction), ×33, source Bukhari & Muslim.

---

## 3. Explication des événements

**Objectif :** éduquer et enrichir la foi — chaque date importante accompagnée d'un court texte (histoire, signification, pratiques recommandées).

### `client/src/lib/eventExplanations.ts`
- Interface `EventExplanation { history, meaning, practices[] }`
- `EVENT_EXPLANATIONS` : contenu rédigé pour **les 13 événements** du calendrier — fêtes (🕌), jours recommandés (🤲) **et jours historiques (📜)** : Nouvel an hégirien, Achoura, Mawlid, Rajab, Isra wal-Mi'raj, Bara'ah, Ramadan, Qadr, Aïd al-Fitr, Arafah ×2, Aïd al-Adha, Tashriq
- Clés « mois-jour » (`'1-10'`, `'12-10'`…) alignées sur `ISLAMIC_EVENTS`
- Accesseur : `getEventExplanation(month, day)`

### Intégration dans `HijriCalendarView.tsx`
Chaque carte d'événement (liste « Événements à venir » **et** « Événements ce mois-ci ») reçoit un bloc dépliable :
```
▾ 📖 En savoir plus        (ou ▴ Réduire)
   📖 Histoire       → details.history
   💡 Signification  → details.meaning
   🤲 Pratiques recommandées → liste à puces
```

---

## 4. Quiz sur les événements

**Objectif :** consolider l'apprentissage après un événement (« Que sais-tu sur l'Aïd al-Adha ? »).

### `client/src/lib/eventQuizzes.ts`
- `EVENT_QUIZZES` : 2-3 questions par événement pour **10 événements**, couvrant fêtes ET **jours historiques** (Nouvel an hégirien `1-1`, Isra wal-Mi'raj `7-27`, Mawlid `3-12`, Tashriq `12-11` inclus)
- Chaque question : `{ q, options[3], answer, explain }` — l'explication pédagogique s'affiche après la réponse
- `getEventQuiz(month, day)` : renvoie les questions ou null
- Quiz 100 % client (pédagogique, sans enjeu de points serveur)

### `client/src/components/EventQuizModal.tsx`
Modal complète : progression « Question X/Y », options A/B/C verrouillées après clic (✅ vert / ❌ rouge), explication 💡, bouton Suivante / Voir le résultat, écran final avec score + message (parfait/bien joué/continue) et rejeu.

### Intégration dans `HijriCalendarView.tsx`
Bouton « 🧠 Quiz » sur chaque carte d'événement qui a un quiz, à côté du toggle d'explication.

---

## 5. Clés i18n ajoutées

Dans `fr.ts`, `en.ts`, `ar.ts` :

**`countdown.*` (7)** : `title`, `today`, `days`, `hours`, `minutes`, `seconds`, `viewCalendar`

**`dhulhijjah.*` (20)** : `title`, `subtitle`, `day`, `arafah`, `eid`, `fasting`, `arafahFasting`, `noFasting`, `dhikr`, `sadaqa`, `quran`, `takbir`, `arafahDua`, `udhiya`, `daysToArafah`, `ctaTakbir`, `ctaTahlil`, `ctaIstighfar`, `startOn`, `hadith`

**`hijri.*` (6)** : `details` (« En savoir plus »), `detailsHide` (« Réduire »), `sectionHistory` (« 📖 Histoire »), `sectionMeaning` (« 💡 Signification »), `sectionPractices` (« 🤲 Pratiques recommandées »), `quiz.button` (« Quiz »)

Réutilisation de clés existantes pour la modal : `quiz.question`, `quiz.score`, `quiz.next`, `quiz.seeResult`, `quiz.perfect`, `quiz.good`, `quiz.keepLearning`, `quiz.replay`, `common.cancel`, `hijri.days`.

---

## 6. Intégration pas à pas

1. **Données/logique** : copier `eventCountdown.ts(+test)`, `dhulHijjah.ts(+test)`, `eventExplanations.ts`, `eventQuizzes.ts(+test)` — vérifier que votre `hijriCalendar.ts` exporte bien `gregorianToHijri`, `ISLAMIC_EVENTS`, `HIJRI_MONTHS`, types `HijriDate`/`IslamicEvent`
2. **Composants** : copier `EventCountdown.tsx`, `DhulHijjahCard.tsx`, `EventQuizModal.tsx`
3. **Calendrier** : appliquer les ajouts à `HijriCalendarView.tsx` (voir points d'attention du fichier 01) ou remplacer par la version fournie si proche
4. **Dashboard** : imports + `<DhulHijjahCard />` puis `<EventCountdown />` avant `<NameOfTheDay />` (remplacer le fichier seulement si votre version est proche)
5. **Dhikr** : ajouter le preset `takbir-dhulhijja` dans `dhikrList.ts` (déjà présent dans la version fournie)
6. **i18n** : fusionner les clés du §5 dans vos 3 fichiers de langue
7. **Tests** : copier les 4 fichiers `.test.ts` + ajouter au script `test` de `package.json` :
   `src/lib/eventCountdown.test.ts src/lib/dhulHijjah.test.ts src/lib/eventQuizzes.test.ts`
8. **Vérifier** : `npm run typecheck && npm test && npm run build`

---

## 7. Vérifications

Sur la version d'origine, tout est vert :
- **Typecheck** ✅
- **Tests** : **127 tests / 0 échec** (86 client + 41 serveur) ✅ — dont 15 nouveaux pour ce package
- **Build** ✅

### Points testés unitairement
- Détection correcte des 10 jours (1er, milieu, dernier, Arafah, Eid) via dates réelles converties
- Compte à rebours cohérent aller-retour (date cible reconvertie = jour de l'événement)
- Horizon 45 jours (null au-delà), day J = 0, `countdownParts` exacte et jamais négative
- Actions par jour (jeûne 1-8, Arafah spécifique, Eid sans jeûne) et invocations
- Couverture : **tous** les 13 événements ont une explication ; quiz valides (options uniques, réponse dans les bornes) y compris pour les jours historiques

### Notes comportementales
- Le compte à rebours utilise le même algorithme hégirien que le calendrier (précision ±1 jour, comme indiqué dans l'app) — les vraies dates peuvent varier selon l'observation lunaire
- Les cartes restent discrètes hors période (accueil non saturé) : Dhoul-Hijja visible ≤ 15 j avant / pendant ; countdown visible ≤ 45 j avant
