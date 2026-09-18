import { sqlBook } from '@/content/sql';
import { ChapterArticle } from '@/components/chapters/ChapterArticle';

export default function SqlChapterPage() {
  return <ChapterArticle book={sqlBook} />;
}
