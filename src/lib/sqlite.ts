import type { Database, SqlJsStatic } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm-browser.wasm?url';
import { getDataset } from '@/content/sql/datasets';

/**
 * SQLite compiled to WebAssembly, loaded on first use only — the engine is a
 * lazy chunk plus a ~650 KB wasm file that no other page pays for.
 */
let engine: Promise<SqlJsStatic> | null = null;

export function loadEngine(): Promise<SqlJsStatic> {
  engine ??= import('sql.js')
    .then(({ default: initSqlJs }) => initSqlJs({ locateFile: () => wasmUrl }))
    .catch((err: unknown) => {
      engine = null; // allow a retry after a network failure
      throw err;
    });
  return engine;
}

/** Each dataset is built once; every runner then gets its own copy of the bytes. */
const images = new Map<string, Promise<Uint8Array>>();

function image(SQL: SqlJsStatic, datasetId: string): Promise<Uint8Array> {
  let bytes = images.get(datasetId);
  if (!bytes) {
    const dataset = getDataset(datasetId);
    if (!dataset) return Promise.reject(new Error(`Unknown dataset "${datasetId}"`));
    bytes = Promise.resolve().then(() => {
      const db = new SQL.Database();
      db.exec('PRAGMA foreign_keys = ON;');
      db.exec(dataset.sql);
      const out = db.export();
      db.close();
      return out;
    });
    images.set(datasetId, bytes);
  }
  return bytes;
}

/** A fresh, private database holding the dataset. Close it when done. */
export async function openDataset(datasetId: string): Promise<Database> {
  const SQL = await loadEngine();
  const db = new SQL.Database(await image(SQL, datasetId));
  db.exec('PRAGMA foreign_keys = ON;'); // pragmas are per connection, not stored in the file
  return db;
}
