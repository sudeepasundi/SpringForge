import { jdbcBook } from '@/content/jdbc';
import { ChapterArticle } from '@/components/chapters/ChapterArticle';

export default function JdbcChapterPage() {
  return <ChapterArticle book={jdbcBook} />;
}
