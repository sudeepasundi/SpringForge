import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { Module } from '@/lib/types';
import { moduleDir } from '@/content/curriculum';

type MdxModule = { default: ComponentType<Record<string, unknown>> };

/**
 * Every lesson is its own async chunk, so opening one lesson never downloads
 * the other sixty-seven.
 */
const loaders = import.meta.glob<MdxModule>('../content/modules/**/*.mdx');

/** `../content/modules/03-web-rest/api-design.mdx` → `03-web-rest/api-design` */
function keyOf(filePath: string): string {
  const match = /modules\/(.+)\.mdx$/.exec(filePath);
  return match?.[1] ?? filePath;
}

const byKey = new Map(Object.entries(loaders).map(([path, load]) => [keyOf(path), load]));

const cache = new Map<string, LazyExoticComponent<ComponentType<Record<string, unknown>>>>();

export function hasLessonContent(module: Module, lessonSlug: string): boolean {
  return byKey.has(`${moduleDir(module)}/${lessonSlug}`);
}

export function lessonComponent(
  module: Module,
  lessonSlug: string,
): LazyExoticComponent<ComponentType<Record<string, unknown>>> | null {
  const key = `${moduleDir(module)}/${lessonSlug}`;
  const load = byKey.get(key);
  if (!load) return null;
  let component = cache.get(key);
  if (!component) {
    component = lazy(load);
    cache.set(key, component);
  }
  return component;
}

/** Warms the chunk for a lesson the reader is about to open. */
export function prefetchLesson(module: Module, lessonSlug: string): void {
  void byKey.get(`${moduleDir(module)}/${lessonSlug}`)?.();
}

/** Used by the content-parity test. */
export function authoredLessonKeys(): string[] {
  return [...byKey.keys()].sort();
}
