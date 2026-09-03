import { describe, expect, it } from 'vitest';
import {
  flatLessons,
  getLessonRef,
  getModule,
  moduleDir,
  modules,
  neighbours,
  totalLessons,
  trackOrder,
  tracks,
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

/**
 * trackOrder used to be duplicated in the sidebar, the home page and the path
 * page. These assertions are what stop a new track rendering in one view and
 * silently not in another.
 */
describe('tracks', () => {
  it('lists every track exactly once, in a defined order', () => {
    expect(new Set(trackOrder).size).toBe(trackOrder.length);
  });

  it('has no track in the order that is missing a label', () => {
    const missing = trackOrder.filter((track) => !tracks[track]);
    expect(missing, `no label for: ${missing.join(', ')}`).toEqual([]);
  });

  it('has no labelled track missing from the order', () => {
    const orphans = Object.keys(tracks).filter(
      (track) => !trackOrder.includes(track as (typeof trackOrder)[number]),
    );
    expect(orphans, `labelled but never rendered: ${orphans.join(', ')}`).toEqual([]);
  });

  it('assigns every module to a track that is rendered', () => {
    const unreachable = modules.filter((m) => !trackOrder.includes(m.track));
    expect(unreachable.map((m) => m.slug)).toEqual([]);
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
