import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Boxes,
  GitBranch,
  Network,
  PlayCircle,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import { modules, totalLessons, totalMinutes, trackOrder, tracks } from '@/content/curriculum';
import { useProgress } from '@/store/progress';
import { formatMinutes } from '@/lib/format';
import { ProgressBar } from '@/components/progress/Bits';

const pillars = [
  {
    icon: Workflow,
    title: 'Mechanism, not incantation',
    body: 'Every lesson shows what the framework actually does — the filter chain, the proxy, the auto-configuration condition — so you can predict behaviour instead of pattern-matching Stack Overflow.',
  },
  {
    icon: Network,
    title: 'Diagrams for the hard parts',
    body: 'Request lifecycles, saga flows, circuit-breaker state machines and consumer-group rebalances are drawn, not described in a paragraph you have to re-read four times.',
  },
  {
    icon: Boxes,
    title: 'Two real systems',
    body: 'A monolith that grows through the core modules, and a six-service distributed system that carries the microservices half. Real, compilable code you can read file by file.',
  },
  {
    icon: ShieldCheck,
    title: 'Production, not tutorials',
    body: 'N+1 queries, retry storms, cache stampedes, OOM-killed pods, proxies that silently skip @Transactional. The failures that actually page you at 3am.',
  },
];

export default function HomePage() {
  const completed = useProgress((s) => s.completed);
  const lastVisited = useProgress((s) => s.lastVisited);
  const progress = completed.length / totalLessons;

  return (
    <div className="mx-auto max-w-[72rem] px-5 py-12 sm:px-8 lg:py-20">
      {/* Hero */}
      <section className="relative">
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.72rem] font-medium text-[color:var(--sf-text-muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--sf-accent)]" />
          {modules.length} modules · {totalLessons} lessons · {formatMinutes(totalMinutes)} of
          reading
        </span>

        <h1 className="mt-5 max-w-[18ch] text-[2.6rem] leading-[1.06] font-semibold tracking-[-0.03em] sm:text-[3.4rem]">
          Spring Boot and microservices,{' '}
          <span className="text-[color:var(--sf-accent)]">all the way down</span>.
        </h1>

        <p className="mt-5 max-w-[58ch] text-[1.08rem] leading-relaxed text-[color:var(--sf-text-muted)]">
          A complete path from your first <code>@RestController</code> to running a distributed
          system you are on call for. Built around the mechanisms, the diagrams, and the failure
          modes — not a tour of annotations.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            to={lastVisited ? `/learn/${lastVisited}` : '/learn/foundations/what-is-spring'}
            className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--sf-accent)] px-5 py-2.5 text-[0.92rem] font-semibold text-white transition hover:bg-[color:var(--sf-accent-hover)]"
          >
            <PlayCircle size={17} />
            {lastVisited ? 'Resume where you left off' : 'Start from the beginning'}
          </Link>
          <Link
            to="/path"
            className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-[0.92rem] font-medium transition hover:border-[color:var(--sf-border-strong)]"
          >
            See the full path <ArrowRight size={15} />
          </Link>
        </div>

        {completed.length > 0 && (
          <div className="mt-8 max-w-md rounded-[var(--radius-token)] border bg-[color:var(--sf-surface)] p-4">
            <div className="flex items-baseline justify-between text-[0.8rem]">
              <span className="font-medium">Your progress</span>
              <span className="tabular-nums text-[color:var(--sf-text-muted)]">
                {completed.length} of {totalLessons}
              </span>
            </div>
            <ProgressBar value={progress} className="mt-2.5" />
          </div>
        )}
      </section>

      {/* Pillars */}
      <section className="mt-20 grid gap-4 sm:grid-cols-2">
        {pillars.map((p) => (
          <article
            key={p.title}
            className="rounded-[var(--radius-token)] border bg-[color:var(--sf-surface)] p-5"
          >
            <p.icon size={20} className="text-[color:var(--sf-accent)]" />
            <h2 className="mt-3 mb-1.5 text-[1rem] font-semibold">{p.title}</h2>
            <p className="m-0 text-[0.88rem] leading-relaxed text-[color:var(--sf-text-muted)]">
              {p.body}
            </p>
          </article>
        ))}
      </section>

      {/* Tracks */}
      <section className="mt-20">
        <h2 className="text-[1.5rem] font-semibold tracking-[-0.02em]">
          {trackOrder.length} tracks, in order
        </h2>
        <p className="mt-2 max-w-[60ch] text-[0.95rem] text-[color:var(--sf-text-muted)]">
          Each track assumes the one before it. Skip ahead if you already know the material — the
          sidebar remembers what you have finished.
        </p>

        <ol className="mt-8 m-0 list-none space-y-0 p-0">
          {trackOrder.map((track, i) => {
            const items = modules.filter((m) => m.track === track);
            return (
              <li key={track} className="relative border-l-2 pb-8 pl-8 last:pb-0">
                <span className="absolute top-0 -left-[0.6rem] flex h-[1.15rem] w-[1.15rem] items-center justify-center rounded-full border-2 border-[color:var(--sf-accent)] bg-[color:var(--sf-bg)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--sf-accent)]" />
                </span>
                <p className="m-0 flex items-baseline gap-2.5">
                  <span className="font-[family-name:var(--font-mono)] text-[0.7rem] text-[color:var(--sf-text-faint)]">
                    0{i + 1}
                  </span>
                  <span className="text-[1.1rem] font-semibold">{tracks[track].label}</span>
                  <span className="text-[0.82rem] text-[color:var(--sf-text-faint)]">
                    {tracks[track].blurb}
                  </span>
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {items.map((m) => (
                    <Link
                      key={m.slug}
                      to={`/learn/${m.slug}`}
                      className="rounded-lg border bg-[color:var(--sf-surface)] px-3 py-1.5 text-[0.82rem] text-[color:var(--sf-text-muted)] transition hover:border-[color:var(--sf-accent)] hover:text-[color:var(--sf-text)]"
                    >
                      <span className="mr-1.5 font-[family-name:var(--font-mono)] text-[0.68rem] text-[color:var(--sf-text-faint)]">
                        {m.id}
                      </span>
                      {m.title}
                    </Link>
                  ))}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Demos */}
      <section className="mt-20 overflow-hidden rounded-[var(--radius-token)] border bg-[color:var(--sf-surface)]">
        <div className="grid gap-6 p-7 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="m-0 flex items-center gap-2 text-[0.7rem] font-semibold tracking-[0.1em] text-[color:var(--sf-accent-text)] uppercase">
              <GitBranch size={13} /> Demo projects
            </p>
            <h2 className="mt-2.5 mb-2 text-[1.4rem] font-semibold tracking-[-0.02em]">
              Read the whole system, file by file
            </h2>
            <p className="m-0 max-w-[52ch] text-[0.92rem] leading-relaxed text-[color:var(--sf-text-muted)]">
              Browse every source file of the demo projects with a real tree, syntax highlighting,
              and a click-through walkthrough that points at the exact lines that matter.
            </p>
          </div>
          <Link
            to="/demos"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border px-4 py-2.5 text-[0.88rem] font-medium transition hover:border-[color:var(--sf-accent)]"
          >
            Open demos <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}
