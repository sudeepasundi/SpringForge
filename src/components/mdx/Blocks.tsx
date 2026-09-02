import type { ReactNode } from 'react';
import { CheckCircle2, ThumbsDown, ThumbsUp, Terminal as TerminalIcon } from 'lucide-react';
import { CopyButton } from './CodeSurface';
import { cn } from '@/lib/cn';

/**
 * Anti-pattern vs. correct pattern, side by side.
 *
 * Authored with children rather than props so that MDX parses the panel bodies
 * as markdown — fenced code blocks inside a JSX *attribute* would not be.
 *
 *     <Compare>
 *       <Bad title="Avoid">…markdown…</Bad>
 *       <Good title="Prefer">…markdown…</Good>
 *     </Compare>
 */
export function Compare({ children }: { children: ReactNode }) {
  return <div className="sf-block grid gap-3 lg:grid-cols-2">{children}</div>;
}

function Panel({
  kind,
  title,
  children,
}: {
  kind: 'bad' | 'good';
  title: string;
  children: ReactNode;
}) {
  const Icon = kind === 'bad' ? ThumbsDown : ThumbsUp;
  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-[var(--radius-token)] border">
      <p
        className={cn(
          'm-0 flex items-center gap-1.5 border-b px-3.5 py-2 text-[0.72rem] font-semibold tracking-[0.08em] uppercase',
          kind === 'bad'
            ? 'bg-[color:var(--sf-danger-soft)] text-[color:var(--sf-danger)]'
            : 'bg-[color:var(--sf-accent-soft)] text-[color:var(--sf-accent-text)]',
        )}
      >
        <Icon size={13} strokeWidth={2.4} /> {title}
      </p>
      <div className="flex-1 [&>*+*]:mt-3 [&>figure]:my-0! [&>figure]:rounded-none! [&>figure]:border-x-0! [&>figure]:border-b-0! [&>figure]:shadow-none! [&>p]:px-3.5 [&>p]:pt-3 [&>p]:text-[0.86rem] [&>p]:leading-relaxed [&>p]:text-[color:var(--sf-text-muted)] [&>ul]:px-3.5 [&>ul]:pt-3 [&>ul]:text-[0.86rem]">
        {children}
      </div>
    </div>
  );
}

export function Bad({ title = 'Avoid', children }: { title?: string; children: ReactNode }) {
  return (
    <Panel kind="bad" title={title}>
      {children}
    </Panel>
  );
}

export function Good({ title = 'Prefer', children }: { title?: string; children: ReactNode }) {
  return (
    <Panel kind="good" title={title}>
      {children}
    </Panel>
  );
}

/** Closes every lesson. Deliberately terse — these are the sentences to remember. */
export function KeyTakeaways({ points }: { points: string[] }) {
  return (
    <section className="sf-block rounded-[var(--radius-token)] border-2 border-[color:var(--sf-accent)] bg-[color:var(--sf-accent-soft)] px-5 py-4">
      <h3 className="m-0! flex items-center gap-2 border-0! p-0! text-[0.75rem]! font-semibold! tracking-[0.1em] text-[color:var(--sf-accent-text)]! uppercase">
        <CheckCircle2 size={15} /> Key takeaways
      </h3>
      <ul className="mt-3 mb-0 grid list-none gap-2.5 p-0">
        {points.map((p) => (
          <li key={p} className="flex gap-2.5 text-[0.92rem] leading-relaxed">
            <span
              aria-hidden
              className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--sf-accent)]"
            />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Shell transcript. `$` lines are commands, everything else is output. */
export function Terminal({ title = 'terminal', children }: { title?: string; children: string }) {
  const text = String(children).replace(/^\n+|\s+$/g, '');
  const commands = text
    .split('\n')
    .filter((l) => l.trimStart().startsWith('$'))
    .map((l) => l.trimStart().slice(1).trim())
    .join('\n');

  return (
    <div className="sf-block overflow-hidden rounded-[var(--radius-token)] border bg-[color:var(--sf-code-bg)] shadow-[var(--sf-shadow)]">
      <div className="flex items-center justify-between gap-3 border-b bg-[color:var(--sf-surface-2)] px-3.5 py-2">
        <span className="flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-[0.72rem] text-[color:var(--sf-text-muted)]">
          <TerminalIcon size={12} /> {title}
        </span>
        <CopyButton text={commands || text} />
      </div>
      <pre className="m-0 overflow-x-auto px-4 py-3.5 font-[family-name:var(--font-mono)] text-[0.82rem] leading-[1.7]">
        {text.split('\n').map((line, i) => {
          const isCmd = line.trimStart().startsWith('$');
          return (
            <div key={`${i}-${line}`} className={cn(!isCmd && 'text-[color:var(--sf-text-muted)]')}>
              {isCmd ? (
                <>
                  <span className="mr-2 select-none text-[color:var(--sf-accent)]">$</span>
                  <span className="text-[color:var(--sf-text)]">
                    {line.trimStart().slice(1).trim()}
                  </span>
                </>
              ) : (
                line || ' '
              )}
            </div>
          );
        })}
      </pre>
    </div>
  );
}

/** Numbered procedure with a connecting rail — for setup and migration steps. */
export function Steps({ children }: { children: ReactNode }) {
  return (
    <ol className="sf-block m-0 list-none space-y-0 p-0 [counter-reset:step]">{children}</ol>
  );
}

export function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="relative border-l-2 pb-6 pl-7 last:border-l-transparent last:pb-0 [counter-increment:step]">
      <span
        aria-hidden
        className="absolute top-0 -left-[0.9rem] flex h-[1.7rem] w-[1.7rem] items-center justify-center rounded-full border-2 border-[color:var(--sf-accent)] bg-[color:var(--sf-bg)] text-[0.72rem] font-bold text-[color:var(--sf-accent-text)] before:content-[counter(step)]"
      />
      <p className="mt-0.5 mb-2 text-[1rem] font-semibold">{title}</p>
      <div className="[&>*+*]:mt-3 [&>*:first-child]:mt-0">{children}</div>
    </li>
  );
}

/** A trade-off table with a verdict column — used for "which should I pick" moments. */
export function DecisionTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: { label: string; cells: string[]; verdict?: 'good' | 'bad' | 'mixed' }[];
}) {
  const tone = {
    good: 'var(--sf-accent)',
    bad: 'var(--sf-danger)',
    mixed: 'var(--sf-warn)',
  } as const;

  return (
    <div className="sf-block overflow-x-auto rounded-[var(--radius-token)] border">
      <table className="w-full border-collapse text-[0.86rem]">
        <thead className="bg-[color:var(--sf-surface-2)]">
          <tr>
            <th className="px-3.5 py-2.5 text-left font-semibold" />
            {columns.map((c) => (
              <th key={c} className="px-3.5 py-2.5 text-left font-semibold whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t">
              <th
                scope="row"
                className="border-l-[3px] px-3.5 py-2.5 text-left font-medium whitespace-nowrap"
                style={{ borderLeftColor: row.verdict ? tone[row.verdict] : 'transparent' }}
              >
                {row.label}
              </th>
              {row.cells.map((cell, i) => (
                <td
                  key={`${row.label}-${i}`}
                  className="px-3.5 py-2.5 align-top text-[color:var(--sf-text-muted)]"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Wrapper for hand-authored inline SVG figures. */
export function Figure({ caption, children }: { caption?: string; children: ReactNode }) {
  return (
    <figure className="sf-block overflow-hidden rounded-[var(--radius-token)] border bg-[color:var(--sf-surface)] shadow-[var(--sf-shadow)]">
      <div className="overflow-x-auto px-4 py-5">{children}</div>
      {caption && (
        <figcaption className="border-t bg-[color:var(--sf-surface-2)] px-4 py-2.5 text-center text-[0.8rem] text-[color:var(--sf-text-muted)]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
