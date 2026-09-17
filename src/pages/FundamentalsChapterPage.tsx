import { fundamentalsBook } from '@/content/fundamentals';
import { ChapterArticle } from '@/components/chapters/ChapterArticle';

export default function FundamentalsChapterPage() {
  return <ChapterArticle book={fundamentalsBook} />;
}
