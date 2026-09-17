import { Coffee } from 'lucide-react';
import { javaBook } from '@/content/java';
import { javaQuestionSet } from '@/content/java/questions';
import { ChapterHub } from '@/components/chapters/ChapterHub';
import { RevisionCard } from '@/components/qa/RevisionCard';

export default function JavaPage() {
  return (
    <ChapterHub book={javaBook} icon={Coffee}>
      <RevisionCard set={javaQuestionSet} />
    </ChapterHub>
  );
}
