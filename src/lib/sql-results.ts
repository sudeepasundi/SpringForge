import type { Database, QueryExecResult, SqlValue } from 'sql.js';

/** What running a script produced: every result set, plus rows changed by writes. */
export interface RunResult {
  results: QueryExecResult[];
  rowsModified: number;
  ms: number;
}

/** Runs one or more statements. Throws the engine's error unchanged. */
export function runScript(db: Database, sql: string): RunResult {
  const started = performance.now();
  const before = db.exec('SELECT total_changes()')[0]?.values[0]?.[0] as number;
  const results = db.exec(sql);
  const after = db.exec('SELECT total_changes()')[0]?.values[0]?.[0] as number;
  return { results, rowsModified: after - before, ms: performance.now() - started };
}

/** Numbers compared to 6 decimal places, so 59.97 and 59.970000000000006 match. */
function normalise(value: SqlValue): string {
  if (value === null) return 'NULL';
  if (typeof value === 'number') return String(Math.round(value * 1e6) / 1e6);
  if (value instanceof Uint8Array) return `blob:${value.length}`;
  return String(value);
}

function rowsOf(result: QueryExecResult | undefined): string[] {
  return (result?.values ?? []).map((row) => row.map(normalise).join('␟'));
}

export interface Comparison {
  equal: boolean;
  /** Human-readable reason when the results differ. */
  reason?: string;
}

/**
 * Compares the last result set of two runs by value. Column names are ignored
 * (an alias is not wrong); row order matters only when `ordered` is set.
 */
export function compareResults(
  actual: QueryExecResult | undefined,
  expected: QueryExecResult | undefined,
  ordered: boolean,
): Comparison {
  if (!actual) return { equal: false, reason: 'Your query returned no result set.' };
  const expectedColumns = expected?.columns.length ?? 0;
  if (actual.columns.length !== expectedColumns) {
    return {
      equal: false,
      reason: `Expected ${expectedColumns} column${expectedColumns === 1 ? '' : 's'}, got ${actual.columns.length}.`,
    };
  }
  const a = rowsOf(actual);
  const e = rowsOf(expected);
  if (a.length !== e.length) {
    return { equal: false, reason: `Expected ${e.length} row${e.length === 1 ? '' : 's'}, got ${a.length}.` };
  }
  const same = ordered
    ? a.every((row, i) => row === e[i])
    : [...a].sort().join('\n') === [...e].sort().join('\n');
  if (!same) {
    return {
      equal: false,
      reason: ordered
        ? 'Same number of rows, but different values or a different order.'
        : 'Same number of rows, but different values.',
    };
  }
  return { equal: true };
}
