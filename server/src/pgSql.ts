// =============================================================
// Traduction SQLite -> PostgreSQL (module pur, testable)
// =============================================================

export interface TranslatedSql {
  sql: string;
  values: unknown[];
}

const ID_TABLES = new Set([
  'users',
  'prayers',
  'quests',
  'conversations',
  'devotion_scores',
  'quest_completions',
  'achieved_badges',
]);

// Conserver le format texte utilisé par SQLite simplifie les comparaisons
// existantes (notamment expires_at > datetime('now')).
const DT_NOW = "to_char(now(), 'YYYY-MM-DD HH24:MI:SS')";

function translateDatetime(sql: string): string {
  return sql
    // SQLite modifier: datetime('now', ?), ex. '-7 days'.
    .replace(
      /datetime\(\s*'now'\s*,\s*\?\s*\)/gi,
      "to_char(now() + (?)::interval, 'YYYY-MM-DD HH24:MI:SS')",
    )
    // SQLite modifier: datetime('now', '-1 hour').
    .replace(
      /datetime\(\s*'now'\s*,\s*'([^']+)'\s*\)/gi,
      (_match, offset: string) =>
        "to_char(now() + interval '" + offset.replace(/'/g, "''") + "', 'YYYY-MM-DD HH24:MI:SS')",
    )
    .replace(/datetime\(\s*'now'\s*\)/gi, DT_NOW);
}

/** Traduit une requête DML/SELECT avec les paramètres positionnels SQLite. */
export function translateSql(raw: string, params: unknown[] = []): TranslatedSql {
  let sql = raw.trim().replace(/;\s*$/, '');

  if (/^insert\s+or\s+ignore\s+into\b/i.test(sql)) {
    sql = sql.replace(/^insert\s+or\s+ignore\s+into\b/i, 'INSERT INTO');
    sql += ' ON CONFLICT DO NOTHING';
  }

  sql = translateDatetime(sql);

  if (!/\breturning\b/i.test(sql)) {
    const match = /^\s*insert\s+into\s+([a-z_][a-z0-9_]*)/i.exec(sql);
    if (match && ID_TABLES.has(match[1].toLowerCase())) sql += ' RETURNING id';
  }

  // Remplace ? par $1, $2... sans toucher aux chaînes SQL ni identifiants.
  const values: unknown[] = [];
  let output = '';
  let parameterIndex = 0;
  let i = 0;
  while (i < sql.length) {
    const char = sql[i];
    if (char === "'") {
      let end = i + 1;
      while (end < sql.length) {
        if (sql[end] === "'") {
          if (sql[end + 1] === "'") end += 2;
          else { end++; break; }
        } else end++;
      }
      output += sql.slice(i, end);
      i = end;
      continue;
    }
    if (char === '"') {
      let end = i + 1;
      while (end < sql.length) {
        if (sql[end] === '"') {
          if (sql[end + 1] === '"') end += 2;
          else { end++; break; }
        } else end++;
      }
      output += sql.slice(i, end);
      i = end;
      continue;
    }
    if (char === '?') {
      parameterIndex++;
      values.push(params[parameterIndex - 1]);
      output += '$' + parameterIndex;
    } else {
      output += char;
    }
    i++;
  }

  if (parameterIndex !== params.length) {
    throw new Error(`Nombre de paramètres SQL incorrect : ${parameterIndex} attendu(s), ${params.length} reçu(s).`);
  }

  return { sql: output, values };
}

/** Traduit un bloc DDL ou transaction utilisé par db.exec(). */
export function translateExec(raw: string): string[] {
  return raw
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean)
    .map((statement) => {
      if (/^pragma\b/i.test(statement)) return '';
      if (/^(begin|commit|rollback)\b/i.test(statement)) return statement.toUpperCase();
      return translateDatetime(statement).replace(
        /\bint(?:eger)?\s+primary\s+key\s+autoincrement\b/gi,
        'GENERATED ALWAYS AS IDENTITY PRIMARY KEY',
      );
    })
    .filter(Boolean);
}
