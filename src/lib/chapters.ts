import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { ChapterBook } from '@/content/chapters/types';

type MdxModule = { default: ComponentType<Record<string, unknown>> };
type Lazy = LazyExoticComponent<ComponentType<Record<string, unknown>>>;

/**
 * Chapter MDX for every book, each its own async chunk — the same arrangement
 * as lessons and Basics guides. A new directory needs a dev-server restart.
 */
const loaders: Record<ChapterBook['id'], Record<string, () => Promise<MdxModule>>> = {
  jdbc: import.meta.glob<MdxModule>('../content/jdbc/chapters/*.mdx'),
  java: import.meta.glob<MdxModule>('../content/java/chapters/*.mdx'),
};

function slugOf(filePath: string): string {
  return /chapters\/(.+)\.mdx$/.exec(filePath)?.[1] ?? filePath;
}

const byKey = new Map<string, () => Promise<MdxModule>>(
  Object.entries(loaders).flatMap(([book, files]) =>
    Object.entries(files).map(([path, load]) => [`${book}:${slugOf(path)}`, load] as const),
  ),
);

const cache = new Map<string, Lazy>();

export function chapterComponent(bookId: ChapterBook['id'], slug: string): Lazy | null {
  const key = `${bookId}:${slug}`;
  const load = byKey.get(key);
  if (!load) return null;
  let component = cache.get(key);
  if (!component) {
    component = lazy(load);
    cache.set(key, component);
  }
  return component;
}

export function prefetchChapter(bookId: ChapterBook['id'], slug: string): void {
  void byKey.get(`${bookId}:${slug}`)?.();
}
