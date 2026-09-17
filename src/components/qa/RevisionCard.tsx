import { MessageCircleQuestion } from 'lucide-react';
import { HubCard } from '@/components/chapters/ChapterHub';
import { revisionPath, type QuestionSet } from '@/content/qa/types';

/** The hub card that links a book to its interview Q&A page. */
export function RevisionCard({ set }: { set: QuestionSet }) {
  return (
    <HubCard
      to={revisionPath(set)}
      icon={MessageCircleQuestion}
      title="Interview Q&A"
      body={`${set.questions.length} questions with model answers and likely follow-ups, filterable by topic and difficulty — quick revision before an interview.`}
    />
  );
}
