import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QUIZZES, verificationFor } from './quests.js';

test('QUIZZES : chaque quiz a une question, 3 options et une bonne reponse valide', () => {
  const types = Object.keys(QUIZZES);
  assert.ok(types.length >= 3, 'au moins 3 types de quetes avec quiz');
  for (const [type, quiz] of Object.entries(QUIZZES)) {
    assert.ok(quiz.q.trim().length > 0, type + ' : question non vide');
    assert.ok(quiz.options.length >= 3, type + ' : au moins 3 options');
    assert.ok(quiz.answer >= 0 && quiz.answer < quiz.options.length, type + ' : bonne reponse dans les bornes');
    assert.equal(new Set(quiz.options).size, quiz.options.length, type + ' : options uniques');
  }
});

test('verificationFor : priere et coran exiges, les autres non', () => {
  assert.deepEqual(verificationFor('prayer'), { kind: 'prayer' });
  assert.deepEqual(verificationFor('quran'), { kind: 'quran' });
  assert.equal(verificationFor('dhikr'), null);
  assert.equal(verificationFor('akhlaq'), null);
  assert.equal(verificationFor('inconnu'), null);
});
