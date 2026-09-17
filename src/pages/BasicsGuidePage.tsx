/* eslint-disable react-hooks/static-components */
// `guideComponent` returns a component from a module-level cache; the identity
// is stable for a given slug, which is what this rule exists to protect.
import { Suspense, useRef } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Clock } from 'lucide-react';
import { basicsGuides, getBasicsGuide } from '@/content/basics';
import { getLessonRef } from '@/content/curriculum';
import { guideComponent, prefetchGuide } from '@/lib/basics';
import { TableOfContents } from '@/components/nav/TableOfContents';
import { ProseSkeleton } from '@/components/ui/Loading';
import { cn } from '@/lib/cn';

export default function BasicsGuidePage() {
  const { guideSlug } = useParams();
  const articleRef = useRef<HTMLElement>(null);
  const guide = getBasicsGuide(guideSlug);

  if (!guide) return <Navigate to="/basics" replace />;

  const Content = guideComponent(guide.slug);
  const index = basicsGuides.findIndex((g) => g.slug === guide.slug);
  const prev = basicsGuides[index - 1];
  const next = basicsGuides[index + 1];

  return (
    <div className="mx-auto flex max-w-[76rem] gap-10 px-5 py-9 sm:px-8">
      <article ref={articleRef} className="min-w-0 flex-1">
        <nav
          className="mb-4 flex items-center gap-1.5 text-[0.78rem] text-[color:var(--sf-text-faint)]"
          aria-label="Breadcrumb"
        >
          <Link to="/basics" className="hover:text-[color:var(--sf-text)]">
            Basics
          </Link>
          <span>/</span>
          <span>Guides</span>
        </nav>

        <header className="mb-7">
          <h1 className="text-[2.05rem] leading-[1.15] font-semibold tracking-[-0.03em]">
            {guide.title}
          </h1>
          <p className="mt-2.5 mb-0 max-w-[60ch] text-[1.02rem] leading-relaxed text-[color:var(--sf-text-muted)]">
            {guide.summary}
          </p>
          <span className="mt-3 flex items-center gap-1.5 text-[0.78rem] text-[color:var(--sf-text-faint)]">
            <Clock size={12} /> {guide.minutes} min revision
          </span>
        </header>

        <div className="prose-sf max-w-none">
          {Content ? (
            <Suspense fallback={<ProseSkeleton />}>
              <Content />
            </Suspense>
          ) : (
            <p>This guide is still being written.</p>
          )}
        </div>

        {guide.lessons.length > 0 && (
          <section className="mt-10 rounded-[var(--radius-token)] border bg-[color:var(--sf-surface)] px-4 py-3.5">
            <h2 className="m-0 flex items-center gap-1.5 text-[0.66rem] font-semibold tracking-[0.1em] text-[color:var(--sf-text-faint)] uppercase">
              <BookOpen size={12} /> Go deeper
            </h2>
            <ul className="mt-2 mb-0 list-none space-y-1 p-0 text-[0.9rem]">
              {guide.lessons.map((path) => {
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

        <nav className="mt-8 flex flex-col gap-3 sm:flex-row" aria-label="Other guides">
          {prev ? <GuideLink slug={prev.slug} title={prev.title} dir="prev" /> : <div className="flex-1" />}
          {next ? <GuideLink slug={next.slug} title={next.title} dir="next" /> : <div className="flex-1" />}
        </nav>
      </article>

      <aside className="hidden w-56 shrink-0 xl:block">
        <div className="sticky top-[calc(var(--sf-header-h)+2rem)]">
          <TableOfContents containerRef={articleRef} contentKey={guide.slug} />
        </div>
      </aside>
    </div>
  );
}

function GuideLink({ slug, title, dir }: { slug: string; title: string; dir: 'prev' | 'next' }) {
  return (
    <Link
      to={`/basics/${slug}`}
      onMouseEnter={() => prefetchGuide(slug)}
      className={cn(
        'group flex flex-1 items-center gap-3 rounded-[var(--radius-token)] border bg-[color:var(--sf-surface)] p-3.5 transition hover:border-[color:var(--sf-accent)]',
        dir === 'next' && 'justify-end text-right',
      )}
    >
      {dir === 'prev' && <ArrowLeft size={16} className="shrink-0 text-[color:var(--sf-text-faint)]" />}
      <span>
        <span className="block text-[0.7rem] text-[color:var(--sf-text-faint)]">
          {dir === 'prev' ? 'Previous guide' : 'Next guide'}
        </span>
        <span className="text-[0.92rem] font-medium">{title}</span>
      </span>
      {dir === 'next' && <ArrowRight size={16} className="shrink-0 text-[color:var(--sf-text-faint)]" />}
    </Link>
  );
}
