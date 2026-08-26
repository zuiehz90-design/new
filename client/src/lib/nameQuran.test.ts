import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeQuranic, NAME_ROOTS, findNameVerses } from './nameQuran';
import { NAMES_99 } from './names99';

test('NAME_ROOTS couvre les 99 noms', () => {
  assert.equal(NAME_ROOTS.length, NAMES_99.length);
});

test('normalizeQuranic : unifie diacritiques, alif et wasla (table)', () => {
  const cases: Array<[string, string]> = [
    ['مَجِیدࣱ', 'مجيد'], // ی persan + harakat étendus
    ['أَحَدٌ', 'احد'],   // alif hamza
    ['ٱللّٰه', 'الله'],  // wasla + shadda
  ];
  for (const [input, expected] of cases) {
    assert.equal(normalizeQuranic(input), expected);
  }
});

test('findNameVerses : nom exact (Ar-Rahman → 1:1, 1:3)', async () => {
  const hits = await findNameVerses(0, NAMES_99[0].arabic, { limit: 3 });
  assert.ok(hits.length >= 2, 'au moins 2 versets');
  assert.ok(hits.some((h) => h.chapter === 1 && h.verse === 1), 'contient 1:1');
  assert.ok(hits.some((h) => h.chapter === 1 && h.verse === 3), 'contient 1:3');
  for (const h of hits) {
    assert.ok(h.translated.length > 0 && h.arabic.length > 0 && h.surahName.length > 0, 'champ complet');
  }
});

test('findNameVerses : repli manuel (Al-Majid الماجد → 85:15)', async () => {
  const hits = await findNameVerses(64, NAMES_99[64].arabic, { limit: 3 });
  assert.ok(hits.some((h) => h.chapter === 85 && h.verse === 15), 'contient 85:15');
});
