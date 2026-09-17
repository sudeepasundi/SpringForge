import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronDown } from 'lucide-react';
import { CodeSurface } from '@/components/mdx/CodeSurface';
import type { QaQuestion } from '@/content/qa/types';
import { cn } from '@/lib/cn';

interface Props {
  question: QaQuestion;
  topicLabel: string;
  chapterTitle: string;
  /** Route of the chapter that explains the answer. */
  chapterHref: string;
  expanded: boolean;
  focused: boolean;
  onToggle: () => void;
}

const difficultyTone: Record<QaQuestion['difficulty'], string> = {
  basic: 'var(--sf-accent)',
  intermediate: 'var(--sf-info)',
  advanced: 'var(--sf-warn)',
};

/** Renders `backtick` spans as inline code; everything else is text. */
export function InlineText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/g).map((part, i) =>
        part.startsWith('`') && part.endsWith('`') && part.length > 1 ? (
          <code
            key={i}
            className="rounded border bg-[color:var(--sf-surface-2)] px-1 py-px font-[family-name:var(--font-mono)] text-[0.86em] break-words text-[color:var(--sf-accent-text)]"
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

export function QuestionCard({
  question,
  topicLabel,
  chapterTitle,
  chapterHref,
  expanded,
  focused,
  onToggle,
}: Props) {
  const id = `question-${question.id}`;
  const panelId = `${id}-answer`;

  return (
    <article
      id={id}
      className={cn(
        // min-w-0 so a long code line scrolls inside the card, not the page.
        'min-w-0 scroll-mt-24 rounded-[var(--radius-token)] border bg-[color:var(--sf-surface)] transition',
        focused && 'border-[color:var(--sf-accent)] ring-2 ring-[color:var(--sf-accent-soft)]',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
      >
        <div className="min-w-0 flex-1">
          <h3 className="m-0 text-[0.98rem] leading-snug font-semibold [overflow-wrap:anywhere] text-[color:var(--sf-text)]">
            <InlineText text={question.question} />
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border px-2 py-0.5 text-[0.66rem] text-[color:var(--sf-text-muted)]">
              {topicLabel}
            </span>
            <span
              className="rounded-full border px-2 py-0.5 text-[0.62rem] font-semibold tracking-[0.06em] uppercase"
              style={{
                color: difficultyTone[question.difficulty],
                borderColor: difficultyTone[question.difficulty],
              }}
            >
              {question.difficulty}
            </span>
          </div>
        </div>
        <ChevronDown
          size={16}
          aria-hidden
          className={cn('mt-1 shrink-0 text-[color:var(--sf-text-faint)] transition', expanded && 'rotate-180')}
        />
      </button>

      {expanded && (
        <div id={panelId} className="border-t px-4 pt-3.5 pb-4">
          {question.answer.split(/\n\s*\n/).map((para, i) => (
            <p
              key={i}
              className="mt-0 mb-2.5 text-[0.9rem] leading-relaxed [overflow-wrap:anywhere] text-[color:var(--sf-text)]"
            >
              <InlineText text={para.trim()} />
            </p>
          ))}

          {question.points && question.points.length > 0 && (
            <section className="mt-3 rounded-md border-l-2 border-[color:var(--sf-accent)] bg-[color:var(--sf-surface-2)] px-3 py-2">
              <h4 className="m-0 text-[0.7rem] font-semibold text-[color:var(--sf-accent-text)]">
                Likely follow-ups
              </h4>
              <ul className="mt-1 mb-0 list-disc space-y-1 pl-4 text-[0.85rem] leading-relaxed text-[color:var(--sf-text-muted)]">
                {question.points.map((point) => (
                  <li key={point}>
                    <InlineText text={point} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {question.code && (
            <div className="mt-3.5 overflow-hidden rounded-md border bg-[color:var(--sf-code-bg)]">
              <CodeSurface code={question.code.code} lang={question.code.lang} showLineNumbers={false} />
            </div>
          )}

          <p className="mt-3 mb-0 flex items-center gap-1.5 text-[0.8rem]">
            <BookOpen size={13} aria-hidden className="shrink-0 text-[color:var(--sf-text-faint)]" />
            <span className="text-[color:var(--sf-text-faint)]">In depth:</span>
            <Link
              to={chapterHref}
              className="text-[color:var(--sf-accent-text)] underline-offset-2 hover:underline"
            >
              {chapterTitle}
            </Link>
          </p>
        </div>
      )}
    </article>
  );
}
