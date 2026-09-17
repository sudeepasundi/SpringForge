import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Boxes, Clock, type LucideIcon } from 'lucide-react';
import type { ChapterBook } from '@/content/chapters/types';
import { prefetchChapter } from '@/lib/chapters';
import { LevelBadge } from '@/components/progress/Bits';

interface Props {
  book: ChapterBook;
  icon: LucideIcon;
  /** Extra cards shown under the demo card, e.g. a revision page. */
  children?: ReactNode;
}

/** The index page of a chapter book: intro, demo card, chapters by group. */
export function ChapterHub({ book, icon: Icon, children }: Props) {
  const totalMinutes = book.chapters.reduce((sum, c) => sum + c.minutes, 0);

  return (
    <div className="mx-auto max-w-[62rem] px-5 py-10 sm:px-8">
      <header className="mb-8">
        <h1 className="flex items-center gap-2.5 text-[2rem] font-semibold tracking-[-0.025em]">
          <Icon size={26} className="text-[color:var(--sf-accent)]" />
          {book.title}
        </h1>
        <p className="mt-2.5 mb-0 max-w-[64ch] text-[0.98rem] leading-relaxed text-[color:var(--sf-text-muted)]">
          {book.intro} {book.chapters.length} chapters, about {Math.round(totalMinutes / 60)} hours.
        </p>
      </header>

      <div className="mb-9 grid gap-3">
        {book.demo && (
          <HubCard
            to={`/demos?project=${book.demo.id}`}
            icon={Boxes}
            title={`The ${book.demo.name} project`}
            body={book.demo.blurb}
          />
        )}
        {children}
      </div>

      {book.groups.map((group) => {
        const chapters = book.chapters.filter((c) => c.group === group.id);
        return (
          <section key={group.id} className="mb-9" aria-labelledby={`group-${group.id}`}>
            <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 id={`group-${group.id}`} className="m-0 text-[1.15rem] font-semibold">
                {group.label}
              </h2>
              <p className="m-0 text-[0.84rem] text-[color:var(--sf-text-faint)]">{group.blurb}</p>
            </div>
            <ol className="m-0 grid list-none gap-2.5 p-0">
              {chapters.map((c) => {
                const number = book.chapters.indexOf(c) + 1;
                return (
                  <li key={c.slug}>
                    <Link
                      to={`${book.basePath}/${c.slug}`}
                      onMouseEnter={() => prefetchChapter(book.id, c.slug)}
                      onFocus={() => prefetchChapter(book.id, c.slug)}
                      className="group flex gap-4 rounded-[var(--radius-token)] border bg-[color:var(--sf-surface)] p-4 transition hover:border-[color:var(--sf-accent)]"
                    >
                      <span className="w-7 shrink-0 font-[family-name:var(--font-mono)] text-[1.05rem] font-semibold text-[color:var(--sf-text-faint)] tabular-nums">
                        {String(number).padStart(2, '0')}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[1rem] font-semibold [overflow-wrap:anywhere]">
                          {c.title}
                        </span>
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

export function HubCard({
  to,
  icon: Icon,
  title,
  body,
}: {
  to: string;
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-start justify-between gap-4 rounded-[var(--radius-token)] border bg-[color:var(--sf-surface)] p-5 transition hover:border-[color:var(--sf-accent)]"
    >
      <div>
        <h2 className="m-0 flex items-center gap-2 text-[1.1rem] font-semibold">
          <Icon size={17} className="text-[color:var(--sf-accent)]" />
          {title}
        </h2>
        <p className="mt-1.5 mb-0 max-w-[62ch] text-[0.9rem] leading-relaxed text-[color:var(--sf-text-muted)]">
          {body}
        </p>
      </div>
      <ArrowRight
        size={18}
        className="mt-1 shrink-0 text-[color:var(--sf-text-faint)] transition group-hover:translate-x-0.5 group-hover:text-[color:var(--sf-accent)]"
      />
    </Link>
  );
}
