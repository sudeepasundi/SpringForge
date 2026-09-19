import { Compass } from 'lucide-react';
import { craftBook } from '@/content/craft';
import { ChapterHub } from '@/components/chapters/ChapterHub';

export default function CraftPage() {
  return <ChapterHub book={craftBook} icon={Compass} />;
}
