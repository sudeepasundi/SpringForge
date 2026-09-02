import { Link } from 'react-router-dom';
import { Award, Bookmark, Flame, RotateCcw, Target, TrendingUp } from 'lucide-react';
import {
  flatLessons,
  getLessonRef,
  modules,
  totalLessons,
  totalMinutes,
} from '@/content/curriculum';
import { completionOf, streakOf, useProgress } from '@/store/progress';
import { ProgressBar, ProgressRing } from '@/components/progress/Bits';
import { formatMinutes, pct } from '@/lib/format';

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[var(--radius-token)] border bg-[color:var(--sf-surface)] p-4">
      <p className="m-0 flex items-center gap-1.5 text-[0.68rem] font-semibold tracking-[0.09em] text-[color:var(--sf-text-faint)] uppercase">
        <Icon size={12} /> {label}
      </p>
      <p className="mt-1.5 mb-0 text-[1.6rem] leading-none font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1.5 mb-0 text-[0.76rem] text-[color:var(--sf-text-faint)]">{hint}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const completed = useProgress((s) => s.completed);
  const bookmarks = useProgress((s) => s.bookmarks);
  const quizzes = useProgress((s) => s.quizzes);
  const activeDays = useProgress((s) => s.activeDays);
  const lastVisited = useProgress((s) => s.lastVisited);
  const resetProgress = useProgress((s) => s.resetProgress);

  const done = completed.length / totalLessons;
  const minutesDone = flatLessons
    .filter((r) => completed.includes(r.path))
    .reduce((n, r) => n + r.lesson.minutes, 0);

  const quizEntries = Object.entries(quizzes);
  const quizTotals = quizEntries.reduce(
    (acc, [, q]) => ({ score: acc.score + q.score, total: acc.total + q.total }),
    { score: 0, total: 0 },
  );

  const nextUp = flatLessons.find((r) => !completed.includes(r.path));
  const resume = lastVisited ? getLessonRef(...(lastVisited.split('/') as [string, string])) : null;

  return (
    <div className="mx-auto max-w-[68rem] px-5 py-10 sm:px-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[2rem] font-semibold tracking-[-0.025em]">Your dashboard</h1>
          <p className="mt-1.5 mb-0 text-[0.95rem] text-[color:var(--sf-text-muted)]">
            Everything here lives in this browser only — nothing is uploaded anywhere.
          </p>
        </div>
        <ProgressRing value={done} size={72} stroke={6} />
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Target}
          label="Lessons"
          value={`${completed.length}/${totalLessons}`}
          hint={`${pct(done)}% of the path`}
        />
        <Stat
          icon={TrendingUp}
          label="Reading done"
          value={formatMinutes(minutesDone)}
          hint={`of ${formatMinutes(totalMinutes)}`}
        />
        <Stat
          icon={Flame}
          label="Streak"
          value={`${streakOf(activeDays)}d`}
          hint={`${activeDays.length} active days`}
        />
        <Stat
          icon={Award}
          label="Quiz score"
          value={quizTotals.total > 0 ? `${quizTotals.score}/${quizTotals.total}` : '—'}
          hint={`${quizEntries.length} quizzes taken`}
        />
      </section>

      {(resume ?? nextUp) && (
        <section className="mt-8 grid gap-3 sm:grid-cols-2">
          {resume && (
            <Link
              to={`/learn/${resume.path}`}
              className="rounded-[var(--radius-token)] border border-[color:var(--sf-accent)] bg-[color:var(--sf-accent-soft)] p-4 transition hover:brightness-[1.03]"
            >
              <p className="m-0 text-[0.68rem] font-semibold tracking-[0.09em] text-[color:var(--sf-accent-text)] uppercase">
                Pick up where you left off
              </p>
              <p className="mt-1 mb-0 font-medium">{resume.lesson.title}</p>
              <p className="mt-0.5 mb-0 text-[0.78rem] text-[color:var(--sf-text-muted)]">
                {resume.module.title}
              </p>
            </Link>
          )}
          {nextUp && (
            <Link
              to={`/learn/${nextUp.path}`}
              className="rounded-[var(--radius-token)] border bg-[color:var(--sf-surface)] p-4 transition hover:border-[color:var(--sf-accent)]"
            >
              <p className="m-0 text-[0.68rem] font-semibold tracking-[0.09em] text-[color:var(--sf-text-faint)] uppercase">
                Next unfinished lesson
              </p>
              <p className="mt-1 mb-0 font-medium">{nextUp.lesson.title}</p>
              <p className="mt-0.5 mb-0 text-[0.78rem] text-[color:var(--sf-text-muted)]">
                {nextUp.module.title}
              </p>
            </Link>
          )}
        </section>
      )}

      <section className="mt-10">
        <h2 className="mb-4 text-[1.15rem] font-semibold">Progress by module</h2>
        <ul className="m-0 list-none space-y-2 p-0">
          {modules.map((module) => {
            const paths = module.lessons.map((l) => `${module.slug}/${l.slug}`);
            const value = completionOf(completed, paths);
            const count = Math.round(value * paths.length);
            return (
              <li key={module.slug}>
                <Link
                  to={`/learn/${module.slug}`}
                  className="flex items-center gap-4 rounded-lg border bg-[color:var(--sf-surface)] px-4 py-3 transition hover:border-[color:var(--sf-accent)]"
                >
                  <span className="font-[family-name:var(--font-mono)] text-[0.72rem] text-[color:var(--sf-text-faint)]">
                    {module.id}
                  </span>
                  <span className="w-44 shrink-0 truncate text-[0.88rem] font-medium">
                    {module.title}
                  </span>
                  <ProgressBar value={value} className="flex-1" />
                  <span className="w-14 shrink-0 text-right text-[0.75rem] tabular-nums text-[color:var(--sf-text-faint)]">
                    {count}/{paths.length}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {bookmarks.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 flex items-center gap-2 text-[1.15rem] font-semibold">
            <Bookmark size={17} className="text-[color:var(--sf-accent)]" /> Bookmarks
          </h2>
          <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
            {bookmarks.map((b) => {
              const ref = getLessonRef(...(b.split('/') as [string, string]));
              if (!ref) return null;
              return (
                <li key={b}>
                  <Link
                    to={`/learn/${b}`}
                    className="block rounded-lg border bg-[color:var(--sf-surface)] px-4 py-3 transition hover:border-[color:var(--sf-accent)]"
                  >
                    <span className="block text-[0.88rem] font-medium">{ref.lesson.title}</span>
                    <span className="block text-[0.76rem] text-[color:var(--sf-text-faint)]">
                      {ref.module.title}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-12 border-t pt-6">
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Reset all progress, bookmarks and quiz scores? This cannot be undone.')) {
              resetProgress();
            }
          }}
          className="inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-[0.82rem] text-[color:var(--sf-text-muted)] transition hover:border-[color:var(--sf-danger)] hover:text-[color:var(--sf-danger)]"
        >
          <RotateCcw size={14} /> Reset all progress
        </button>
      </section>
    </div>
  );
}
