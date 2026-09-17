import { Link, Navigate, useParams } from 'react-router-dom';
import { FileCode2 } from 'lucide-react';
import { chapterNumber, getChapter, type ChapterBook } from '@/content/chapters/types';
import { chapterComponent, prefetchChapter } from '@/lib/chapters';
import { GuideArticle } from '@/components/guides/GuideArticle';
import { LevelBadge } from '@/components/progress/Bits';

/** One chapter of a book, read from the `:chapterSlug` route parameter. */
export function ChapterArticle({ book }: { book: ChapterBook }) {
  const { chapterSlug } = useParams();
  const chapter = getChapter(book, chapterSlug);

  if (!chapter) return <Navigate to={book.basePath} replace />;

  const number = chapterNumber(book, chapter.slug);
  const prev = book.chapters[number - 2];
  const next = book.chapters[number];
  const demo = book.demo;

  const files =
    demo && chapter.demoFiles.length > 0 ? (
      <section className="mt-10 rounded-[var(--radius-token)] border bg-[color:var(--sf-surface)] px-4 py-3.5">
        <h2 className="m-0 flex items-center gap-1.5 text-[0.66rem] font-semibold tracking-[0.1em] text-[color:var(--sf-text-faint)] uppercase">
          <FileCode2 size={12} /> In the {demo.name} project
        </h2>
        <ul className="mt-2 mb-0 list-none space-y-1 p-0 text-[0.86rem]">
          {chapter.demoFiles.map((path) => (
            <li key={path} className="min-w-0">
              <Link
                to={`/demos?project=${demo.id}&file=${encodeURIComponent(path)}`}
                className="font-[family-name:var(--font-mono)] break-all text-[color:var(--sf-accent-text)] underline-offset-2 hover:underline"
              >
                {path.split('/').pop()}
              </Link>
              <span className="text-[color:var(--sf-text-faint)]"> · {path.split('/')[0]}</span>
            </li>
          ))}
        </ul>
      </section>
    ) : null;

  return (
    <GuideArticle
      contentKey={chapter.slug}
      breadcrumb={[{ label: book.title, to: book.basePath }, { label: `Chapter ${number}` }]}
      title={chapter.title}
      summary={chapter.summary}
      minutes={chapter.minutes}
      meta={<LevelBadge level={chapter.level} />}
      // A cached lazy component: its identity is stable for a given slug.
      Content={chapterComponent(book.id, chapter.slug)}
      footer={files}
      lessons={chapter.lessons}
      prev={
        prev && {
          to: `${book.basePath}/${prev.slug}`,
          title: prev.title,
          label: `Chapter ${number - 1}`,
          onIntent: () => prefetchChapter(book.id, prev.slug),
        }
      }
      next={
        next && {
          to: `${book.basePath}/${next.slug}`,
          title: next.title,
          label: `Chapter ${number + 1}`,
          onIntent: () => prefetchChapter(book.id, next.slug),
        }
      }
    />
  );
}
