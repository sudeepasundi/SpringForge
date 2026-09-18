import { RevisionPage } from '@/components/qa/RevisionPage';
import { sqlQuestionSet } from '@/content/sql/questions';

export default function SqlRevisionPage() {
  return <RevisionPage set={sqlQuestionSet} />;
}
