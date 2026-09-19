import { craftBook } from '@/content/craft';
import { ChapterArticle } from '@/components/chapters/ChapterArticle';

export default function CraftChapterPage() {
  return <ChapterArticle book={craftBook} />;
}
