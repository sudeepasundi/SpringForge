import type { QueryExecResult, SqlValue } from 'sql.js';
import { cn } from '@/lib/cn';

const MAX_ROWS = 200;

function Cell({ value }: { value: SqlValue }) {
  if (value === null) {
    return <span className="text-[color:var(--sf-text-faint)] italic">NULL</span>;
  }
  if (value instanceof Uint8Array) return <span>[blob {value.length} bytes]</span>;
  if (typeof value === 'number' && !Number.isInteger(value)) {
    // Show binary floating-point results the way a person would write them.
    return <>{Number(value.toFixed(6))}</>;
  }
  return <>{String(value)}</>;
}

/** One result set as a table that scrolls inside its own box. */
export function ResultTable({ result, caption }: { result: QueryExecResult; caption?: string }) {
  const rows = result.values.slice(0, MAX_ROWS);
  return (
    <div className="min-w-0">
      {caption && (
        <p className="m-0 px-3 pt-2 text-[0.7rem] font-semibold tracking-[0.08em] text-[color:var(--sf-text-faint)] uppercase">
          {caption}
        </p>
      )}
      <div className="max-h-[22rem] overflow-auto">
        <table className="w-full border-collapse font-[family-name:var(--font-mono)] text-[0.78rem]">
          <thead className="sticky top-0 bg-[color:var(--sf-surface-2)]">
            <tr>
              {result.columns.map((c, i) => (
                <th
                  key={`${c}-${i}`}
                  className="border-b px-3 py-1.5 text-left font-semibold whitespace-nowrap text-[color:var(--sf-text)]"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r} className="even:bg-[color:var(--sf-surface-2)]/40">
                {row.map((value, i) => (
                  <td
                    key={i}
                    className={cn(
                      'border-b px-3 py-1 whitespace-nowrap text-[color:var(--sf-text-muted)]',
                      typeof value === 'number' && 'text-right tabular-nums',
                    )}
                  >
                    <Cell value={value} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="m-0 border-t px-3 py-1.5 text-[0.7rem] text-[color:var(--sf-text-faint)]">
        {result.values.length} row{result.values.length === 1 ? '' : 's'}
        {result.values.length > MAX_ROWS && ` (showing the first ${MAX_ROWS})`}
      </p>
    </div>
  );
}
