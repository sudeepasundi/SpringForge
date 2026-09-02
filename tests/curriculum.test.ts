import { describe, expect, it } from 'vitest';
import {
  flatLessons,
  getLessonRef,
  getModule,
  moduleDir,
  modules,
  neighbours,
  totalLessons,
} from '@/content/curriculum';
import { authoredLessonKeys } from '@/lib/lessons';

describe('curriculum manifest', () => {
  it('has unique module slugs and ids', () => {
    expect(new Set(modules.map((m) => m.slug)).size).toBe(modules.length);
    expect(new Set(modules.map((m) => m.id)).size).toBe(modules.length);
  });

  it('has unique lesson paths', () => {
    const paths = flatLessons.map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('numbers modules consecutively from 00', () => {
    modules.forEach((m, i) => expect(m.id).toBe(String(i).padStart(2, '0')));
  });

  it('gives every lesson objectives, tags and a positive duration', () => {
    for (const { lesson, path } of flatLessons) {
      expect(lesson.objectives.length, `${path} objectives`).toBeGreaterThan(0);
      expect(lesson.tags.length, `${path} tags`).toBeGreaterThan(0);
      expect(lesson.minutes, `${path} minutes`).toBeGreaterThan(0);
      expect(lesson.summary.length, `${path} summary`).toBeGreaterThan(20);
    }
  });

  it('indexes flatLessons in order', () => {
    flatLessons.forEach((ref, i) => expect(ref.index).toBe(i));
    expect(totalLessons).toBe(flatLessons.length);
  });
});

describe('lookups', () => {
  it('resolves a module and a lesson by slug', () => {
    expect(getModule('foundations')?.title).toBe('Foundations');
    expect(getLessonRef('foundations', 'what-is-spring')?.lesson.slug).toBe('what-is-spring');
    expect(getLessonRef('foundations', 'nope')).toBeUndefined();
    expect(getModule(undefined)).toBeUndefined();
  });

  it('links neighbours across module boundaries', () => {
    const first = flatLessons[0]!;
    const second = flatLessons[1]!;
    const last = flatLessons[flatLessons.length - 1]!;

    expect(neighbours(first.path).prev).toBeUndefined();
    expect(neighbours(first.path).next?.path).toBe(second.path);
    expect(neighbours(last.path).next).toBeUndefined();
    expect(neighbours('does/not-exist')).toEqual({});
  });
});

describe('content parity', () => {
  const declared = new Set(
    flatLessons.map(({ module, lesson }) => `${moduleDir(module)}/${lesson.slug}`),
  );

  it('has no MDX file that is missing from the manifest', () => {
    const orphans = authoredLessonKeys().filter((key) => !declared.has(key));
    expect(orphans, `orphaned MDX files: ${orphans.join(', ')}`).toEqual([]);
  });

  it('places every authored file in a directory named {id}-{slug}', () => {
    const dirs = new Set(modules.map(moduleDir));
    for (const key of authoredLessonKeys()) {
      expect(dirs.has(key.split('/')[0] ?? ''), `unexpected directory in ${key}`).toBe(true);
    }
  });
});
