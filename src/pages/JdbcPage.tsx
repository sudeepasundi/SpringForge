import { Database } from 'lucide-react';
import { jdbcBook } from '@/content/jdbc';
import { ChapterHub } from '@/components/chapters/ChapterHub';

export default function JdbcPage() {
  return <ChapterHub book={jdbcBook} icon={Database} />;
}
