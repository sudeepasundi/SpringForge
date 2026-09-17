import { Link } from 'react-router-dom';
import { AlertTriangle, BookOpen, ChevronDown, Cpu } from 'lucide-react';
import { CodeSurface } from '@/components/mdx/CodeSurface';
import { getLessonRef } from '@/content/curriculum';
import { annotationAnchor, type AnnotationEntry } from '@/content/basics';
import { cn } from '@/lib/cn';

interface Props {
  entry: AnnotationEntry;
  categoryLabel: string;
  expanded: boolean;
  focused: boolean;
  onToggle: () => void;
  onFocusRelated: (name: string) => void;
}

function lessonLink(path: string) {
  const [moduleSlug, lessonSlug] = path.split('/');
  const ref = getLessonRef(moduleSlug, lessonSlug);
  if (!ref) return null;
  return (
    <li key={path}>
      <Link
        to={`/learn/${ref.path}`}
        className="text-[color:var(--sf-accent-text)] underline-offset-2 hover:underline"
      >
        {ref.lesson.title}
      </Link>
      <span className="text-[color:var(--sf-text-faint)]"> · {ref.module.title}</span>
    </li>
  );
}

export function AnnotationCard({
  entry,
  categoryLabel,
  expanded,
  focused,
  onToggle,
  onFocusRelated,
}: Props) {
  const id = `annotation-${annotationAnchor(entry.name)}`;
  const panelId = `${id}-details`;

  return (
    <article
      id={id}
      className={cn(
        // min-w-0: a grid item defaults to min-width:auto, so a long code line
        // would stretch the card past the viewport instead of scrolling.
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
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <h3 className="m-0 font-[family-name:var(--font-mono)] text-[1rem] font-semibold text-[color:var(--sf-text)]">
              @{entry.name}
            </h3>
            <span className="rounded-full border px-2 py-0.5 text-[0.66rem] text-[color:var(--sf-text-muted)]">
              {categoryLabel}
            </span>
            {entry.deprecated && (
              <span className="rounded-full border border-[color:var(--sf-warn)] px-2 py-0.5 text-[0.66rem] font-medium text-[color:var(--sf-warn)]">
                Deprecated
              </span>
            )}
          </div>
          <p className="mt-1 mb-0 text-[0.88rem] leading-relaxed text-[color:var(--sf-text-muted)]">
            {entry.summary}
          </p>
        </div>
        <ChevronDown
          size={16}
          aria-hidden
          className={cn(
            'mt-1 shrink-0 text-[color:var(--sf-text-faint)] transition',
            expanded && 'rotate-180',
          )}
        />
      </button>

      {expanded && (
        <div id={panelId} className="border-t px-4 pt-3.5 pb-4">
          <p className="m-0 font-[family-name:var(--font-mono)] text-[0.72rem] break-all text-[color:var(--sf-text-faint)]">
            {entry.pkg}
          </p>

          {entry.deprecated && (
            <p className="mt-3 mb-0 rounded-md border border-[color:var(--sf-warn)] px-3 py-2 text-[0.84rem] text-[color:var(--sf-text)]">
              {entry.deprecated}
            </p>
          )}

          <section className="mt-3.5">
            <h4 className="m-0 flex items-center gap-1.5 text-[0.66rem] font-semibold tracking-[0.1em] text-[color:var(--sf-text-faint)] uppercase">
              <Cpu size={12} aria-hidden /> What it actually does
            </h4>
            <p className="mt-1.5 mb-0 text-[0.9rem] leading-relaxed text-[color:var(--sf-text)]">
              {entry.mechanism}
            </p>
          </section>

          <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
            <section className="rounded-md border-l-2 border-[color:var(--sf-accent)] bg-[color:var(--sf-surface-2)] px-3 py-2">
              <h4 className="m-0 text-[0.7rem] font-semibold text-[color:var(--sf-accent-text)]">
                Use when
              </h4>
              <p className="mt-1 mb-0 text-[0.85rem] leading-relaxed text-[color:var(--sf-text-muted)]">
                {entry.useWhen}
              </p>
            </section>
            {entry.avoidWhen && (
              <section className="rounded-md border-l-2 border-[color:var(--sf-text-faint)] bg-[color:var(--sf-surface-2)] px-3 py-2">
                <h4 className="m-0 text-[0.7rem] font-semibold text-[color:var(--sf-text-muted)]">
                  Avoid when
                </h4>
                <p className="mt-1 mb-0 text-[0.85rem] leading-relaxed text-[color:var(--sf-text-muted)]">
                  {entry.avoidWhen}
                </p>
              </section>
            )}
          </div>

          {entry.pitfall && (
            <section className="mt-3.5 flex gap-2.5 rounded-md border border-[color:var(--sf-warn)] px-3 py-2.5">
              <AlertTriangle size={15} aria-hidden className="mt-0.5 shrink-0 text-[color:var(--sf-warn)]" />
              <p className="m-0 text-[0.85rem] leading-relaxed text-[color:var(--sf-text)]">
                <strong>Common mistake. </strong>
                {entry.pitfall}
              </p>
            </section>
          )}

          <div className="mt-3.5 overflow-hidden rounded-md border bg-[color:var(--sf-code-bg)]">
            <CodeSurface code={entry.example.code} lang={entry.example.lang} showLineNumbers={false} />
          </div>

          {entry.related && entry.related.length > 0 && (
            <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[0.72rem] text-[color:var(--sf-text-faint)]">Related</span>
              {entry.related.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => onFocusRelated(name)}
                  className="rounded-full border px-2 py-0.5 font-[family-name:var(--font-mono)] text-[0.72rem] text-[color:var(--sf-text-muted)] transition hover:border-[color:var(--sf-accent)] hover:text-[color:var(--sf-text)]"
                >
                  @{name}
                </button>
              ))}
            </div>
          )}

          {entry.lessons && entry.lessons.length > 0 && (
            <div className="mt-3 flex gap-2 text-[0.8rem]">
              <BookOpen size={13} aria-hidden className="mt-0.5 shrink-0 text-[color:var(--sf-text-faint)]" />
              <div>
                <span className="text-[color:var(--sf-text-faint)]">Taught in</span>
                <ul className="m-0 mt-0.5 list-none space-y-0.5 p-0">
                  {entry.lessons.map(lessonLink)}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
