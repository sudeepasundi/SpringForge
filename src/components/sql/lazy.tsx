import { lazy, Suspense } from 'react';
import type { SqlPlaygroundProps } from './SqlPlayground';
import type { SqlExerciseProps } from './SqlExercise';

/*
 * The MDX component map is part of every page, so the SQL runners are wired in
 * lazily: their code — and the SQLite engine they load — is fetched only when
 * a page actually contains one.
 */
const Playground = lazy(() => import('./SqlPlayground'));
const Exercise = lazy(() => import('./SqlExercise'));

function Placeholder({ label }: { label: string }) {
  return (
    <div className="sf-block rounded-[var(--radius-token)] border bg-[color:var(--sf-surface)] px-3.5 py-6 text-center text-[0.8rem] text-[color:var(--sf-text-faint)]">
      {label}
    </div>
  );
}

export function LazySqlPlayground(props: SqlPlaygroundProps) {
  return (
    <Suspense fallback={<Placeholder label="Loading the SQL playground…" />}>
      <Playground {...props} />
    </Suspense>
  );
}

export function LazySqlExercise(props: SqlExerciseProps) {
  return (
    <Suspense fallback={<Placeholder label="Loading the exercise…" />}>
      <Exercise {...props} />
    </Suspense>
  );
}
