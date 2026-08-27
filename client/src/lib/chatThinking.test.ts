import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stripThinkingPreamble } from './api';

test('stripThinkingPreamble : réponse normale → intacte', () => {
  const text = "Salam ! Voici une introduction à l'islam.\n\nL'islam est une religion de paix.";
  assert.equal(stripThinkingPreamble(text), text);
});

test('stripThinkingPreamble : préambule de raisonnement coupé', () => {
  const text =
    "Okay, the user just said \"Parle moi de l'islam\" which means \"Talk to me about Islam\" in French. Let me recall the guidelines. I need to be warm, natural, and helpful.\n\n" +
    "First, I should start with the core beliefs: Tawhid, prophethood, and the Quran. Maybe mention the Five Pillars.\n\n" +
    "Salam ! L'islam repose sur cinq piliers fondamentaux.";
  const cleaned = stripThinkingPreamble(text);
  assert.ok(cleaned !== null);
  assert.equal(cleaned, "Salam ! L'islam repose sur cinq piliers fondamentaux.");
});

test('stripThinkingPreamble : réponse courte en français préservée', () => {
  const text = 'Al hamdoulillah, je vais bien !';
  assert.equal(stripThinkingPreamble(text), text);
});

test('stripThinkingPreamble : tout est du raisonnement → null', () => {
  const text =
    'Let me recall the guidelines. I need to be warm, natural, and helpful. ' +
    'The user might be new to Islam or just curious. I should avoid jargon but still be accurate.';
  assert.equal(stripThinkingPreamble(text), null);
});

test('stripThinkingPreamble : texte vide → vide', () => {
  assert.equal(stripThinkingPreamble(''), '');
});
