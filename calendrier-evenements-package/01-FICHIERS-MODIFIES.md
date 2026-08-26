# 📦 Package « Calendrier & Événements » — Liste des fichiers

> Package à appliquer sur une autre version du projet pour intégrer :
> **Compte à rebours dynamique · Les 10 jours de Dhoul-Hijja (compteur dédié, jeûne de Arafah, invocations) · Explications des événements (histoire, signification, pratiques) · Quiz de connaissances par événement** — couvrant tous les jours du calendrier, fêtes comme jours historiques.
>
> Les sources complètes de chaque fichier sont dans `sources/` (chemins identiques au projet).

---

## 1. Fichiers NOUVEAUX (à copier tels quels)

| Fichier (chemin dans le projet) | Rôle |
|---|---|
| `client/src/lib/eventCountdown.ts` | Logique pure : prochain grand événement (Ramadan, Aïd, Qadr, Achoura…) + décomposition J/H/M/S |
| `client/src/lib/eventCountdown.test.ts` | Tests du compte à rebours |
| `client/src/components/EventCountdown.tsx` | Carte d'accueil « 🌙 Compte à rebours » en grand (J-X, tick live sous 4 jours, « Aujourd'hui ! » le jour J) |
| `client/src/lib/dhulHijjah.ts` | Logique pure : statut des 10 jours de Dhoul-Hijja, actions par jour, invocations (takbir, du'a de Arafah) |
| `client/src/lib/dhulHijjah.test.ts` | Tests des 10 jours |
| `client/src/components/DhulHijjahCard.tsx` | Carte d'accueil dédiée : compteur Jour X/10, rappels (jeûne, sadaqa…), du'a de Arafah, takbir dépliable, liens compteur dhikr |
| `client/src/lib/eventExplanations.ts` | Contenu éducatif pour **les 13 événements** : histoire, signification, pratiques recommandées |
| `client/src/lib/eventQuizzes.ts` | Quiz pédagogiques (2-3 questions + explications) pour **10 événements**, y compris historiques (Nouvel an hégirien, Isra wal-Mi'raj, Mawlid, Tashriq) |
| `client/src/lib/eventQuizzes.test.ts` | Validation des quiz et explications (couverture de tous les événements) |
| `client/src/components/EventQuizModal.tsx` | Modal de quiz : question par question, feedback immédiat avec explication, score, rejeu |

## 2. Fichiers MODIFIÉS

| Fichier (chemin dans le projet) | Nature du changement |
|---|---|
| `client/src/components/HijriCalendarView.tsx` | Bloc explicatif dépliable (📖 Histoire / 💡 Signification / 🤲 Pratiques) sur chaque carte d'événement + bouton « 🧠 Quiz » + rendu de la modal |
| `client/src/lib/dhikrList.ts` | Nouveau preset `takbir-dhulhijja` (takbir de Dhoul-Hijja ×33, accessible via `/dhikr?id=takbir-dhulhijja`) |
| `client/src/components/DashboardView.tsx` | Intégration de `<DhulHijjahCard />` et `<EventCountdown />` au-dessus du Nom du jour |
| `client/src/i18n/fr.ts` | ~33 clés ajoutées : `countdown.*`, `dhulhijjah.*`, `hijri.details*`, `hijri.section*`, `hijri.quiz.button` |
| `client/src/i18n/en.ts` | Idem (anglais) |
| `client/src/i18n/ar.ts` | Idem (arabe) |
| `package.json` | Script `test` : ajout de `eventCountdown.test.ts`, `dhulHijjah.test.ts`, `eventQuizzes.test.ts` |

## 3. Dépendances (déjà présentes — copiées dans `sources/` par commodité)

| Fichier | Pourquoi |
|---|---|
| `client/src/lib/hijriCalendar.ts` | **Requis** : conversion hégirienne + `ISLAMIC_EVENTS` + `HIJRI_MONTHS`. Si votre version diffère, vérifiez qu'elle exporte ces symboles |
| `client/src/components/DhikrCounterView.tsx` | Le compteur de dhikr existant lit déjà `?id=<preset>` dans l'URL — aucun changement nécessaire |
| `client/src/context/*`, `client/src/i18n/index` | `useI18n()` requis partout |

---

## ⚠️ Points d'attention pour le merge

1. **`DashboardView.tsx`** : ne remplacez pas le fichier entier si votre version diverge — appliquez uniquement :
   - imports : `import { EventCountdown } from './EventCountdown';` + `import { DhulHijjahCard } from './DhulHijjahCard';`
   - insertion : `<DhulHijjahCard />` puis `<EventCountdown />` juste avant `<NameOfTheDay />` dans le JSX
2. **`HijriCalendarView.tsx`** : ajouts = import `getEventExplanation` / `getEventQuiz` / `EventQuizModal`, états `expanded` + `quiz`, fonction `renderExplanation(e)` insérée après la description dans les deux listes d'événements (« à venir » et « ce mois-ci »)
3. **i18n** : les fichiers fournis contiennent aussi les clés d'autres fonctionnalités (99 Noms, défis). Pour un cherry-pick, ne prenez que les clés listées ci-dessus
4. **Aucun changement serveur** : tout est côté client (données locales, localStorage), zéro migration
5. La carte Dhoul-Hijja n'apparaît que pendant les 10 jours (ou ≤ 15 jours avant) ; le compte à rebours que ≤ 45 jours avant un grand événement — comportement voulu pour ne pas saturer l'accueil
