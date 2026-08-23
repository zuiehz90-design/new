import { test } from 'node:test';
import assert from 'node:assert/strict';
import { storageKey, migrateLegacyData, claimPendingData, MIGRATION_FLAG } from './storageScope.js';

function fakeLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => { store.set(k, String(v)); },
    removeItem: (k: string) => { store.delete(k); },
  };
}

test('storageKey formate la clé par identité', () => {
  assert.equal(storageKey('guest', 'conversations'), 'nour:guest:conversations');
  assert.equal(storageKey('u7', 'readingPositions'), 'nour:u7:readingPositions');
});

test('migrateLegacyData : déplace les anciennes clés vers pending, jamais exposées à l’invité', () => {
  const ls = fakeLocalStorage();
  (globalThis as any).localStorage = ls;
  ls.setItem('nour:conversations', JSON.stringify([{ id: 'c1' }]));
  ls.setItem('nour:activeChat', '"c1"');
  ls.setItem('nour:readingPositions', '{"2":7}');
  ls.setItem('nour:coords', '{"lat":48.85,"lng":2.35}');
  migrateLegacyData();
  assert.equal(ls.getItem('nour:conversations'), null);
  assert.equal(ls.getItem('nour:activeChat'), null);
  assert.equal(ls.getItem('nour:readingPositions'), null);
  assert.equal(ls.getItem('nour:coords'), null);
  assert.equal(ls.getItem('nour:pending:conversations'), JSON.stringify([{ id: 'c1' }]));
  assert.equal(ls.getItem('nour:pending:activeChat'), '"c1"');
  assert.equal(ls.getItem('nour:pending:readingPositions'), '{"2":7}');
  assert.equal(ls.getItem('nour:pending:coords'), '{"lat":48.85,"lng":2.35}');
  assert.ok(ls.getItem(MIGRATION_FLAG));
});

test('migrateLegacyData : idempotent — ne migre qu’une fois', () => {
  const ls = fakeLocalStorage();
  (globalThis as any).localStorage = ls;
  ls.setItem('nour:readingPositions', '{"2":7}');
  migrateLegacyData();
  ls.setItem('nour:coords', '{"lat":1}');
  migrateLegacyData();
  assert.equal(ls.getItem('nour:pending:readingPositions'), '{"2":7}');
  assert.equal(ls.getItem('nour:pending:coords'), null);
  assert.equal(ls.getItem('nour:coords'), '{"lat":1}');
});

test('claimPendingData : attribue les anciennes données au premier compte connecté', () => {
  const ls = fakeLocalStorage();
  (globalThis as any).localStorage = ls;
  ls.setItem('nour:pending:conversations', JSON.stringify([{ id: 'c1' }]));
  ls.setItem('nour:pending:activeChat', '"c1"');
  claimPendingData(5);
  assert.equal(ls.getItem('nour:u5:conversations'), JSON.stringify([{ id: 'c1' }]));
  assert.equal(ls.getItem('nour:u5:activeChat'), '"c1"');
  assert.equal(ls.getItem('nour:pending:conversations'), null);
  assert.equal(ls.getItem('nour:pending:activeChat'), null);
});

test('claimPendingData : ne remplace jamais les données existantes du compte', () => {
  const ls = fakeLocalStorage();
  (globalThis as any).localStorage = ls;
  ls.setItem('nour:pending:conversations', JSON.stringify([{ id: 'ancien' }]));
  ls.setItem('nour:u5:conversations', JSON.stringify([{ id: 'deja-la' }]));
  claimPendingData(5);
  assert.equal(ls.getItem('nour:u5:conversations'), JSON.stringify([{ id: 'deja-la' }]));
  assert.equal(ls.getItem('nour:pending:conversations'), null);
});

test('claimPendingData : laisse le mode invité intact', () => {
  const ls = fakeLocalStorage();
  (globalThis as any).localStorage = ls;
  ls.setItem('nour:pending:conversations', '["legacy"]');
  ls.setItem('nour:guest:conversations', JSON.stringify([{ id: 'guest-chat' }]));
  claimPendingData(3);
  assert.equal(ls.getItem('nour:guest:conversations'), JSON.stringify([{ id: 'guest-chat' }]));
  assert.equal(ls.getItem('nour:u3:conversations'), '["legacy"]');
});
