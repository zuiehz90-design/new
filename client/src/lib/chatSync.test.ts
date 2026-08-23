import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decideSync } from './chatSync.js';
import type { Conversation } from './types.js';

function conv(id: string, updatedAt: number): Conversation {
  return { id, title: id, messages: [], createdAt: updatedAt, updatedAt };
}

test('decideSync : rien à synchroniser', () => {
  assert.equal(decideSync([], []), 'none');
});

test('decideSync : premier appareil avec historique local -> upload (adoption)', () => {
  assert.equal(decideSync([conv('a', 100)], []), 'upload');
});

test('decideSync : nouvel appareil vide -> download depuis le serveur', () => {
  assert.equal(decideSync([], [conv('a', 100)]), 'download');
});

test('decideSync : serveur plus récent -> download', () => {
  assert.equal(decideSync([conv('a', 100)], [conv('a', 200)]), 'download');
});

test('decideSync : local plus récent -> upload', () => {
  assert.equal(decideSync([conv('a', 200)], [conv('a', 100)]), 'upload');
});

test('decideSync : à égalité -> none', () => {
  assert.equal(decideSync([conv('a', 100)], [conv('a', 100)]), 'none');
});

test('decideSync : serveur vide mais liste locale différente -> none si local aussi vide', () => {
  assert.equal(decideSync([], []), 'none');
});
