export type Level = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type Track = 'foundation' | 'core' | 'microservices' | 'production' | 'infrastructure';

export interface Lesson {
  /** URL segment, unique within its module. */
  slug: string;
  title: string;
  /** One sentence, shown on cards and in search results. */
  summary: string;
  minutes: number;
  level: Level;
  /** "By the end of this lesson you can…" — rendered above the body. */
  objectives: string[];
  tags: string[];
}

export interface Module {
  /** Two-digit ordinal, also the MDX directory prefix: `00-foundations`. */
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  track: Track;
  lessons: Lesson[];
}

export interface LessonRef {
  module: Module;
  lesson: Lesson;
  /** `moduleSlug/lessonSlug` — the canonical id used by routes and the store. */
  path: string;
  /** Zero-based position across the entire flattened curriculum. */
  index: number;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  /** Rendered as MDX-ish plain text; keep to one or two sentences. */
  options: string[];
  /** Indices into `options`. More than one entry makes it multi-select. */
  correct: number[];
  explanation: string;
}

export interface DemoFile {
  path: string;
  lang: string;
  code: string;
  /** Optional short note rendered beside the file in the explorer. */
  note?: string;
}

export interface DemoProject {
  id: string;
  name: string;
  tagline: string;
  description: string;
  stack: string[];
  files: DemoFile[];
}
