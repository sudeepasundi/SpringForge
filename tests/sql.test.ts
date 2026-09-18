// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';
import { datasets } from '@/content/sql/datasets';
import { questionSets } from '@/content/qa';
import { compareResults, runScript } from '@/lib/sql-results';

/**
 * Every runnable query in the SQL section — playgrounds, exercise solutions
 * and Q&A answers — is executed here against the real sample datasets, in the
 * same SQLite build the browser uses. A typo in a column name fails the build
 * instead of greeting a reader with an error.
 */

let SQL: SqlJsStatic;

beforeAll(async () => {
  const wasmBinary = readFileSync(join(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm'));
  SQL = await initSqlJs({ wasmBinary: wasmBinary.buffer as ArrayBuffer });
});

function open(datasetId: string): Database {
  const dataset = datasets.find((d) => d.id === datasetId);
  if (!dataset) throw new Error(`Unknown dataset "${datasetId}"`);
  const db = new SQL.Database();
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(dataset.sql);
  return db;
}

const CHAPTERS = join(process.cwd(), 'src/content/sql/chapters');
const files = readdirSync(CHAPTERS).filter((f) => f.endsWith('.mdx'));

interface Runnable {
  where: string;
  dataset: string;
  sql: string;
  expectError: boolean;
  exercise: boolean;
}

function attr(block: string, name: string): string | undefined {
  return new RegExp(`\\s${name}="([^"]*)"`).exec(block)?.[1];
}

function template(block: string, name: string): string | undefined {
  return new RegExp(`\\s${name}=\\{\`([\\s\\S]*?)\`\\}`).exec(block)?.[1];
}

function runnables(): Runnable[] {
  const out: Runnable[] = [];
  for (const file of files) {
    const source = readFileSync(join(CHAPTERS, file), 'utf8');
    for (const m of source.matchAll(/<(SqlPlayground|SqlExercise)\b([\s\S]*?)\/>/g)) {
      const [, kind, block] = m;
      const line = source.slice(0, m.index).split('\n').length;
      const exercise = kind === 'SqlExercise';
      out.push({
        where: `${file}:${line}`,
        dataset: attr(block!, 'dataset') ?? '(missing)',
        sql: (exercise ? template(block!, 'solution') : template(block!, 'query')) ?? '',
        expectError: /\sexpectError\b/.test(block!),
        exercise,
      });
    }
  }
  return out;
}

describe('SQL datasets', () => {
  it.each(datasets.map((d) => [d.id]))('%s builds with intact integrity and foreign keys', (id) => {
    const db = open(id);
    expect(db.exec('PRAGMA integrity_check')[0]?.values[0]?.[0]).toBe('ok');
    expect(db.exec('PRAGMA foreign_key_check')).toEqual([]);
    db.close();
  });
});

describe('SQL chapter examples', () => {
  const all = runnables();

  it('finds examples to run', () => {
    expect(all.length).toBeGreaterThan(80);
  });

  it('name real datasets and have SQL', () => {
    const known = new Set(datasets.map((d) => d.id));
    const bad = all.filter((r) => !known.has(r.dataset as 'shop' | 'hr') || !r.sql.trim()).map((r) => r.where);
    expect(bad).toEqual([]);
  });

  it('run without errors (or fail when marked expectError)', () => {
    const bad: string[] = [];
    for (const r of all) {
      const db = open(r.dataset);
      try {
        runScript(db, r.sql);
        if (r.expectError) bad.push(`${r.where}: expected an error, but it ran`);
      } catch (err) {
        if (!r.expectError) bad.push(`${r.where}: ${(err as Error).message}`);
      } finally {
        db.close();
      }
    }
    expect(bad).toEqual([]);
  });

  it('have exercise solutions that return rows', () => {
    const empty: string[] = [];
    for (const r of all.filter((x) => x.exercise)) {
      const db = open(r.dataset);
      const last = runScript(db, r.sql).results.at(-1);
      if (!last || last.values.length === 0) empty.push(r.where);
      db.close();
    }
    expect(empty).toEqual([]);
  });
});

describe('SQL answers in the Q&A', () => {
  const answers = questionSets.flatMap((s) =>
    s.questions.filter((q) => q.code?.dataset).map((q) => ({ id: q.id, ...q.code! })),
  );

  it('include runnable answers', () => {
    expect(answers.length).toBeGreaterThan(10);
  });

  it('run against their dataset', () => {
    const bad: string[] = [];
    for (const a of answers) {
      const db = open(a.dataset!);
      try {
        runScript(db, a.code);
      } catch (err) {
        bad.push(`${a.id}: ${(err as Error).message}`);
      } finally {
        db.close();
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('compareResults', () => {
  const r = (values: (string | number | null)[][]) => ({ columns: values[0]?.map((_, i) => `c${i}`) ?? ['c0'], values });

  it('ignores row order unless asked', () => {
    expect(compareResults(r([[1], [2]]), r([[2], [1]]), false).equal).toBe(true);
    expect(compareResults(r([[1], [2]]), r([[2], [1]]), true).equal).toBe(false);
  });

  it('tolerates floating-point noise and ignores column names', () => {
    const a = { columns: ['total'], values: [[59.970000000000006]] };
    const e = { columns: ['sum'], values: [[59.97]] };
    expect(compareResults(a, e, true).equal).toBe(true);
  });

  it('explains row and column count differences', () => {
    expect(compareResults(r([[1]]), r([[1], [2]]), false).reason).toMatch(/2 rows, got 1/);
    expect(compareResults(r([[1, 2]]), r([[1]]), false).reason).toMatch(/1 column, got 2/);
  });
});
