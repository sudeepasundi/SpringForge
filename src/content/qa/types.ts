import type { ChapterBook } from '@/content/chapters/types';

export type QuestionDifficulty = 'basic' | 'intermediate' | 'advanced';

export const questionDifficulties: { id: QuestionDifficulty; label: string }[] = [
  { id: 'basic', label: 'Basic' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];

/**
 * One interview-style question. `topic` is a group id of the set's book and
 * `chapter` a chapter slug in that group; tests/questions.test.ts checks both.
 *
 * `answer` is plain text in which `backticks` mark inline code. Paragraphs
 * are separated by a blank line.
 */
export interface QaQuestion {
  /** Stable kebab-case id, unique across all sets; used in `?q=` links and search. */
  id: string;
  topic: string;
  difficulty: QuestionDifficulty;
  question: string;
  answer: string;
  /** Short follow-up points an interviewer tends to probe. */
  points?: string[];
  /** With `dataset`, SQL that tests/sql.test.ts runs against that sample database. */
  code?: { lang: string; code: string; dataset?: 'shop' | 'hr' };
  chapter: string;
}

/** The questions behind one book's revision page, at `${book.basePath}/revision`. */
export interface QuestionSet {
  book: ChapterBook;
  /** Short topic labels for the filter chips, one per book group, in book order. */
  topics: { id: string; label: string }[];
  /** Hub-card and page introduction; the question count is appended. */
  intro: string;
  /** Filter placeholder, e.g. "try HashMap, volatile…". */
  placeholder: string;
  questions: QaQuestion[];
}

export function revisionPath(set: QuestionSet): string {
  return `${set.book.basePath}/revision`;
}
