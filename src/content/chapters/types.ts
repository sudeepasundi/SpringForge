export type ChapterLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * One chapter of a book (Spring JDBC, Java). `lessons` are course lesson
 * paths and `demoFiles` are paths in the book's demo project; both are
 * checked by tests/chapters.test.ts.
 */
export interface Chapter {
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  level: ChapterLevel;
  /** Id of the group (part) the chapter belongs to. */
  group: string;
  lessons: string[];
  demoFiles: string[];
}

export interface ChapterGroup {
  id: string;
  label: string;
  blurb: string;
}

/**
 * A top-nav section made of numbered chapters, read in order. Chapters are
 * listed in reading order and grouped contiguously.
 */
export interface ChapterBook {
  /** Also the MDX directory under src/content and the search id prefix. */
  id: 'jdbc' | 'java';
  /** Route prefix, e.g. `/jdbc`. */
  basePath: string;
  title: string;
  /** Hub introduction. */
  intro: string;
  /** Search tags added to every chapter. */
  tags: string;
  groups: ChapterGroup[];
  chapters: Chapter[];
  demo?: { id: string; name: string; blurb: string };
}

export function chapterNumber(book: ChapterBook, slug: string): number {
  return book.chapters.findIndex((c) => c.slug === slug) + 1;
}

export function getChapter(book: ChapterBook, slug: string | undefined): Chapter | undefined {
  return book.chapters.find((c) => c.slug === slug);
}
