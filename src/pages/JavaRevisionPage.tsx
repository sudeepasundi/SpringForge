import { RevisionPage } from '@/components/qa/RevisionPage';
import { javaQuestionSet } from '@/content/java/questions';

export default function JavaRevisionPage() {
  return <RevisionPage set={javaQuestionSet} />;
}
