import { Table2, TerminalSquare } from 'lucide-react';
import { sqlBook } from '@/content/sql';
import { sqlQuestionSet } from '@/content/sql/questions';
import { ChapterHub, HubCard } from '@/components/chapters/ChapterHub';
import { RevisionCard } from '@/components/qa/RevisionCard';

export default function SqlPage() {
  return (
    <ChapterHub book={sqlBook} icon={Table2}>
      <HubCard
        to="/sql/playground"
        icon={TerminalSquare}
        title="SQL playground"
        body="A full-page editor over the two sample databases — shop and HR — with a schema browser. Runs entirely in your browser."
      />
      <RevisionCard set={sqlQuestionSet} />
    </ChapterHub>
  );
}
