import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseConversationsPayload } from './conversations.js';

const validConv = {
  id: 'c1',
  title: 'Ma prière',
  messages: [
    { id: 'm1', role: 'user', content: 'Bonjour', createdAt: 1 },
    { id: 'm2', role: 'assistant', content: 'Salam', createdAt: 2 },
  ],
  createdAt: 1,
  updatedAt: 2,
};

test('parseConversationsPayload : payload invalide -> null', () => {
  assert.equal(parseConversationsPayload(null), null);
  assert.equal(parseConversationsPayload(undefined), null);
  assert.equal(parseConversationsPayload('nope'), null);
  assert.equal(parseConversationsPayload({}), null);
  assert.equal(parseConversationsPayload({ conversations: 'x' }), null);
});

test('parseConversationsPayload : liste valide nettoyée', () => {
  const r = parseConversationsPayload({ conversations: [validConv] });
  assert.ok(r && r.length === 1);
  assert.equal(r[0].id, 'c1');
  assert.equal(r[0].title, 'Ma prière');
  assert.equal(r[0].messages.length, 2);
  assert.equal(r[0].messages[1].content, 'Salam');
  assert.equal(r[0].updatedAt, 2);
});

test('parseConversationsPayload : filtre les entrées invalides', () => {
  const r = parseConversationsPayload({
    conversations: [
      validConv,
      { id: '', title: 'x', messages: [] },
      { id: 'ok-no-msgs', title: 'x', messages: 'not-array' },
      'garbage',
      null,
      { id: 'ok-empty', title: 'vide', messages: [] },
    ],
  });
  assert.ok(r && r.length === 2);
  assert.deepEqual(r.map((c) => c.id), ['c1', 'ok-empty']);
});

test('parseConversationsPayload : normalise les champs manquants', () => {
  const r = parseConversationsPayload({ conversations: [{ id: 'c2', messages: [] }] });
  assert.ok(r && r.length === 1);
  assert.equal(r[0].title, 'Nouvelle conversation');
  assert.equal(typeof r[0].createdAt, 'number');
  assert.equal(typeof r[0].updatedAt, 'number');
});

test('parseConversationsPayload : ignore les messages au rôle inconnu, garde offline', () => {
  const r = parseConversationsPayload({
    conversations: [{
      id: 'c3',
      messages: [
        { id: 'a', role: 'user', content: 'x' },
        { id: 'b', role: 'moderator', content: 'x' },
        { id: 'c', role: 'assistant', content: 'y', offline: true },
      ],
    }],
  });
  assert.ok(r && r[0].messages.length === 2);
  assert.equal(r[0].messages[1].offline, true);
});

test('parseConversationsPayload : limite le nombre de conversations et de messages', () => {
  const many = Array.from({ length: 150 }, (_, i) => ({ ...validConv, id: 'c' + i }));
  const r = parseConversationsPayload({ conversations: many });
  assert.ok(r && r.length === 100);

  const long = { ...validConv, messages: Array.from({ length: 700 }, (_, i) => ({ id: 'm' + i, role: 'user', content: 'x' })) };
  const r2 = parseConversationsPayload({ conversations: [long] });
  assert.ok(r2 && r2[0].messages.length === 500);
});

test('parseConversationsPayload : tronque les contenus trop longs', () => {
  const r = parseConversationsPayload({
    conversations: [{ id: 'c4', messages: [{ id: 'm1', role: 'user', content: 'z'.repeat(60_000) }] }],
  });
  assert.ok(r && r[0].messages[0].content.length === 50_000);
});
