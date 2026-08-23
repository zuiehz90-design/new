import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translateExec, translateSql } from '../pgSql.js';

test('translateSql remplace les paramètres sans modifier les chaînes SQL', () => {
  const result = translateSql(
    "SELECT * FROM users WHERE name = ? AND profile_json = '?' AND id = ?",
    ['Aïcha', 4],
  );
  assert.equal(result.sql, "SELECT * FROM users WHERE name = $1 AND profile_json = '?' AND id = $2");
  assert.deepEqual(result.values, ['Aïcha', 4]);
});

test('translateSql traduit INSERT OR IGNORE et expose l id', () => {
  const result = translateSql(
    'INSERT OR IGNORE INTO prayers (user_id, date, prayer) VALUES (?, ?, ?)',
    [2, '2026-08-23', 'fajr'],
  );
  assert.match(result.sql, /^INSERT INTO prayers/);
  assert.match(result.sql, /ON CONFLICT DO NOTHING RETURNING id$/);
  assert.deepEqual(result.values, [2, '2026-08-23', 'fajr']);
});

test('translateSql respecte les modificateurs datetime SQLite', () => {
  const result = translateSql(
    "DELETE FROM users WHERE last_seen < datetime('now', ?)",
    ['-7 days'],
  );
  assert.match(result.sql, /now\(\) \+ \(\$1\)::interval/);
  assert.deepEqual(result.values, ['-7 days']);
});

test('translateExec ignore PRAGMA et convertit AUTOINCREMENT', () => {
  const statements = translateExec('PRAGMA foreign_keys = ON; CREATE TABLE x (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT);');
  assert.equal(statements.length, 1);
  assert.match(statements[0], /GENERATED ALWAYS AS IDENTITY PRIMARY KEY/);
});

test('translateSql refuse un nombre de paramètres incohérent', () => {
  assert.throws(() => translateSql('SELECT ?', []), /Nombre de paramètres SQL incorrect/);
});
