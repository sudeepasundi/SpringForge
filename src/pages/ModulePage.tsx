import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowRight, Check, Clock } from 'lucide-react';
import { getModule } from '@/content/curriculum';
import { completionOf, useProgress } from '@/store/progress';
import { LevelBadge, ProgressRing } from '@/components/progress/Bits';
import { hasLessonContent, prefetchLesson } from '@/lib/lessons';
import { formatMinutes } from '@/lib/format';
import { cn } from '@/lib/cn';

export default function ModulePage() {
  const { moduleSlug } = useParams();
  const module = getModule(moduleSlug);
  const completed = useProgress((s) => s.completed);

  if (!module) return <Navigate to="/path" replace />;

  const paths = module.lessons.map((l) => `${module.slug}/${l.slug}`);
  const done = completionOf(completed, paths);
  const minutes = module.lessons.reduce((n, l) => n + l.minutes, 0);
  const nextLesson = module.lessons.find((l) => !completed.includes(`${module.slug}/${l.slug}`));

  return (
    <div className="mx-auto max-w-[54rem] px-5 py-10 sm:px-8">
      <nav className="mb-5 text-[0.8rem] text-[color:var(--sf-text-faint)]" aria-label="Breadcrumb">
        <Link to="/path" className="hover:text-[color:var(--sf-text)]">
          Path
        </Link>
        <span className="mx-1.5">/</span>
        <span>{module.title}</span>
      </nav>

      <header className="flex flex-wrap items-start gap-5">
        <div className="min-w-0 flex-1">
          <p className="m-0 font-[family-name:var(--font-mono)] text-[0.78rem] text-[color:var(--sf-accent-text)]">
            Module {module.id}
          </p>
          <h1 className="mt-1.5 mb-2 text-[2rem] leading-tight font-semibold tracking-[-0.025em]">
            {module.title}
          </h1>
          <p className="m-0 max-w-[58ch] text-[1rem] leading-relaxed text-[color:var(--sf-text-muted)]">
            {module.description}
          </p>
          <p className="mt-3 mb-0 flex items-center gap-4 text-[0.8rem] text-[color:var(--sf-text-faint)]">
            <span>{module.lessons.length} lessons</span>
            <span className="flex items-center gap-1.5">
              <Clock size={12} /> {formatMinutes(minutes)}
            </span>
          </p>
        </div>
        <ProgressRing value={done} size={64} stroke={5} />
      </header>

      {nextLesson && (
        <Link
          to={`/learn/${module.slug}/${nextLesson.slug}`}
          className="mt-7 flex items-center gap-3 rounded-[var(--radius-token)] border border-[color:var(--sf-accent)] bg-[color:var(--sf-accent-soft)] px-4 py-3.5 transition hover:brightness-[1.03]"
        >
          <div className="min-w-0 flex-1">
            <p className="m-0 text-[0.68rem] font-semibold tracking-[0.09em] text-[color:var(--sf-accent-text)] uppercase">
              {done > 0 ? 'Continue' : 'Start here'}
            </p>
            <p className="mt-0.5 mb-0 truncate font-medium">{nextLesson.title}</p>
          </div>
          <ArrowRight size={18} className="shrink-0 text-[color:var(--sf-accent-text)]" />
        </Link>
      )}

      <ol className="mt-8 m-0 list-none space-y-2 p-0">
        {module.lessons.map((lesson, i) => {
          const path = `${module.slug}/${lesson.slug}`;
          const isDone = completed.includes(path);
          const authored = hasLessonContent(module, lesson.slug);
          return (
            <li key={lesson.slug}>
              <Link
                to={`/learn/${path}`}
                onMouseEnter={() => prefetchLesson(module, lesson.slug)}
                className="group flex gap-4 rounded-[var(--radius-token)] border bg-[color:var(--sf-surface)] p-4 transition hover:border-[color:var(--sf-accent)]"
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[0.72rem] font-semibold tabular-nums',
                    isDone
                      ? 'border-[color:var(--sf-accent)] bg-[color:var(--sf-accent)] text-white'
                      : 'text-[color:var(--sf-text-faint)]',
                  )}
                >
                  {isDone ? <Check size={13} strokeWidth={3} /> : i + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="m-0 text-[1rem] font-semibold">{lesson.title}</h2>
                    <LevelBadge level={lesson.level} />
                    {!authored && (
                      <span className="rounded-full border border-dashed px-2 py-0.5 text-[0.62rem] font-medium tracking-wide text-[color:var(--sf-text-faint)] uppercase">
                        drafting
                      </span>
                    )}
                  </div>
                  <p className="mt-1 mb-0 text-[0.88rem] leading-relaxed text-[color:var(--sf-text-muted)]">
                    {lesson.summary}
                  </p>
                  <p className="mt-2 mb-0 flex flex-wrap items-center gap-2 text-[0.72rem] text-[color:var(--sf-text-faint)]">
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {lesson.minutes} min
                    </span>
                    {lesson.tags.slice(0, 4).map((t) => (
                      <span key={t} className="rounded bg-[color:var(--sf-surface-2)] px-1.5 py-0.5">
                        {t}
                      </span>
                    ))}
                  </p>
                </div>

                <ArrowRight
                  size={16}
                  className="mt-1 shrink-0 self-start text-[color:var(--sf-accent)] opacity-0 transition group-hover:opacity-100"
                />
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
