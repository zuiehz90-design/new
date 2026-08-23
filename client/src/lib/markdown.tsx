import { memo, useMemo } from 'react';
import { useI18n } from '../i18n';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
import type { Root, Element, Text } from 'hast';

/* ------------------------------------------------------------------ */
/* Normalisation défensive de la réponse IA avant affichage            */
/* ------------------------------------------------------------------ */
export function normalizeAssistantContent(text: string): string {
  if (!text) return '';
  return text
    // Retire les caractères de contrôle (sauf \t et \n)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    // Uniformise les retours à la ligne Windows / ancien Mac
    .replace(/\r\n?/g, '\n')
    .trim();
}

/* ------------------------------------------------------------------ */
/* Lien Coran : « Sourate X:Y » ou « X:Y » -> /quran?surah=X&verse=Y */
/* ------------------------------------------------------------------ */
const QURAN_REF = /(?:Sourate\s+)?(\d{1,3})\s*[:\u060C]\s*(\d{1,3})/g;

/**
 * Plugin rehype : remplace dans les nœuds texte les références coraniques
 * par des liens internes. S'applique aussi à l'intérieur des cellules de
 * tableau et des listes générés par l'IA.
 */
function quranRefsPlugin() {
  return (tree: Root) => {
    visit(tree, 'text', (node, index, parent) => {
      if (index === undefined || parent === undefined) return;
      // Ne pas traiter le texte d'un lien déjà existant (évite les liens imbriqués)
      if (parent.type === 'element' && parent.tagName === 'a') return;
      const text = node.value;
      QURAN_REF.lastIndex = 0;
      let m: RegExpExecArray | null;
      let last = 0;
      const parts: Array<Text | Element> = [];
      while ((m = QURAN_REF.exec(text)) !== null) {
        const surah = parseInt(m[1], 10);
        const verse = parseInt(m[2], 10);
        if (m.index > last) parts.push({ type: 'text', value: text.slice(last, m.index) });
        if (surah >= 1 && surah <= 114) {
          parts.push({
            type: 'element',
            tagName: 'a',
            properties: {
              className: ['quran-ref'],
              href: `/quran?surah=${surah}&verse=${verse}`,
            },
            children: [{ type: 'text', value: m[0] }],
          });
        } else {
          parts.push({ type: 'text', value: m[0] });
        }
        last = m.index + m[0].length;
      }
      if (parts.length === 0) return;
      if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });
      parent.children.splice(index, 1, ...parts);
    });
  };
}

/* ------------------------------------------------------------------ */
/* Composants stylés (thème or/émeraude, alignement GFM)               */
/* ------------------------------------------------------------------ */
const components: Components = {
  h2: ({ children }) => (
    <h2 className="text-lg font-bold text-gold-400 mt-4 mb-1">{children}</h2>
  ),
  // Tableaux GFM : défilement horizontal sur mobile, cellules avec retour à la ligne
  table: ({ children }) => (
    <div className="md-table-wrap">
      <table className="md-table">{children}</table>
    </div>
  ),
  th: ({ children, style }) => (
    <th scope="col" className="md-th" style={style}>
      {children}
    </th>
  ),
  td: ({ children, style }) => (
    <td className="md-td" style={style}>
      {children}
    </td>
  ),
  // Liens externes : nouvel onglet ; liens internes (Coran) : navigation SPA
  a: ({ href, children, className }) =>
    href?.startsWith('/') ? (
      <a href={href} className={className}>
        {children}
      </a>
    ) : (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
};

/* ------------------------------------------------------------------ */
/* Sources : extraction des references citees par l'IA                 */
/* ------------------------------------------------------------------ */

export interface Source {
  kind: 'quran' | 'hadith';
  label: string;
  href: string;
  key: string;
}

// « 2:255 », « Sourate 2 : 255 », « 2، 255 », « Sourate 2, verset 255 »
const QURAN_SOURCE_RE = /(?:Sourate\s+)?(\d{1,3})\s*(:|،|,)\s*(?:verset\s+)?(\d{1,3})/g;
// « Boukhari n° 6015 », « Muslim 2677 », « Sahih al-Boukhari n° 6015 »
const HADITH_SOURCE_RE = /(Sahih\s+)?(?:al-)?(Boukhari|Bukhari|Muslim|Tirmidhi|Tirmizi|Abou\s+Daoud|Abu\s+Dawud|Ibn\s+Mâja|Ibn\s+Majah|An-Nasai|Nasai|Ahmad|Mâlik|Malik)\s*(?:n°|nº|no|#|N°)?\s*(\d{1,5})/gi;

/** Extrait les sources (Coran + hadiths) d'une reponse IA, dedupliquees. */
export function extractSources(text: string): Source[] {
  const out: Source[] = [];
  const seen = new Set<string>();

  QURAN_SOURCE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = QURAN_SOURCE_RE.exec(text)) !== null) {
    const surah = parseInt(m[1], 10);
    const verse = parseInt(m[3], 10);
    // « 2, 255 » sans « verset » n'est pas une reference (faux positif)
    if (m[2] === ',' && !m[0].includes('verset')) continue;
    if (surah < 1 || surah > 114 || verse < 1) continue;
    const key = 'q:' + surah + ':' + verse;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ kind: 'quran', label: 'Coran ' + surah + ':' + verse, key, href: '/quran?surah=' + surah + '&verse=' + verse });
  }

  HADITH_SOURCE_RE.lastIndex = 0;
  while ((m = HADITH_SOURCE_RE.exec(text)) !== null) {
    const coll = (m[2] || '').toLowerCase().replace(/\s+/g, '-');
    const num = m[3];
    const key = 'h:' + coll + ':' + num;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      kind: 'hadith',
      label: m[2] + ' ' + num,
      key,
      href: 'https://sunnah.com/search?q=' + encodeURIComponent(coll + ' ' + num),
    });
  }

  return out;
}

/** Carte « Sources » mise en valeur, affichee a la fin de chaque reponse IA. */
export function SourcesCard({ text }: { text: string }) {
  const { t } = useI18n();
  const sources = useMemo(() => extractSources(text), [text]);
  if (sources.length === 0) return null;
  return (
    <div className="md-sources">
      <p className="md-sources-title">📚 {t('chat.sources')}</p>
      <div className="flex flex-wrap gap-1.5">
        {sources.map((s) =>
          s.kind === 'quran' ? (
            <a key={s.key} href={s.href} className="source-chip" title={t('chat.sourcesOpenQuran')}>
              {s.label}
            </a>
          ) : (
            <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" className="source-chip" title={t('chat.sourcesOpenHadith')}>
              {s.label}
            </a>
          ),
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Composant public : <Markdown text="..." />                          */
/* ------------------------------------------------------------------ */
function MarkdownImpl({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[quranRefsPlugin]}
      components={components}
    >
      {normalizeAssistantContent(text)}
    </ReactMarkdown>
  );
}

export const Markdown = memo(MarkdownImpl);
