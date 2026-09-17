import { Link, Navigate, useParams } from 'react-router-dom';
import { FileCode2 } from 'lucide-react';
import { getJdbcChapter, jdbcChapterNumber, jdbcChapters } from '@/content/jdbc';
import { chapterComponent, prefetchChapter } from '@/lib/jdbc';
import { GuideArticle } from '@/components/guides/GuideArticle';
import { LevelBadge } from '@/components/progress/Bits';

export default function JdbcChapterPage() {
  const { chapterSlug } = useParams();
  const chapter = getJdbcChapter(chapterSlug);

  if (!chapter) return <Navigate to="/jdbc" replace />;

  const number = jdbcChapterNumber(chapter.slug);
  const prev = jdbcChapters[number - 2];
  const next = jdbcChapters[number];

  const files =
    chapter.demoFiles.length > 0 ? (
      <section className="mt-10 rounded-[var(--radius-token)] border bg-[color:var(--sf-surface)] px-4 py-3.5">
        <h2 className="m-0 flex items-center gap-1.5 text-[0.66rem] font-semibold tracking-[0.1em] text-[color:var(--sf-text-faint)] uppercase">
          <FileCode2 size={12} /> In the Shelf project
        </h2>
        <ul className="mt-2 mb-0 list-none space-y-1 p-0 text-[0.86rem]">
          {chapter.demoFiles.map((path) => (
            <li key={path} className="min-w-0">
              <Link
                to={`/demos?project=shelf&file=${encodeURIComponent(path)}`}
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
      breadcrumb={[{ label: 'Spring JDBC', to: '/jdbc' }, { label: `Chapter ${number}` }]}
      title={chapter.title}
      summary={chapter.summary}
      minutes={chapter.minutes}
      meta={<LevelBadge level={chapter.level} />}
      // A cached lazy component: its identity is stable for a given slug.
      Content={chapterComponent(chapter.slug)}
      footer={files}
      lessons={chapter.lessons}
      prev={
        prev && {
          to: `/jdbc/${prev.slug}`,
          title: prev.title,
          label: `Chapter ${number - 1}`,
          onIntent: () => prefetchChapter(prev.slug),
        }
      }
      next={
        next && {
          to: `/jdbc/${next.slug}`,
          title: next.title,
          label: `Chapter ${number + 1}`,
          onIntent: () => prefetchChapter(next.slug),
        }
      }
    />
  );
}
