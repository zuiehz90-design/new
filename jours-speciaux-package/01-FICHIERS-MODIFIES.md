# 📦 Package « Jours Spéciaux & Événements » — Fichiers

> **Date** : 2026-08-26
> **Fonctionnalités** : Compte à rebours dynamique · Jours spéciaux (Aïd/Arafah/Ramadan) · Takbir audio · Checklist d'actions · 10 jours de Dhoul-Hijja · Explications historiques · Quiz par événement

---

## 📁 Fichiers NOUVEAUX (à copier tels quels)

Ces fichiers n'existent pas dans votre version actuelle. Copiez-les depuis `sources/` vers les mêmes chemins dans votre projet :

| # | Chemin | Rôle |
|---|--------|------|
| 1 | `client/src/lib/eventCountdown.ts` | Logique pure : scan jour par jour, `nextMajorEvent()`, `countdownParts()` |
| 2 | `client/src/lib/eventCountdown.test.ts` | 5 tests unitaires |
| 3 | `client/src/components/EventCountdown.tsx` | Carte d'accueil « J-XX » avec tick live sous 3 jours |
| 4 | `client/src/lib/specialDay.ts` | Détection jour spécial/veille, actions, takbir audio URL |
| 5 | `client/src/lib/specialDay.test.ts` | 7 tests unitaires |
| 6 | `client/src/components/SpecialDayCard.tsx` | Carte jour spécial : notification, audio, checklist actions |
| 7 | `client/src/lib/eventExplanations.ts` | Contenu éducatif des 13 événements (histoire + signification + pratiques) |
| 8 | `client/src/lib/eventQuizzes.ts` | Quiz 2-3 questions pour 10 événements |
| 9 | `client/src/lib/eventQuizzes.test.ts` | 4 tests unitaires |
| 10 | `client/src/components/EventQuizModal.tsx` | Modal interactif de quiz (feedback, score, rejeu) |
| 11 | `client/src/lib/dhulHijjah.ts` | Logique des 10 jours (détection, actions par jour, invocations) |
| 12 | `client/src/lib/dhulHijjah.test.ts` | 6 tests unitaires |
| 13 | `client/src/components/DhulHijjahCard.tsx` | Carte dédiée Dhoul-Hijja (compteur Jour X/10, takbir, rappel Arafah) |

---

## ✏️ Fichiers MODIFIÉS (appliquer les patches ou mergez manuellement)

### 1. `client/src/lib/notifications.ts`
**Changement** : ajouter le type `special` au union type, aux prefs, aux defaults et aux icônes.

Ajouter dans le type `NotificationType` :
```diff
   | 'story'
+  | 'special';
```

Ajouter dans l'interface `NotificationPrefs` :
```diff
   story: boolean;
+  special: boolean;
   sound: boolean;
```

Ajouter dans `DEFAULT_NOTIFICATION_PREFS` :
```diff
   story: true,
+  special: true,
   sound: false,
```

Ajouter dans `TYPE_ICONS` :
```diff
   story: '📖',
+  special: '🌙',
```

---

### 2. `client/src/components/DashboardView.tsx`
**Changement** : importer et placer les 4 nouvelles cartes.

Ajouter les imports :
```diff
+import { EventCountdown } from './EventCountdown';
+import { DhulHijjahCard } from './DhulHijjahCard';
+import { SpecialDayCard } from './SpecialDayCard';
+import { NameOfTheDay } from './NameOfTheDay';
```

Dans le JSX, après `<DashboardSuggestions />` et avant `{/* Citation du jour */}` :
```diff
+      <SpecialDayCard />
+      <DhulHijjahCard />
+      <EventCountdown />
+      <NameOfTheDay />
```

---

### 3. `client/src/components/SettingsModal.tsx`
**Changement** : ajouter le bouton toggle pour les notifications « Jours spéciaux ».

Dans le tableau des types de notification (ligne ~137) :
```diff
   ['story', '📖', t('notif.type.story')],
+  ['special', '🌙', t('notif.type.special')],
```

---

### 4. `client/src/components/HijriCalendarView.tsx`
**Changement** : ajouter les explications dépliables + bouton quiz sur les événements.

Ajouter les imports :
```diff
+import { getEventExplanation } from '../lib/eventExplanations';
+import { getEventQuiz } from '../lib/eventQuizzes';
+import { EventQuizModal } from './EventQuizModal';
```

Pour chaque événement dans la liste « à venir » et « événements du mois », ajouter un bloc `<details>` avec l'explication et un bouton Quiz. Voir le fichier source pour le JSX exact.

---

### 5. `client/src/lib/dhikrList.ts`
**Changement** : ajouter le preset `takbir-dhulhijja` au compteur de dhikr.

```diff
+  {
+    id: 'takbir-dhulhijja',
+    nameAr: 'تكبير أيام التشريق',
+    nameFr: 'Takbir Dhoul-Hijja',
+    nameEn: 'Takbir Dhul-Hijjah',
+    targetCount: 10,
+  },
```

---

### 6. `package.json`
**Changement** : ajouter les tests au script `test`.

Dans le script `test` client :
```diff
-"test": "node --import tsx --test src/lib/markdown.test.ts src/lib/mawaqit.test.ts src/lib/spacedRepetition.test.ts src/lib/nameOfTheDay.test.ts src/lib/nameQuran.test.ts"
+"test": "node --import tsx --test src/lib/markdown.test.ts src/lib/mawaqit.test.ts src/lib/spacedRepetition.test.ts src/lib/nameOfTheDay.test.ts src/lib/nameQuran.test.ts src/lib/eventCountdown.test.ts src/lib/eventQuizzes.test.ts src/lib/dhulHijjah.test.ts src/lib/specialDay.test.ts"
```

---

## 🔤 Clés i18n à ajouter

### `client/src/i18n/fr.ts`
```ts
// --- Compte à rebours ---
'countdown.horizon': 'Les grands événements',
'countdown.today': "C'est aujourd'hui !",
'countdown.days': '{count} jours',
'countdown.hours': '{count}h',
'countdown.minutes': '{count}m',
'countdown.seconds': '{count}s',
'countdown.viewCalendar': 'Voir le calendrier',

// --- Dhoul-Hijja ---
'dhulhijjah.title': '🌙 Les 10 jours de Dhoul-Hijja',
'dhulhijjah.subtitle': 'Jour {current} sur 10',
'dhulhijjah.progress': '{current}/10',
'dhulhijjah.arafahFast': 'jeûne de Arafah',
'dhulhijjah.arafahDescription': 'Le jeûne du 9 Dhoul-Hijja expie les péchés de l\'année passée et à venir.',
'dhulhijjah.ctaDhikr': '📿 Compter le takbir',
'dhulhijjah.arafahDuas': 'Du\'a de Arafah',
'dhulhijjah.dayActions': 'Actions recommandées',

// --- Jours spéciaux ---
'specialday.tomorrow': 'Demain',
'specialday.actionsTitle': 'Actions recommandées',
'specialday.takbirPlay': 'Écouter le takbir',
'specialday.takbirStop': 'Arrêter',
'specialday.notifTodayTitle': '🎉 {name} — c\'est aujourd\'hui !',
'specialday.notifTodayBody': 'Découvre les actions recommandées pour vivre pleinement ce jour béni.',
'specialday.notifEveTitle': '🌙 Demain : {name}',
'specialday.notifEveBody': 'Prépare-toi : jeûne, sadaqa et invocations.',
'notif.type.special': 'Jours spéciaux',

// --- Explications événements ---
'hijri.details.title': 'À propos de {name}',
'hijri.details.history': 'Histoire',
'hijri.details.meaning': 'Signification',
'hijri.details.practices': 'Pratiques recommandées',

// --- Quiz événements ---
'quiz.button': '🧠 Quiz',
'quiz.score': '{score}/{total}',
'quiz.correct': '✅ Correct !',
'quiz.wrong': '❌ Incorrect',
'quiz.next': 'Suivant',
'quiz.finish': 'Terminer',
'quiz.retry': 'Rejouer',
'quiz.title': 'Quiz : {name}',
```

### `client/src/i18n/en.ts`
```ts
// --- Countdown ---
'countdown.horizon': 'Major events',
'countdown.today': "It's today!",
'countdown.days': '{count} days',
'countdown.hours': '{count}h',
'countdown.minutes': '{count}m',
'countdown.seconds': '{count}s',
'countdown.viewCalendar': 'View calendar',

// --- Dhul-Hijjah ---
'dhulhijjah.title': '🌙 The 10 Days of Dhul-Hijjah',
'dhulhijjah.subtitle': 'Day {current} of 10',
'dhulhijjah.progress': '{current}/10',
'dhulhijjah.arafahFast': 'Fast of Arafah',
'dhulhijjah.arafahDescription': 'Fasting on the 9th of Dhul-Hijjah expiates the sins of the past and coming year.',
'dhulhijjah.ctaDhikr': '📿 Count the takbir',
'dhulhijjah.arafahDuas': 'Dua of Arafah',
'dhulhijjah.dayActions': 'Recommended actions',

// --- Special days ---
'specialday.tomorrow': 'Tomorrow',
'specialday.actionsTitle': 'Recommended actions',
'specialday.takbirPlay': 'Listen to the takbir',
'specialday.takbirStop': 'Stop',
'specialday.notifTodayTitle': '🎉 {name} — it\'s today!',
'specialday.notifTodayBody': 'Discover the recommended actions to make the most of this blessed day.',
'specialday.notifEveTitle': '🌙 Tomorrow: {name}',
'specialday.notifEveBody': 'Get ready: fasting, sadaqa and invocations.',
'notif.type.special': 'Special days',

// --- Event explanations ---
'hijri.details.title': 'About {name}',
'hijri.details.history': 'History',
'hijri.details.meaning': 'Meaning',
'hijri.details.practices': 'Recommended practices',

// --- Event quizzes ---
'quiz.button': '🧠 Quiz',
'quiz.score': '{score}/{total}',
'quiz.correct': '✅ Correct!',
'quiz.wrong': '❌ Incorrect',
'quiz.next': 'Next',
'quiz.finish': 'Finish',
'quiz.retry': 'Retry',
'quiz.title': 'Quiz: {name}',
```

### `client/src/i18n/ar.ts`
```ts
// --- العد التنازلي ---
'countdown.horizon': 'الأحداث الكبرى',
'countdown.today': 'إنه اليوم!',
'countdown.days': '{count} أيام',
'countdown.hours': '{count} س',
'countdown.minutes': '{count} د',
'countdown.seconds': '{count} ث',
'countdown.viewCalendar': 'عرض التقويم',

// --- ذو الحجة ---
'dhulhijjah.title': '🌙 الأيام العشر من ذي الحجة',
'dhulhijjah.subtitle': 'اليوم {current} من 10',
'dhulhijjah.progress': '{current}/10',
'dhulhijjah.arafahFast': 'صيام عرفة',
'dhulhijjah.arafahDescription': 'صيام يوم عرفة يكفر ذنوب العام الماضي والقادم.',
'dhulhijjah.ctaDhikr': '📿 عد التكبير',
'dhulhijjah.arafahDuas': 'دعاء عرفة',
'dhulhijjah.dayActions': 'الأعمال المستحبة',

// --- الأيام المميزة ---
'specialday.tomorrow': 'غداً',
'specialday.actionsTitle': 'الأعمال المستحبة',
'specialday.takbirPlay': 'استمع إلى التكبير',
'specialday.takbirStop': 'إيقاف',
'specialday.notifTodayTitle': '🎉 {name} — إنه اليوم!',
'specialday.notifTodayBody': 'اكتشف الأعمال المستحبة لتعيش هذا اليوم المبارك كاملاً.',
'specialday.notifEveTitle': '🌙 غداً: {name}',
'specialday.notifEveBody': 'استعد: صيام وصدقة وأدعية.',
'notif.type.special': 'أيام مميزة',

// --- شرح الأحداث ---
'hijri.details.title': 'عن {name}',
'hijri.details.history': 'التاريخ',
'hijri.details.meaning': 'المعنى',
'hijri.details.practices': 'الأعمال المستحبة',

// --- اختبار الأحداث ---
'quiz.button': '🧠 اختبار',
'quiz.score': '{score}/{total}',
'quiz.correct': '✅ صحيح!',
'quiz.wrong': '❌ خطأ',
'quiz.next': 'التالي',
'quiz.finish': 'إنهاء',
'quiz.retry': 'إعادة',
'quiz.title': 'اختبار: {name}',
```
