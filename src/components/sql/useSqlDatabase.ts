import { useCallback, useEffect, useState } from 'react';
import type { Database } from 'sql.js';
import { openDataset } from '@/lib/sqlite';

type State =
  | { status: 'loading' }
  | { status: 'ready'; db: Database }
  | { status: 'error'; message: string };

/**
 * A private copy of a dataset for one runner. `reset` throws away every change
 * the reader made and opens a fresh copy.
 */
export function useSqlDatabase(datasetId: string) {
  const [generation, setGeneration] = useState(0);
  const key = `${datasetId}#${generation}`;
  // The settled result, tagged with the database it belongs to; anything
  // else (a newer key, nothing yet) reads as "loading".
  const [settled, setSettled] = useState<{ key: string; state: State } | null>(null);

  useEffect(() => {
    let cancelled = false;
    let opened: Database | null = null;
    openDataset(datasetId).then(
      (db) => {
        if (cancelled) {
          db.close();
          return;
        }
        opened = db;
        setSettled({ key, state: { status: 'ready', db } });
      },
      (err: unknown) => {
        if (!cancelled) {
          setSettled({
            key,
            state: { status: 'error', message: err instanceof Error ? err.message : String(err) },
          });
        }
      },
    );
    return () => {
      cancelled = true;
      opened?.close();
    };
  }, [datasetId, key]);

  const reset = useCallback(() => setGeneration((g) => g + 1), []);
  const state: State = settled?.key === key ? settled.state : { status: 'loading' };

  return { state, reset };
}

/** Opens a throwaway copy, runs `work`, and always closes it. */
export async function withFreshDatabase<T>(datasetId: string, work: (db: Database) => T): Promise<T> {
  const db = await openDataset(datasetId);
  try {
    return work(db);
  } finally {
    db.close();
  }
}
