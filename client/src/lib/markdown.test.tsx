import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Markdown, normalizeAssistantContent, extractSources } from './markdown';

function render(text: string): string {
  return renderToStaticMarkup(h(Markdown, { text }));
}

/* ------------------------------------------------------------------ */
/* Tableaux GFM                                                        */
/* ------------------------------------------------------------------ */
test('un tableau GFM est rendu avec <table>, <th> et <td>', () => {
  const html = render('| Nom | Valeur |\n|---|---|\n| Alpha | 12 |\n| Beta | 4 |');
  assert.match(html, /<table/);
  assert.match(html, /<th/);
  assert.match(html, /<td/);
  assert.match(html, /Alpha/);
  assert.match(html, /md-table-wrap/);
});

test('la ligne séparatrice du tableau ne rend pas de <hr>', () => {
  const html = render('| A | B |\n|---|---|\n| 1 | 2 |');
  assert.ok(!html.includes('<hr'), 'le séparateur de tableau ne doit pas devenir un <hr>');
});

test('l’alignement GFM des colonnes est respecté', () => {
  const html = render('| A | B | C |\n| :--- | ---: | :---: |\n| 1 | 2 | 3 |');
  assert.match(html, /text-align:left/);
  assert.match(html, /text-align:right/);
  assert.match(html, /text-align:center/);
});

test('un <hr> isolé reste bien un <hr>', () => {
  const html = render('Texte\n\n---\n\nSuite');
  assert.match(html, /<hr/);
});

/* ------------------------------------------------------------------ */
/* Robustesse (streaming, tableaux malformés)                          */
/* ------------------------------------------------------------------ */
test('un tableau malformé (sans séparateur) ne casse pas et ne rend pas de table', () => {
  const html = render('| A | B |\n| 1 | 2 |');
  assert.ok(!html.includes('<table'));
  assert.ok(html.includes('| A | B |'));
});

test('un tableau partiel (streaming en cours) ne casse pas', () => {
  const html = render('| A | B |\n|---');
  assert.ok(!html.includes('<table'));
});

test('une réponse non terminée est rendue sans erreur', () => {
  const html = render('Voici un tableau en cours de');
  assert.ok(html.includes('tableau'));
});

/* ------------------------------------------------------------------ */
/* Liens Coran                                                         */
/* ------------------------------------------------------------------ */
test('une référence coranique devient un lien interne', () => {
  const html = render('Voir Sourate 2:255 pour le verset du Trône.');
  assert.match(html, /href="\/quran\?surah=2&amp;verse=255"/);
  assert.match(html, /quran-ref/);
});

test('une référence coranique n’est pas imbriquée dans un autre lien', () => {
  const html = render('Voir Sourate 2:255 pour le verset du Trône.');
  const links = html.match(/<a /g) ?? [];
  assert.equal(links.length, 1, 'un seul lien doit être généré');
});

test('une référence coranique dans une cellule de tableau devient un lien', () => {
  const html = render('| Sourate | Contenu |\n|---|---|\n| Sourate 2:255 | Ayat al-Kursi |');
  assert.match(html, /href="\/quran\?surah=2&amp;verse=255"/);
});

test('une référence hors bornes (sourate 200) ne devient pas un lien', () => {
  const html = render('Sourate 200:1 n’existe pas.');
  assert.ok(!html.includes('quran-ref'));
});

test('une référence coranique dans un bloc de code reste un lien (comportement historique)', () => {
  const html = render('`2:255`');
  assert.match(html, /href="\/quran\?surah=2&amp;verse=255"/);
});

/* ------------------------------------------------------------------ */
/* Liens externes                                                      */
/* ------------------------------------------------------------------ */
test('un lien externe s’ouvre dans un nouvel onglet avec rel=noopener', () => {
  const html = render('[source](https://example.com)');
  assert.match(html, /href="https:\/\/example\.com"/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener noreferrer"/);
});

/* ------------------------------------------------------------------ */
/* Régression : fonctionnalités markdown existantes                    */
/* ------------------------------------------------------------------ */
test('titres, gras, italique et listes restent rendus', () => {
  const html = render('### Titre\n\n**gras** et *italique*\n\n- un\n- deux');
  assert.match(html, /<h3>/);
  assert.match(html, /<strong>/);
  assert.match(html, /<em>/);
  assert.match(html, /<ul>/);
  assert.match(html, /<li>/);
});

test('le titre h2 conserve son style or existant', () => {
  const html = render('## Titre');
  assert.match(html, /text-lg font-bold text-gold-400/);
});

test('les citations et lignes horizontales restent rendues', () => {
  const html = render('> Citation\n\n---');
  assert.match(html, /<blockquote>/);
  assert.match(html, /<hr/);
});

/* ------------------------------------------------------------------ */
/* Normalisation du contenu                                            */
/* ------------------------------------------------------------------ */
test('normalizeAssistantContent retire les caractères de contrôle et trime', () => {
  assert.equal(normalizeAssistantContent('  bonjour\u0000monde\u0007  '), 'bonjourmonde');
});

test('normalizeAssistantContent normalise les retours à la ligne Windows', () => {
  assert.equal(normalizeAssistantContent('ligne1\r\nligne2\rligne3'), 'ligne1\nligne2\nligne3');
});

test('normalizeAssistantContent conserve les tabulations et sauts de ligne', () => {
  assert.equal(normalizeAssistantContent('a\tb\nc'), 'a\tb\nc');
});

/* ------------------------------------------------------------------ */
/* Extraction des sources (Coran + hadiths)                            */
/* ------------------------------------------------------------------ */
test('extractSources : references coraniques (X:Y, Sourate X:Y)', () => {
  const r = extractSources('Voir Sourate 2:255 et 2، 255 ainsi que Sourate 18, verset 10.');
  const quran = r.filter((s) => s.kind === 'quran');
  // 2:255 apparait deux fois mais est deduplique
  assert.equal(quran.length, 2);
  assert.deepEqual(quran.map((s) => s.label), ['Coran 2:255', 'Coran 18:10']);
  assert.equal(quran[0].href, '/quran?surah=2&verse=255');
});

test('extractSources : deduplique les references identiques', () => {
  const r = extractSources('2:255 puis encore 2:255.');
  assert.equal(r.filter((s) => s.kind === 'quran').length, 1);
});

test('extractSources : pas de faux positif sur « 2, 255 » sans verset', () => {
  const r = extractSources('Les points sont 2, 255 et 3, 14.');
  assert.equal(r.length, 0);
});

test('extractSources : hadiths cliquables vers sunnah.com', () => {
  const r = extractSources('Selon Boukhari n° 6015 et Muslim 2677, ainsi que Sahih al-Boukhari n° 102.');
  const hadiths = r.filter((s) => s.kind === 'hadith');
  assert.equal(hadiths.length, 3);
  assert.ok(hadiths[0].href.startsWith('https://sunnah.com/search?q='));
  assert.match(hadiths[0].label, /Boukhari 6015/);
});

test('extractSources : ignore les nombres hors bornes (sourate 200)', () => {
  const r = extractSources('200:10 et 0:5.');
  assert.equal(r.length, 0);
});

test('extractSources : mélange Coran + hadith dans une réponse complète', () => {
  const r = extractSources('Allah dit (2:255). Le Prophète a dit (Boukhari n° 6015).');
  assert.equal(r.length, 2);
  assert.deepEqual(r.map((s) => s.kind), ['quran', 'hadith']);
});
