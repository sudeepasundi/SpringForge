import { CircuitBoard } from 'lucide-react';
import { fundamentalsBook } from '@/content/fundamentals';
import { fundamentalsQuestionSet } from '@/content/fundamentals/questions';
import { ChapterHub } from '@/components/chapters/ChapterHub';
import { RevisionCard } from '@/components/qa/RevisionCard';

export default function FundamentalsPage() {
  return (
    <ChapterHub book={fundamentalsBook} icon={CircuitBoard}>
      <RevisionCard set={fundamentalsQuestionSet} />
    </ChapterHub>
  );
}
