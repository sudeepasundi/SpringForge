import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

type MdxModule = { default: ComponentType<Record<string, unknown>> };

/**
 * Spring JDBC chapters, each its own async chunk — the same arrangement as
 * lessons and Basics guides. A new directory needs a dev-server restart.
 */
const loaders = import.meta.glob<MdxModule>('../content/jdbc/chapters/*.mdx');

function slugOf(filePath: string): string {
  return /chapters\/(.+)\.mdx$/.exec(filePath)?.[1] ?? filePath;
}

const bySlug = new Map(Object.entries(loaders).map(([path, load]) => [slugOf(path), load]));

const cache = new Map<string, LazyExoticComponent<ComponentType<Record<string, unknown>>>>();

export function chapterComponent(
  slug: string,
): LazyExoticComponent<ComponentType<Record<string, unknown>>> | null {
  const load = bySlug.get(slug);
  if (!load) return null;
  let component = cache.get(slug);
  if (!component) {
    component = lazy(load);
    cache.set(slug, component);
  }
  return component;
}

export function prefetchChapter(slug: string): void {
  void bySlug.get(slug)?.();
}
