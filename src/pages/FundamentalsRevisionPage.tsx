import { RevisionPage } from '@/components/qa/RevisionPage';
import { fundamentalsQuestionSet } from '@/content/fundamentals/questions';

export default function FundamentalsRevisionPage() {
  return <RevisionPage set={fundamentalsQuestionSet} />;
}
