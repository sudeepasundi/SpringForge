import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

type MdxModule = { default: ComponentType<Record<string, unknown>> };

/**
 * Basics guides, each its own async chunk — the same arrangement as lessons.
 * Adding a guide directory needs a dev-server restart; import.meta.glob is
 * resolved when the server starts.
 */
const loaders = import.meta.glob<MdxModule>('../content/basics/guides/*.mdx');

/** `../content/basics/guides/foo.mdx` → `foo` */
function slugOf(filePath: string): string {
  return /guides\/(.+)\.mdx$/.exec(filePath)?.[1] ?? filePath;
}

const bySlug = new Map(Object.entries(loaders).map(([path, load]) => [slugOf(path), load]));

const cache = new Map<string, LazyExoticComponent<ComponentType<Record<string, unknown>>>>();

export function authoredGuideSlugs(): string[] {
  return [...bySlug.keys()];
}

export function guideComponent(
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

export function prefetchGuide(slug: string): void {
  void bySlug.get(slug)?.();
}
