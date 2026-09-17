declare module 'virtual:search-index' {
  export interface SearchDoc {
    /** `module/lesson` for lessons, `guide:<slug>` for Basics guides, `jdbc:<slug>` / `java:<slug>` for book chapters. */
    id: string;
    moduleSlug: string;
    lessonSlug: string;
    headings: string[];
    body: string;
  }
  const docs: SearchDoc[];
  export default docs;
}

declare module '*.mdx' {
  import type { ComponentType } from 'react';
  const MDXComponent: ComponentType<Record<string, unknown>>;
  export default MDXComponent;
}
