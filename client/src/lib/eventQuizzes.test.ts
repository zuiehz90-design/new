import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ISLAMIC_EVENTS } from './hijriCalendar';
import { getEventQuiz, EVENT_QUIZZES } from './eventQuizzes';
import { EVENT_EXPLANATIONS, getEventExplanation } from './eventExplanations';

test('EVENT_QUIZZES : chaque question est valide (options uniques, bonne réponse dans les bornes)', () => {
  const keys = Object.keys(EVENT_QUIZZES);
  assert.ok(keys.length >= 8, 'au moins 8 événements avec quiz');
  for (const [key, questions] of Object.entries(EVENT_QUIZZES)) {
    assert.ok(questions.length >= 2, `${key} : au moins 2 questions`);
    for (const q of questions) {
      assert.ok(q.q.trim().length > 0, `${key} : question non vide`);
      assert.ok(q.options.length >= 3, `${key} : au moins 3 options`);
      assert.equal(new Set(q.options).size, q.options.length, `${key} : options uniques`);
      assert.ok(q.answer >= 0 && q.answer < q.options.length, `${key} : bonne réponse dans les bornes`);
      assert.ok(q.explain.trim().length > 0, `${key} : explication non vide`);
    }
  }
});

test('EVENT_QUIZZES : les clés correspondent à des événements réels du calendrier', () => {
  for (const key of Object.keys(EVENT_QUIZZES)) {
    const [month, day] = key.split('-').map(Number);
    const exists = ISLAMIC_EVENTS.some((e) => e.month === month && e.day === day);
    assert.ok(exists, `la clé ${key} correspond à un événement existant`);
  }
});

test('getEventQuiz : lecture par mois/jour, null si absent', () => {
  assert.ok(getEventQuiz(12, 10)?.length, 'Aïd al-Adha a un quiz');
  // Jours historiques couverts aussi (pas seulement les fêtes)
  assert.ok(getEventQuiz(1, 1)?.length, 'Nouvel an hégirien (historique) a un quiz');
  assert.ok(getEventQuiz(12, 11)?.length, 'Jours de Tashriq (historiques) ont un quiz');
  assert.ok(getEventQuiz(7, 27)?.length, 'Isra wal-Mi\u2019raj (historique) a un quiz');
  assert.equal(getEventQuiz(5, 5), null, 'jour sans événement : null');
});

test('EVENT_EXPLANATIONS : chaque événement du calendrier a une explication', () => {
  for (const e of ISLAMIC_EVENTS) {
    const details = getEventExplanation(e.month, e.day);
    assert.ok(details, `explication présente pour ${e.month}-${e.day}`);
    assert.ok(details!.history.trim().length > 20, `${e.month}-${e.day} : histoire renseignée`);
    assert.ok(details!.meaning.trim().length > 20, `${e.month}-${e.day} : signification renseignée`);
    assert.ok(details!.practices.length >= 2, `${e.month}-${e.day} : pratiques recommandées`);
  }
  assert.ok(Object.keys(EVENT_EXPLANATIONS).length === ISLAMIC_EVENTS.length, 'une explication par événement');
});
