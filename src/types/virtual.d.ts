declare module 'virtual:search-index' {
  export interface SearchDoc {
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
