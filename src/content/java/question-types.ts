export type QuestionDifficulty = 'basic' | 'intermediate' | 'advanced';

/**
 * One interview-style question. `topic` is a Java book group id and `chapter`
 * a chapter slug; both are checked by tests/java-questions.test.ts.
 *
 * `answer` is plain text in which `backticks` mark inline code. Paragraphs
 * are separated by a blank line.
 */
export interface JavaQuestion {
  /** Stable kebab-case id, used in `?q=` links and search. */
  id: string;
  topic: 'oop' | 'java8' | 'core' | 'modern' | 'concurrency' | 'jvm';
  difficulty: QuestionDifficulty;
  question: string;
  answer: string;
  /** Short follow-up points an interviewer tends to probe. */
  points?: string[];
  code?: { lang: string; code: string };
  chapter: string;
}
