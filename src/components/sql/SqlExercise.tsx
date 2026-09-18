import { useState } from 'react';
import type { QueryExecResult } from 'sql.js';
import { CheckCircle2, Eye, Lightbulb, Loader2, PencilLine, RotateCcw, XCircle } from 'lucide-react';
import { compareResults, runScript, type Comparison } from '@/lib/sql-results';
import { SqlEditor } from './SqlEditor';
import { ToolbarButton } from './SqlPlayground';
import { ResultTable } from './ResultTable';
import { RunOutput, type Outcome } from './RunOutput';
import { withFreshDatabase } from './useSqlDatabase';

export interface SqlExerciseProps {
  dataset: string;
  prompt: string;
  solution: string;
  hint?: string;
  /** Starting text for the editor. */
  starter?: string;
  /** Require rows in the same order as the solution (for ORDER BY exercises). */
  ordered?: boolean;
}

type Check = { outcome: Outcome; comparison: Comparison | null; expected: QueryExecResult | undefined };

/**
 * The reader writes a query; it runs on a fresh copy of the dataset and its
 * last result set is compared with the solution's, by value.
 */
export function SqlExercise({ dataset, prompt, solution, hint, starter, ordered = false }: SqlExerciseProps) {
  const initial = starter?.trim() ?? '-- write your query here\n';
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [check, setCheck] = useState<Check | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showExpected, setShowExpected] = useState(false);

  async function onCheck() {
    setBusy(true);
    try {
      const expected = await withFreshDatabase(dataset, (db) => runScript(db, solution).results.at(-1));
      let outcome: Outcome;
      let comparison: Comparison | null = null;
      try {
        const run = await withFreshDatabase(dataset, (db) => runScript(db, text));
        outcome = { kind: 'ok', run };
        comparison = compareResults(run.results.at(-1), expected, ordered);
      } catch (err) {
        outcome = { kind: 'error', message: err instanceof Error ? err.message : String(err) };
      }
      setCheck({ outcome, comparison, expected });
    } catch (err) {
      setCheck({
        outcome: { kind: 'error', message: `Could not load the SQL engine: ${err instanceof Error ? err.message : String(err)}` },
        comparison: null,
        expected: undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  const verdict = check?.comparison;

  return (
    <div className="sf-block overflow-hidden rounded-[var(--radius-token)] border-2 border-[color:var(--sf-accent-soft)] bg-[color:var(--sf-surface)]">
      <div className="border-b bg-[color:var(--sf-surface-2)] px-3.5 py-2.5">
        <p className="m-0 flex items-center gap-1.5 text-[0.68rem] font-semibold tracking-[0.1em] text-[color:var(--sf-accent-text)] uppercase">
          <PencilLine size={12} aria-hidden /> Exercise
        </p>
        <p className="mt-1 mb-0 text-[0.9rem] leading-relaxed text-[color:var(--sf-text)]">{prompt}</p>
      </div>

      <SqlEditor value={text} onChange={setText} onRun={() => void onCheck()} label="Your answer" minRows={4} />

      <div className="flex flex-wrap items-center gap-1.5 border-t bg-[color:var(--sf-surface-2)] px-3 py-2">
        <ToolbarButton primary onClick={() => void onCheck()} disabled={busy}>
          {busy ? <Loader2 size={13} className="animate-spin" aria-hidden /> : <CheckCircle2 size={13} aria-hidden />}
          Check
        </ToolbarButton>
        {hint && (
          <ToolbarButton onClick={() => setShowHint((s) => !s)} pressed={showHint}>
            <Lightbulb size={13} aria-hidden /> Hint
          </ToolbarButton>
        )}
        <ToolbarButton onClick={() => setShowSolution((s) => !s)} pressed={showSolution}>
          <Eye size={13} aria-hidden /> Solution
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            setText(initial);
            setCheck(null);
          }}
        >
          <RotateCcw size={13} aria-hidden /> Reset
        </ToolbarButton>
        <span className="ml-auto text-[0.66rem] text-[color:var(--sf-text-faint)]">
          {ordered ? 'Row order matters' : 'Any row order'}
        </span>
      </div>

      {showHint && hint && (
        <p className="m-0 border-t px-3.5 py-2.5 text-[0.84rem] text-[color:var(--sf-text-muted)]">
          <strong>Hint:</strong> {hint}
        </p>
      )}

      {showSolution && (
        <pre className="m-0 overflow-x-auto border-t bg-[color:var(--sf-code-bg)] px-3.5 py-3 font-[family-name:var(--font-mono)] text-[0.8rem] leading-[1.6] text-[color:var(--sf-text)]">
          {solution.trim()}
        </pre>
      )}

      {verdict && (
        <div
          role="status"
          className="flex items-start gap-2 border-t px-3.5 py-2.5 text-[0.86rem] font-medium"
          style={{ color: verdict.equal ? 'var(--sf-accent-text)' : 'var(--sf-danger)' }}
        >
          {verdict.equal ? (
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden />
          ) : (
            <XCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
          )}
          <span>
            {verdict.equal ? 'Correct — your result matches.' : `Not yet. ${verdict.reason ?? ''}`}
            {!verdict.equal && check?.expected && (
              <button
                type="button"
                onClick={() => setShowExpected((s) => !s)}
                className="ml-2 text-[0.78rem] font-normal text-[color:var(--sf-text-muted)] underline underline-offset-2"
              >
                {showExpected ? 'Hide expected result' : 'Show expected result'}
              </button>
            )}
          </span>
        </div>
      )}

      {check && <RunOutput outcome={check.outcome} />}

      {showExpected && check?.expected && !verdict?.equal && (
        <div className="border-t">
          <ResultTable result={check.expected} caption="Expected result" />
        </div>
      )}
    </div>
  );
}

export default SqlExercise;
