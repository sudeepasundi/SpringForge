import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { ChevronDown, Eye, Lightbulb, Lock, Puzzle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface StageProps {
  title: string;
  /** What the reader should try before revealing the stage. */
  prompt: string;
  children: ReactNode;
}

/**
 * One step of a Walkthrough. It renders nothing on its own: the Walkthrough
 * reads its props and decides what is visible.
 */
export function Stage(_props: StageProps) {
  return null;
}

/**
 * A worked problem that unfolds one stage at a time. Each stage shows its
 * prompt first — the reader is meant to try — and reveals the thinking on
 * request. Later stages stay locked until the earlier ones are open.
 */
export function Walkthrough({
  title,
  problem,
  children,
}: {
  title: string;
  problem: string;
  children: ReactNode;
}) {
  const stages = Children.toArray(children).filter(
    (c): c is ReactElement<StageProps> => isValidElement(c) && c.type === Stage,
  );
  // How many stages have had their thinking revealed.
  const [revealed, setRevealed] = useState(0);
  const justRevealed = useRef<number | null>(null);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const i = justRevealed.current;
    if (i === null) return;
    justRevealed.current = null;
    contentRefs.current[i]?.focus({ preventScroll: true });
  }, [revealed]);

  const reveal = (i: number) => {
    justRevealed.current = i;
    setRevealed(i + 1);
  };

  const done = revealed >= stages.length;

  return (
    <section
      aria-label={`Walkthrough: ${title}`}
      className="sf-block overflow-hidden rounded-[var(--radius-token)] border bg-[color:var(--sf-surface)] shadow-[var(--sf-shadow)]"
    >
      <header className="border-b bg-[color:var(--sf-surface-2)] px-4 py-3">
        <p className="m-0 flex items-center gap-1.5 text-[0.68rem] font-semibold tracking-[0.1em] text-[color:var(--sf-accent-text)] uppercase">
          <Puzzle size={12} aria-hidden /> Walkthrough
        </p>
        <p className="mt-1 mb-0 text-[1.02rem] font-semibold text-[color:var(--sf-text)]">{title}</p>
        <p className="mt-1 mb-0 text-[0.9rem] leading-relaxed text-[color:var(--sf-text-muted)]">{problem}</p>
      </header>

      <ol className="m-0 list-none p-0">
        {stages.map((stage, i) => {
          const { title: stageTitle, prompt, children: body } = stage.props;
          const open = i < revealed;
          const current = i === revealed;
          const locked = i > revealed;
          return (
            <li key={i} className={cn('border-b last:border-b-0', locked && 'opacity-55')}>
              <div className="flex items-start gap-3 px-4 pt-3 pb-2">
                <span
                  aria-hidden
                  className={cn(
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[0.72rem] font-semibold',
                    open
                      ? 'border-[color:var(--sf-accent)] bg-[color:var(--sf-accent)] text-[color:var(--sf-bg)]'
                      : 'text-[color:var(--sf-text-muted)]',
                  )}
                >
                  {locked ? <Lock size={11} /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-[0.94rem] font-semibold text-[color:var(--sf-text)]">
                    Step {i + 1}: {stageTitle}
                  </p>
                  {!locked && (
                    <p className="mt-1 mb-0 flex gap-1.5 text-[0.86rem] leading-relaxed text-[color:var(--sf-text-muted)]">
                      <Lightbulb size={14} aria-hidden className="mt-0.5 shrink-0 text-[color:var(--sf-warn)]" />
                      <span>{prompt}</span>
                    </p>
                  )}
                  {current && (
                    <button
                      type="button"
                      aria-expanded={false}
                      onClick={() => reveal(i)}
                      className="mt-2 mb-1 flex items-center gap-1.5 rounded-md border border-[color:var(--sf-accent)] bg-[color:var(--sf-accent-soft)] px-2.5 py-1 text-[0.78rem] font-medium text-[color:var(--sf-accent-text)] transition hover:opacity-90"
                    >
                      <Eye size={13} aria-hidden /> Show my thinking
                    </button>
                  )}
                </div>
              </div>
              {open && (
                <div
                  ref={(el) => {
                    contentRefs.current[i] = el;
                  }}
                  tabIndex={-1}
                  className="px-4 pb-4 pl-[3.25rem] outline-none [&>*+*]:mt-3 [&>*:first-child]:mt-0"
                >
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <footer className="flex flex-wrap items-center gap-2 border-t bg-[color:var(--sf-surface-2)] px-4 py-2">
        <span className="text-[0.72rem] text-[color:var(--sf-text-faint)]">
          {Math.min(revealed, stages.length)} of {stages.length} steps shown
        </span>
        <span className="ml-auto flex gap-2">
          {!done && (
            <button
              type="button"
              onClick={() => setRevealed(stages.length)}
              className="rounded-md border bg-[color:var(--sf-surface)] px-2.5 py-1 text-[0.74rem] text-[color:var(--sf-text-muted)] hover:text-[color:var(--sf-text)]"
            >
              Reveal all
            </button>
          )}
          {revealed > 0 && (
            <button
              type="button"
              onClick={() => setRevealed(0)}
              className="flex items-center gap-1 rounded-md border bg-[color:var(--sf-surface)] px-2.5 py-1 text-[0.74rem] text-[color:var(--sf-text-muted)] hover:text-[color:var(--sf-text)]"
            >
              <RotateCcw size={12} aria-hidden /> Start over
            </button>
          )}
        </span>
      </footer>
    </section>
  );
}

/** A collapsed hint or answer, opened on request. */
export function Reveal({ label = 'Hint', children }: { label?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="sf-block my-2 rounded-md border bg-[color:var(--sf-surface)]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[0.84rem] font-medium text-[color:var(--sf-text-muted)] hover:text-[color:var(--sf-text)]"
      >
        {label}
        <ChevronDown size={14} aria-hidden className={cn('shrink-0 transition', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="border-t px-3 py-2.5 text-[0.9rem] [&>*+*]:mt-2 [&>*:first-child]:mt-0">{children}</div>
      )}
    </div>
  );
}
