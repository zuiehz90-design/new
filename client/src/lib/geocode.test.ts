import { test } from 'node:test';
import assert from 'node:assert/strict';
import { geoErrorKey, reverseGeocode, searchCity, shortPlaceName } from './geocode';

/** Remplace fetch par un mock (retourne le corps JSON fourni, statut par défaut 200). */
function mockFetch(handler: (url: string) => { status?: number; body: unknown }) {
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    const { status = 200, body } = handler(url);
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as unknown as typeof fetch;
  return () => {
    globalThis.fetch = original;
  };
}

test('searchCity construit l’URL Nominatim et parse les résultats', async () => {
  let called = '';
  const restore = mockFetch((url) => {
    called = url;
    return {
      body: [
        { lat: '45.7640', lon: '4.8357', display_name: 'Lyon, Rhône, Auvergne-Rhône-Alpes, France' },
        { lat: '45.7580', lon: '4.8350', display_name: 'Lyon 1er Arrondissement, Lyon, Rhône, France' },
      ],
    };
  });
  try {
    const res = await searchCity('  Lyon  ');
    assert.ok(called.includes('/search?'), 'URL de recherche');
    assert.ok(called.includes('q=Lyon'), 'requête encodée');
    assert.equal(res.length, 2);
    assert.equal(res[0].lat, 45.764);
    assert.equal(res[0].lng, 4.8357);
    assert.ok(res[0].name.startsWith('Lyon'));
  } finally {
    restore();
  }
});

test('searchCity retourne [] sans appel réseau pour une requête vide', async () => {
  let called = false;
  const restore = mockFetch(() => {
    called = true;
    return { body: [] };
  });
  try {
    const res = await searchCity('   ');
    assert.deepEqual(res, []);
    assert.equal(called, false, 'aucun fetch ne doit être émis');
  } finally {
    restore();
  }
});

test('searchCity lève une erreur sur réponse HTTP non-OK', async () => {
  const restore = mockFetch(() => ({ status: 503, body: {} }));
  try {
    await assert.rejects(() => searchCity('Lyon'));
  } finally {
    restore();
  }
});

test('shortPlaceName raccourcit un libellé complet', () => {
  assert.equal(shortPlaceName('Paris, Île-de-France, France'), 'Paris, Île-de-France');
  assert.equal(shortPlaceName('Casablanca, Casablanca-Settat, Maroc'), 'Casablanca, Casablanca-Settat');
  assert.equal(shortPlaceName('Seul'), 'Seul');
});

test('reverseGeocode retourne le nom court du lieu', async () => {
  const restore = mockFetch(() => ({ body: { display_name: 'Paris, Île-de-France, France' } }));
  try {
    assert.equal(await reverseGeocode(48.85, 2.35), 'Paris, Île-de-France');
  } finally {
    restore();
  }
});

test('reverseGeocode retourne null si le géocodage inverse échoue', async () => {
  const restore = mockFetch(() => ({ status: 500, body: {} }));
  try {
    assert.equal(await reverseGeocode(48.85, 2.35), null);
  } finally {
    restore();
  }
});

test('geoErrorKey mappe les codes d’erreur vers les clés i18n', () => {
  assert.equal(geoErrorKey(1), 'prayer.geoDenied');
  assert.equal(geoErrorKey(3), 'prayer.geoTimeout');
  assert.equal(geoErrorKey(2), 'prayer.geoUnavailable');
  assert.equal(geoErrorKey(99), 'prayer.geoUnavailable');
});
