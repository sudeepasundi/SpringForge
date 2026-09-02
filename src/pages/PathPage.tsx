import { modules, totalLessons, totalMinutes, tracks } from '@/content/curriculum';
import { ModuleCard, ProgressBar } from '@/components/progress/Bits';
import { useProgress } from '@/store/progress';
import { formatMinutes } from '@/lib/format';

export default function PathPage() {
  const completed = useProgress((s) => s.completed);

  return (
    <div className="mx-auto max-w-[72rem] px-5 py-10 sm:px-8">
      <header className="mb-10">
        <h1 className="text-[2rem] font-semibold tracking-[-0.025em]">The learning path</h1>
        <p className="mt-2.5 max-w-[62ch] text-[0.98rem] leading-relaxed text-[color:var(--sf-text-muted)]">
          {modules.length} modules and {totalLessons} lessons, ordered so each one only assumes what
          came before it. Roughly {formatMinutes(totalMinutes)} of reading, plus the time you spend
          in an editor — which is where the learning actually happens.
        </p>
        <div className="mt-5 max-w-md">
          <div className="flex items-baseline justify-between text-[0.8rem]">
            <span className="text-[color:var(--sf-text-muted)]">Overall progress</span>
            <span className="tabular-nums text-[color:var(--sf-text-faint)]">
              {completed.length} / {totalLessons}
            </span>
          </div>
          <ProgressBar value={completed.length / totalLessons} className="mt-2" />
        </div>
      </header>

      {(['foundation', 'core', 'microservices', 'production'] as const).map((track) => {
        const items = modules.filter((m) => m.track === track);
        if (items.length === 0) return null;
        return (
          <section key={track} className="mb-12">
            <div className="mb-4 flex items-baseline gap-3 border-b pb-2.5">
              <h2 className="m-0 text-[1.15rem] font-semibold">{tracks[track].label}</h2>
              <p className="m-0 text-[0.84rem] text-[color:var(--sf-text-faint)]">
                {tracks[track].blurb}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((module) => (
                <ModuleCard key={module.slug} module={module} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
