import { Link } from 'react-router-dom';
import { ArrowRight, Boxes, Clock, Database } from 'lucide-react';
import { jdbcChapters, jdbcLevels } from '@/content/jdbc';
import { prefetchChapter } from '@/lib/jdbc';
import { LevelBadge } from '@/components/progress/Bits';

export default function JdbcPage() {
  const totalMinutes = jdbcChapters.reduce((sum, c) => sum + c.minutes, 0);

  return (
    <div className="mx-auto max-w-[62rem] px-5 py-10 sm:px-8">
      <header className="mb-8">
        <h1 className="flex items-center gap-2.5 text-[2rem] font-semibold tracking-[-0.025em]">
          <Database size={26} className="text-[color:var(--sf-accent)]" />
          Spring JDBC
        </h1>
        <p className="mt-2.5 mb-0 max-w-[64ch] text-[0.98rem] leading-relaxed text-[color:var(--sf-text-muted)]">
          Talking to a relational database from Java, from the first connection to production. Plain
          JDBC first, so you know what is happening underneath, then Spring’s JdbcTemplate and
          JdbcClient on top — all against MySQL. {jdbcChapters.length} chapters, about{' '}
          {Math.round(totalMinutes / 60)} hours.
        </p>
      </header>

      <Link
        to="/demos?project=shelf"
        className="group mb-9 flex items-start justify-between gap-4 rounded-[var(--radius-token)] border bg-[color:var(--sf-surface)] p-5 transition hover:border-[color:var(--sf-accent)]"
      >
        <div>
          <h2 className="m-0 flex items-center gap-2 text-[1.1rem] font-semibold">
            <Boxes size={17} className="text-[color:var(--sf-accent)]" />
            The Shelf project
          </h2>
          <p className="mt-1.5 mb-0 max-w-[62ch] text-[0.9rem] leading-relaxed text-[color:var(--sf-text-muted)]">
            A small library catalogue on MySQL, written twice — with plain JDBC and with Spring JDBC.
            The chapters walk through its files; open it to read the whole thing.
          </p>
        </div>
        <ArrowRight
          size={18}
          className="mt-1 shrink-0 text-[color:var(--sf-text-faint)] transition group-hover:translate-x-0.5 group-hover:text-[color:var(--sf-accent)]"
        />
      </Link>

      {jdbcLevels.map((level) => {
        const chapters = jdbcChapters.filter((c) => c.level === level.id);
        return (
          <section key={level.id} className="mb-9" aria-labelledby={`level-${level.id}`}>
            <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 id={`level-${level.id}`} className="m-0 text-[1.15rem] font-semibold">
                {level.label}
              </h2>
              <p className="m-0 text-[0.84rem] text-[color:var(--sf-text-faint)]">{level.blurb}</p>
            </div>
            <ol className="m-0 grid list-none gap-2.5 p-0">
              {chapters.map((c) => {
                const number = jdbcChapters.indexOf(c) + 1;
                return (
                  <li key={c.slug}>
                    <Link
                      to={`/jdbc/${c.slug}`}
                      onMouseEnter={() => prefetchChapter(c.slug)}
                      onFocus={() => prefetchChapter(c.slug)}
                      className="group flex gap-4 rounded-[var(--radius-token)] border bg-[color:var(--sf-surface)] p-4 transition hover:border-[color:var(--sf-accent)]"
                    >
                      <span className="w-7 shrink-0 font-[family-name:var(--font-mono)] text-[1.05rem] font-semibold text-[color:var(--sf-text-faint)] tabular-nums">
                        {String(number).padStart(2, '0')}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[1rem] font-semibold">{c.title}</span>
                        <span className="mt-1 block text-[0.86rem] leading-relaxed text-[color:var(--sf-text-muted)]">
                          {c.summary}
                        </span>
                        <span className="mt-2 flex flex-wrap items-center gap-3">
                          <LevelBadge level={c.level} />
                          <span className="flex items-center gap-1.5 text-[0.74rem] text-[color:var(--sf-text-faint)]">
                            <Clock size={12} /> {c.minutes} min
                          </span>
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
