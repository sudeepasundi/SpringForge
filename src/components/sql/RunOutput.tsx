import { AlertCircle } from 'lucide-react';
import type { RunResult } from '@/lib/sql-results';
import { ResultTable } from './ResultTable';

export type Outcome = { kind: 'ok'; run: RunResult } | { kind: 'error'; message: string } | null;

/** The result sets of one run, "N rows affected", or the error. */
export function RunOutput({ outcome }: { outcome: Outcome }) {
  if (!outcome) return null;

  if (outcome.kind === 'error') {
    return (
      <div role="alert" className="flex gap-2 border-t px-3.5 py-3 text-[0.82rem] text-[color:var(--sf-danger)]">
        <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden />
        <span className="font-[family-name:var(--font-mono)] break-words">{outcome.message}</span>
      </div>
    );
  }

  const { results, rowsModified, ms } = outcome.run;
  return (
    <div className="border-t">
      {results.map((r, i) => (
        <ResultTable
          key={i}
          result={r}
          caption={results.length > 1 ? `Result ${i + 1} of ${results.length}` : undefined}
        />
      ))}
      {results.length === 0 && (
        <p className="m-0 px-3.5 py-2.5 text-[0.82rem] text-[color:var(--sf-text-muted)]">
          Done. {rowsModified} row{rowsModified === 1 ? '' : 's'} affected.
        </p>
      )}
      <p className="m-0 border-t px-3.5 py-1 text-right text-[0.66rem] text-[color:var(--sf-text-faint)]">
        {results.length > 0 && rowsModified > 0 && `${rowsModified} rows changed · `}
        {ms < 1 ? '<1' : Math.round(ms)} ms
      </p>
    </div>
  );
}
