import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { makeCacheKey, getCached, setCached, getCacheStats } from './aiCache.js';

describe('aiCache', () => {
  it('makeCacheKey retourne null pour conversation trop longue', () => {
    const messages = Array.from({ length: 10 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i} avec du contenu suffisamment long pour être testé`,
    }));
    assert.equal(makeCacheKey(messages), null);
  });

  it('makeCacheKey retourne null si le message user est trop court', () => {
    const messages = [{ role: 'system', content: 'system' }, { role: 'user', content: 'hi' }];
    assert.equal(makeCacheKey(messages), null);
  });

  it('makeCacheKey retourne null si le message user est trop long', () => {
    const longMsg = 'a'.repeat(400);
    const messages = [{ role: 'user', content: longMsg }];
    assert.equal(makeCacheKey(messages), null);
  });

  it('makeCacheKey retourne une clé valide pour une conversation courte', () => {
    const messages = [
      { role: 'system', content: 'system' },
      { role: 'user', content: 'Quels sont les cinq piliers de l\'islam ?' },
    ];
    const key = makeCacheKey(messages);
    assert.ok(key);
    assert.ok(typeof key === 'string');
    assert.ok(key.length === 16);
  });

  it('makeCacheKey retourne la même clé pour la même question (normalisée)', () => {
    const m1 = [{ role: 'user', content: '  Quels sont les  cinq  Piliers ?  ' }];
    const m2 = [{ role: 'user', content: 'Quels sont les cinq Piliers ?' }];
    assert.equal(makeCacheKey(m1), makeCacheKey(m2));
  });

  it('getCached retourne null sur miss', () => {
    const key = makeCacheKey([{ role: 'user', content: 'question unique test xyz 123' }]);
    assert.ok(key);
    assert.equal(getCached(key), null);
  });

  it('setCached puis getCached retourne la réponse', () => {
    const key = makeCacheKey([{ role: 'user', content: 'test cache hit unique abc' }]);
    assert.ok(key);
    setCached(key, 'Réponse de test', 'test-model', 100);
    const cached = getCached(key);
    assert.ok(cached);
    assert.equal(cached.response, 'Réponse de test');
    assert.equal(cached.model, 'test-model');
    assert.equal(cached.tokens, 100);
  });

  it('getCacheStats retourne les statistiques', () => {
    const stats = getCacheStats();
    assert.ok(typeof stats.size === 'number');
    assert.ok(typeof stats.hits === 'number');
    assert.ok(typeof stats.misses === 'number');
    assert.ok(typeof stats.hitRate === 'number');
  });
});
