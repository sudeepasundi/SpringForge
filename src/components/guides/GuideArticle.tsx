import { Suspense, useRef, type ComponentType, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Clock } from 'lucide-react';
import { getLessonRef } from '@/content/curriculum';
import { TableOfContents } from '@/components/nav/TableOfContents';
import { ProseSkeleton } from '@/components/ui/Loading';
import { cn } from '@/lib/cn';

export interface GuideNeighbour {
  to: string;
  title: string;
  /** "Previous guide", "Next chapter"… */
  label: string;
  onIntent?: () => void;
}

interface Props {
  /** Changes when the page changes; re-scans the table of contents. */
  contentKey: string;
  breadcrumb: { label: string; to?: string }[];
  title: string;
  summary: string;
  minutes: number;
  /** Extra header content, e.g. a level badge. */
  meta?: ReactNode;
  /** A cached lazy component (stable identity per page), or null if unwritten. */
  Content: ComponentType | null;
  /** Lesson paths for the "Go deeper" box. */
  lessons?: string[];
  /** Rendered after the body, before "Go deeper". */
  footer?: ReactNode;
  prev?: GuideNeighbour;
  next?: GuideNeighbour;
}

/**
 * The article layout shared by Basics guides and JDBC chapters: breadcrumb,
 * header, lazily loaded MDX body, related lessons, previous/next and a table of
 * contents.
 */
export function GuideArticle({
  contentKey,
  breadcrumb,
  title,
  summary,
  minutes,
  meta,
  Content,
  lessons = [],
  footer,
  prev,
  next,
}: Props) {
  const articleRef = useRef<HTMLElement>(null);

  return (
    <div className="mx-auto flex max-w-[76rem] gap-10 px-5 py-9 sm:px-8">
      <article ref={articleRef} className="min-w-0 flex-1">
        <nav
          className="mb-4 flex flex-wrap items-center gap-1.5 text-[0.78rem] text-[color:var(--sf-text-faint)]"
          aria-label="Breadcrumb"
        >
          {breadcrumb.map((crumb, i) => (
            <span key={crumb.label} className="flex items-center gap-1.5">
              {i > 0 && <span>/</span>}
              {crumb.to ? (
                <Link to={crumb.to} className="hover:text-[color:var(--sf-text)]">
                  {crumb.label}
                </Link>
              ) : (
                <span>{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>

        <header className="mb-7">
          {/* Titles like "NamedParameterJdbcTemplate…" are one long word. */}
          <h1 className="text-[2.05rem] leading-[1.15] font-semibold tracking-[-0.03em] [overflow-wrap:anywhere]">
            {title}
          </h1>
          <p className="mt-2.5 mb-0 max-w-[60ch] text-[1.02rem] leading-relaxed text-[color:var(--sf-text-muted)]">
            {summary}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {meta}
            <span className="flex items-center gap-1.5 text-[0.78rem] text-[color:var(--sf-text-faint)]">
              <Clock size={12} /> {minutes} min read
            </span>
          </div>
        </header>

        <div className="prose-sf max-w-none">
          {Content ? (
            <Suspense fallback={<ProseSkeleton />}>
              <Content />
            </Suspense>
          ) : (
            <p>This page is still being written.</p>
          )}
        </div>

        {footer}

        {lessons.length > 0 && (
          <section className="mt-10 rounded-[var(--radius-token)] border bg-[color:var(--sf-surface)] px-4 py-3.5">
            <h2 className="m-0 flex items-center gap-1.5 text-[0.66rem] font-semibold tracking-[0.1em] text-[color:var(--sf-text-faint)] uppercase">
              <BookOpen size={12} /> Go deeper
            </h2>
            <ul className="mt-2 mb-0 list-none space-y-1 p-0 text-[0.9rem]">
              {lessons.map((path) => {
                const [m, l] = path.split('/');
                const ref = getLessonRef(m, l);
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
              })}
            </ul>
          </section>
        )}

        <nav className="mt-8 flex flex-col gap-3 sm:flex-row" aria-label="Previous and next">
          {prev ? <NeighbourLink target={prev} dir="prev" /> : <div className="flex-1" />}
          {next ? <NeighbourLink target={next} dir="next" /> : <div className="flex-1" />}
        </nav>
      </article>

      <aside className="hidden w-56 shrink-0 xl:block">
        <div className="sticky top-[calc(var(--sf-header-h)+2rem)]">
          <TableOfContents containerRef={articleRef} contentKey={contentKey} />
        </div>
      </aside>
    </div>
  );
}

function NeighbourLink({ target, dir }: { target: GuideNeighbour; dir: 'prev' | 'next' }) {
  return (
    <Link
      to={target.to}
      onMouseEnter={target.onIntent}
      onFocus={target.onIntent}
      className={cn(
        'group flex flex-1 items-center gap-3 rounded-[var(--radius-token)] border bg-[color:var(--sf-surface)] p-3.5 transition hover:border-[color:var(--sf-accent)]',
        dir === 'next' && 'justify-end text-right',
      )}
    >
      {dir === 'prev' && (
        <ArrowLeft size={16} className="shrink-0 text-[color:var(--sf-text-faint)]" />
      )}
      <span>
        <span className="block text-[0.7rem] text-[color:var(--sf-text-faint)]">
          {target.label}
        </span>
        <span className="text-[0.92rem] font-medium">{target.title}</span>
      </span>
      {dir === 'next' && (
        <ArrowRight size={16} className="shrink-0 text-[color:var(--sf-text-faint)]" />
      )}
    </Link>
  );
}
