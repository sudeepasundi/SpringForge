import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Database as DbIcon, Loader2, Play, RotateCcw, Table2 } from 'lucide-react';
import { getDataset } from '@/content/sql/datasets';
import { runScript } from '@/lib/sql-results';
import { cn } from '@/lib/cn';
import { SqlEditor } from './SqlEditor';
import { SchemaBrowser } from './SchemaBrowser';
import { RunOutput, type Outcome } from './RunOutput';
import { useSqlDatabase } from './useSqlDatabase';

export interface SqlPlaygroundProps {
  dataset: string;
  query: string;
  title?: string;
  /** Run the initial query as soon as the engine is ready (default true). */
  autoRun?: boolean;
  /** Show the schema browser open by default. */
  showSchema?: boolean;
  /** The example demonstrates an error on purpose; tests/sql.test.ts asserts it fails. */
  expectError?: boolean;
}

export function ToolbarButton({
  onClick,
  disabled,
  children,
  primary,
  pressed,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  primary?: boolean;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      className={cn(
        'flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[0.74rem] font-medium transition disabled:opacity-50',
        primary
          ? 'border-[color:var(--sf-accent)] bg-[color:var(--sf-accent)] text-[color:var(--sf-bg)] hover:opacity-90'
          : 'bg-[color:var(--sf-surface)] text-[color:var(--sf-text-muted)] hover:text-[color:var(--sf-text)]',
        pressed && 'border-[color:var(--sf-accent)] text-[color:var(--sf-accent-text)]',
      )}
    >
      {children}
    </button>
  );
}

/**
 * An editable query against a private copy of a sample dataset. Nothing the
 * reader runs can affect another example; Reset restores both query and data.
 */
export function SqlPlayground({ dataset, query, title, autoRun = true, showSchema = false }: SqlPlaygroundProps) {
  const initial = query.trim();
  const [text, setText] = useState(initial);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [schemaOpen, setSchemaOpen] = useState(showSchema);
  const [version, setVersion] = useState(0);
  const { state, reset } = useSqlDatabase(dataset);
  const ranInitially = useRef(false);
  const meta = getDataset(dataset);

  const run = useCallback(
    (sql: string) => {
      if (state.status !== 'ready') return;
      try {
        setOutcome({ kind: 'ok', run: runScript(state.db, sql) });
      } catch (err) {
        setOutcome({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
      }
      setVersion((v) => v + 1);
    },
    [state],
  );

  useEffect(() => {
    if (state.status === 'ready' && autoRun && !ranInitially.current) {
      ranInitially.current = true;
      run(initial);
    }
  }, [state, autoRun, initial, run]);

  const onReset = () => {
    setText(initial);
    setOutcome(null);
    ranInitially.current = false;
    reset();
  };

  return (
    <div className="sf-block overflow-hidden rounded-[var(--radius-token)] border bg-[color:var(--sf-surface)] shadow-[var(--sf-shadow)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-[color:var(--sf-surface-2)] px-3 py-2">
        <p className="m-0 flex min-w-0 items-center gap-1.5 text-[0.74rem] text-[color:var(--sf-text-muted)]">
          <DbIcon size={13} aria-hidden className="shrink-0" />
          <span className="truncate">
            {title ?? 'Try it'} · <span className="font-medium">{meta?.title ?? dataset}</span> data · SQLite
          </span>
        </p>
        <div className="flex items-center gap-1.5">
          <ToolbarButton onClick={() => setSchemaOpen((o) => !o)} pressed={schemaOpen} disabled={state.status !== 'ready'}>
            <Table2 size={13} aria-hidden /> Schema
          </ToolbarButton>
          <ToolbarButton onClick={onReset}>
            <RotateCcw size={13} aria-hidden /> Reset
          </ToolbarButton>
          <ToolbarButton primary onClick={() => run(text)} disabled={state.status !== 'ready'}>
            {state.status === 'loading' ? (
              <Loader2 size={13} className="animate-spin" aria-hidden />
            ) : (
              <Play size={13} aria-hidden />
            )}
            Run
          </ToolbarButton>
        </div>
      </div>

      {schemaOpen && state.status === 'ready' && (
        <div className="max-h-80 overflow-auto border-b bg-[color:var(--sf-bg-subtle)]">
          <SchemaBrowser db={state.db} version={version} />
        </div>
      )}

      <SqlEditor value={text} onChange={setText} onRun={() => run(text)} label="SQL query" />

      {state.status === 'loading' && (
        <p className="m-0 border-t px-3.5 py-2.5 text-[0.8rem] text-[color:var(--sf-text-faint)]">
          Loading SQLite…
        </p>
      )}
      {state.status === 'error' && (
        <p role="alert" className="m-0 border-t px-3.5 py-2.5 text-[0.8rem] text-[color:var(--sf-danger)]">
          Could not load the SQL engine: {state.message}
        </p>
      )}
      <RunOutput outcome={outcome} />
      <p className="m-0 border-t px-3.5 py-1 text-[0.66rem] text-[color:var(--sf-text-faint)]">
        Ctrl/⌘ + Enter runs · changes stay in this box until you reset
      </p>
    </div>
  );
}

export default SqlPlayground;
