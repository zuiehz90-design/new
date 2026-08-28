import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isThinkingParagraph, ThinkingStreamFilter } from './thinkingFilter.js';

test('isThinkingParagraph : détecte le raisonnement en français', () => {
  assert.equal(isThinkingParagraph('Je dois donc compléter ma réponse précédente.'), true);
  assert.equal(isThinkingParagraph('Il repose la même question, je dois restructurer ma réponse.'), true);
  assert.equal(isThinkingParagraph('Je vais répondre à cette question avec des hadiths authentiques.'), true);
  assert.equal(isThinkingParagraph('Je vais utiliser des sources fiables et vérifier l\'authenticité.'), true);
  assert.equal(isThinkingParagraph('Je dois aussi vérifier l\'authenticité des hadiths avant de continuer.'), true);
});

test('isThinkingParagraph : réponse réelle non détectée', () => {
  assert.equal(isThinkingParagraph('Le Dhikr signifie « rappel » en arabe.'), false);
  assert.equal(isThinkingParagraph('Al hamdoulillah, je vais bien !'), false);
  assert.equal(isThinkingParagraph('Souvenez-vous de Moi donc, Je me souviendrai de vous. (2:152)'), false);
  assert.equal(isThinkingParagraph('Le meilleur dhikr est « La ilaha illa Allah ».'), false);
});

test('ThinkingStreamFilter : supprime le préambule de raisonnement', () => {
  const filter = new ThinkingStreamFilter();
  const out = filter.push("Je vais répondre à cette question.\n\nLe Dhikr est une pratique spirituelle.");
  assert.equal(out, '');
  assert.equal(filter.flush(), 'Le Dhikr est une pratique spirituelle.');
});

test('ThinkingStreamFilter : supprime le raisonnement au milieu de la réponse', () => {
  const filter = new ThinkingStreamFilter();
  const out = filter.push(
    "Le Dhikr est une pratique.\n\n" +
    "Je dois vérifier l'authenticité de ce hadith avant de continuer.\n\n" +
    "Le meilleur dhikr est « La ilaha illa Allah »."
  );
  assert.equal(out, "Le Dhikr est une pratique.\n\n");
  assert.equal(filter.flush(), 'Le meilleur dhikr est « La ilaha illa Allah ».');
});

test('ThinkingStreamFilter : flush renvoie le contenu restant', () => {
  const filter = new ThinkingStreamFilter();
  filter.push("Le Coran est la parole d'Allah");
  assert.equal(filter.flush(), "Le Coran est la parole d'Allah");
});

test('ThinkingStreamFilter : flush ignore un préambule de raisonnement non terminé', () => {
  const filter = new ThinkingStreamFilter();
  filter.push("Je vais restructurer ma réponse pour qu'elle soit complète");
  assert.equal(filter.flush(), '');
});
