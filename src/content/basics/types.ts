export type AnnotationCategory =
  | 'core'
  | 'config'
  | 'web'
  | 'validation'
  | 'data'
  | 'transactions'
  | 'security'
  | 'testing'
  | 'messaging'
  | 'cloud';

/**
 * One entry in the Basics annotation catalogue.
 *
 * `name` is written without the `@`. `lessons` are lesson paths
 * (`moduleSlug/lessonSlug`) and `related` are other entry names; both are
 * checked by tests/basics.test.ts, so a renamed lesson or a typo fails the
 * build rather than rendering a dead link.
 */
export interface AnnotationEntry {
  name: string;
  category: AnnotationCategory;
  /** Fully qualified package, e.g. `org.springframework.stereotype`. */
  pkg: string;
  /** One line: what it is for. */
  summary: string;
  /** What actually happens at runtime — the part people get wrong. */
  mechanism: string;
  useWhen: string;
  avoidWhen?: string;
  /** The mistake this annotation is most often involved in. */
  pitfall?: string;
  example: { lang: string; code: string };
  related?: string[];
  lessons?: string[];
  /** Present when the annotation is deprecated; says what replaces it. */
  deprecated?: string;
}

export interface BasicsGuide {
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  /** Lesson paths that go deeper than the guide does. */
  lessons: string[];
}
