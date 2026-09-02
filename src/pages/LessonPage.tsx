/* eslint-disable react-hooks/static-components */
// `lessonComponent` looks a component up in a module-level cache; it does not
// create one. The identity returned for a given lesson is stable for the life
// of the page, which is the property this rule exists to protect.
import { Suspense, useEffect, useRef } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Circle,
  Clock,
  Target,
} from 'lucide-react';
import { getLessonRef, neighbours } from '@/content/curriculum';
import { lessonComponent, prefetchLesson } from '@/lib/lessons';
import { useProgress } from '@/store/progress';
import { LevelBadge } from '@/components/progress/Bits';
import { TableOfContents } from '@/components/nav/TableOfContents';
import { ProseSkeleton } from '@/components/ui/Loading';
import { cn } from '@/lib/cn';
import type { LessonRef } from '@/lib/types';

function NeighbourLink({ target, dir }: { target: LessonRef; dir: 'prev' | 'next' }) {
  return (
    <Link
      to={`/learn/${target.path}`}
      onMouseEnter={() => prefetchLesson(target.module, target.lesson.slug)}
      className={cn(
        'group flex flex-1 items-center gap-3 rounded-[var(--radius-token)] border bg-[color:var(--sf-surface)] p-3.5 transition hover:border-[color:var(--sf-accent)]',
        dir === 'next' && 'text-right',
      )}
    >
      {dir === 'prev' && (
        <ArrowLeft
          size={16}
          className="shrink-0 text-[color:var(--sf-text-faint)] transition group-hover:-translate-x-0.5 group-hover:text-[color:var(--sf-accent)]"
        />
      )}
      <span className={cn('min-w-0 flex-1', dir === 'next' && 'order-first')}>
        <span className="block text-[0.68rem] tracking-[0.08em] text-[color:var(--sf-text-faint)] uppercase">
          {dir === 'prev' ? 'Previous' : 'Next'}
        </span>
        <span className="block truncate text-[0.88rem] font-medium">{target.lesson.title}</span>
      </span>
      {dir === 'next' && (
        <ArrowRight
          size={16}
          className="shrink-0 text-[color:var(--sf-text-faint)] transition group-hover:translate-x-0.5 group-hover:text-[color:var(--sf-accent)]"
        />
      )}
    </Link>
  );
}

function Unwritten({ title }: { title: string }) {
  return (
    <div className="rounded-[var(--radius-token)] border border-dashed p-8 text-center">
      <p className="m-0 text-[0.95rem] font-medium">“{title}” is still being written.</p>
      <p className="mx-auto mt-2 mb-0 max-w-[46ch] text-[0.88rem] leading-relaxed text-[color:var(--sf-text-muted)]">
        The lesson is planned and its place in the path is fixed — the prose, diagrams and code
        walkthrough land in a later content pass. Everything around it already works.
      </p>
    </div>
  );
}

export default function LessonPage() {
  const { moduleSlug, lessonSlug } = useParams();
  const ref = getLessonRef(moduleSlug, lessonSlug);
  const articleRef = useRef<HTMLElement>(null);

  const visit = useProgress((s) => s.visit);
  const toggleComplete = useProgress((s) => s.toggleComplete);
  const toggleBookmark = useProgress((s) => s.toggleBookmark);
  const completed = useProgress((s) => s.completed);
  const bookmarks = useProgress((s) => s.bookmarks);

  const path = ref?.path ?? '';

  useEffect(() => {
    if (path) visit(path);
  }, [path, visit]);

  // Warm the next lesson so "Next" feels instant.
  const { prev, next } = neighbours(path);
  useEffect(() => {
    if (next) prefetchLesson(next.module, next.lesson.slug);
  }, [next]);

  if (!ref) return <Navigate to="/path" replace />;

  const { module, lesson } = ref;
  const Content = lessonComponent(module, lesson.slug);
  const isDone = completed.includes(path);
  const isSaved = bookmarks.includes(path);

  return (
    <div className="mx-auto flex max-w-[76rem] gap-10 px-5 py-9 sm:px-8">
      <article ref={articleRef} className="min-w-0 flex-1">
        <nav
          className="mb-4 flex flex-wrap items-center gap-1.5 text-[0.78rem] text-[color:var(--sf-text-faint)]"
          aria-label="Breadcrumb"
        >
          <Link to="/path" className="hover:text-[color:var(--sf-text)]">
            Path
          </Link>
          <span>/</span>
          <Link to={`/learn/${module.slug}`} className="hover:text-[color:var(--sf-text)]">
            {module.title}
          </Link>
        </nav>

        <header className="mb-7">
          <h1 className="text-[2.05rem] leading-[1.15] font-semibold tracking-[-0.03em]">
            {lesson.title}
          </h1>
          <p className="mt-2.5 mb-0 max-w-[60ch] text-[1.02rem] leading-relaxed text-[color:var(--sf-text-muted)]">
            {lesson.summary}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <LevelBadge level={lesson.level} />
            <span className="flex items-center gap-1.5 text-[0.78rem] text-[color:var(--sf-text-faint)]">
              <Clock size={12} /> {lesson.minutes} min read
            </span>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleBookmark(path)}
                aria-pressed={isSaved}
                className="rounded-lg border p-2 text-[color:var(--sf-text-muted)] transition hover:text-[color:var(--sf-text)]"
                title={isSaved ? 'Remove bookmark' : 'Bookmark this lesson'}
              >
                {isSaved ? (
                  <BookmarkCheck size={15} className="text-[color:var(--sf-accent)]" />
                ) : (
                  <Bookmark size={15} />
                )}
              </button>
              <button
                type="button"
                onClick={() => toggleComplete(path)}
                aria-pressed={isDone}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[0.82rem] font-medium transition',
                  isDone
                    ? 'border-[color:var(--sf-accent)] bg-[color:var(--sf-accent-soft)] text-[color:var(--sf-accent-text)]'
                    : 'hover:border-[color:var(--sf-border-strong)]',
                )}
              >
                {isDone ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                {isDone ? 'Completed' : 'Mark complete'}
              </button>
            </div>
          </div>

          <section className="mt-6 rounded-[var(--radius-token)] border bg-[color:var(--sf-surface)] px-4 py-3.5">
            <h2 className="m-0 flex items-center gap-1.5 text-[0.66rem] font-semibold tracking-[0.1em] text-[color:var(--sf-text-faint)] uppercase">
              <Target size={12} /> What you will be able to do
            </h2>
            <ul className="mt-2.5 mb-0 grid list-none gap-1.5 p-0">
              {lesson.objectives.map((o) => (
                <li
                  key={o}
                  className="flex gap-2.5 text-[0.88rem] leading-relaxed text-[color:var(--sf-text-muted)]"
                >
                  <span
                    aria-hidden
                    className="mt-[0.5em] h-1 w-1 shrink-0 rounded-full bg-[color:var(--sf-accent)]"
                  />
                  {o}
                </li>
              ))}
            </ul>
          </section>
        </header>

        <div className="prose-sf max-w-none">
          {Content ? (
            <Suspense fallback={<ProseSkeleton />}>
              <Content />
            </Suspense>
          ) : (
            <Unwritten title={lesson.title} />
          )}
        </div>

        <div className="mt-10 border-t pt-6">
          <button
            type="button"
            onClick={() => toggleComplete(path)}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-[var(--radius-token)] border-2 border-dashed py-3.5 text-[0.9rem] font-medium transition',
              isDone
                ? 'border-[color:var(--sf-accent)] bg-[color:var(--sf-accent-soft)] text-[color:var(--sf-accent-text)]'
                : 'text-[color:var(--sf-text-muted)] hover:border-[color:var(--sf-accent)] hover:text-[color:var(--sf-text)]',
            )}
          >
            {isDone ? <CheckCircle2 size={17} /> : <Circle size={17} />}
            {isDone ? 'Lesson complete' : 'Mark this lesson complete'}
          </button>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            {prev ? <NeighbourLink target={prev} dir="prev" /> : <span className="flex-1" />}
            {next ? <NeighbourLink target={next} dir="next" /> : <span className="flex-1" />}
          </div>
        </div>
      </article>

      <aside
        className="sticky hidden shrink-0 self-start overflow-y-auto xl:block"
        style={{
          width: 'var(--sf-toc-w)',
          top: 'calc(var(--sf-header-h) + 1.5rem)',
          maxHeight: 'calc(100vh - var(--sf-header-h) - 3rem)',
        }}
      >
        <TableOfContents containerRef={articleRef} contentKey={path} />
      </aside>
    </div>
  );
}
