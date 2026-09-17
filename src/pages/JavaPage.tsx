import { Coffee, MessageCircleQuestion } from 'lucide-react';
import { javaBook } from '@/content/java';
import { javaQuestions } from '@/content/java/questions';
import { ChapterHub, HubCard } from '@/components/chapters/ChapterHub';

export default function JavaPage() {
  return (
    <ChapterHub book={javaBook} icon={Coffee}>
      <HubCard
        to="/java/revision"
        icon={MessageCircleQuestion}
        title="Interview Q&A"
        body={`${javaQuestions.length} questions with model answers and likely follow-ups, filterable by topic and difficulty — quick revision before an interview.`}
      />
    </ChapterHub>
  );
}
