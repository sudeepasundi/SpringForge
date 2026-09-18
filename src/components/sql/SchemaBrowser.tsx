import { useMemo } from 'react';
import type { Database } from 'sql.js';

interface Column {
  name: string;
  type: string;
  pk: boolean;
  notNull: boolean;
}

interface Table {
  name: string;
  rows: number;
  columns: Column[];
  references: string[];
}

function readSchema(db: Database): Table[] {
  const names = (db.exec(
    "SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  )[0]?.values ?? []).map((r) => String(r[0]));

  return names.map((name) => {
    const quoted = `"${name.replace(/"/g, '""')}"`;
    const columns = (db.exec(`PRAGMA table_info(${quoted})`)[0]?.values ?? []).map((r) => ({
      name: String(r[1]),
      type: String(r[2] || ''),
      notNull: r[3] === 1,
      pk: Number(r[5]) > 0,
    }));
    const references = (db.exec(`PRAGMA foreign_key_list(${quoted})`)[0]?.values ?? []).map(
      (r) => `${String(r[3])} → ${String(r[2])}.${String(r[4])}`,
    );
    const rows = Number(db.exec(`SELECT COUNT(*) FROM ${quoted}`)[0]?.values[0]?.[0] ?? 0);
    return { name, rows, columns, references };
  });
}

/** Tables, columns, keys and row counts of the runner's current database. */
export function SchemaBrowser({ db, version }: { db: Database; version: number }) {
  // `version` changes after each run, so tables created by the reader appear.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tables = useMemo(() => readSchema(db), [db, version]);

  return (
    <div className="grid gap-2 p-3 sm:grid-cols-2">
      {tables.map((t) => (
        <div key={t.name} className="min-w-0 rounded-md border bg-[color:var(--sf-surface)] px-3 py-2">
          <p className="m-0 flex items-baseline justify-between gap-2 font-[family-name:var(--font-mono)] text-[0.8rem] font-semibold">
            {t.name}
            <span className="text-[0.68rem] font-normal text-[color:var(--sf-text-faint)]">
              {t.rows} rows
            </span>
          </p>
          <ul className="m-0 mt-1 list-none space-y-0.5 p-0 font-[family-name:var(--font-mono)] text-[0.72rem] text-[color:var(--sf-text-muted)]">
            {t.columns.map((c) => (
              <li key={c.name} className="flex gap-2">
                <span className={c.pk ? 'font-semibold text-[color:var(--sf-accent-text)]' : ''}>
                  {c.name}
                </span>
                <span className="text-[color:var(--sf-text-faint)]">
                  {c.type.toLowerCase()}
                  {c.pk ? ' · pk' : ''}
                  {c.notNull && !c.pk ? ' · not null' : ''}
                </span>
              </li>
            ))}
          </ul>
          {t.references.length > 0 && (
            <p className="m-0 mt-1 font-[family-name:var(--font-mono)] text-[0.68rem] break-words text-[color:var(--sf-text-faint)]">
              {t.references.join(' · ')}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
