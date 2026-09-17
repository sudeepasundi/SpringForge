import { javaBook } from '@/content/java';
import { ChapterArticle } from '@/components/chapters/ChapterArticle';

export default function JavaChapterPage() {
  return <ChapterArticle book={javaBook} />;
}
