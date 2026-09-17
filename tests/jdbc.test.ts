import { describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { jdbcChapters, jdbcLevels } from '@/content/jdbc';
import { flatLessons } from '@/content/curriculum';
import { demos } from '@/content/demos';

/**
 * The JDBC section is a manifest pointing at MDX files, course lessons and
 * Shelf demo files. None of those pointers is checked anywhere else.
 */

const lessonPaths = new Set(flatLessons.map((l) => l.path));
const shelf = demos.find((d) => d.id === 'shelf');
const shelfPaths = new Set(shelf?.files.map((f) => f.path) ?? []);

describe('Spring JDBC chapters', () => {
  const dir = join(process.cwd(), 'src', 'content', 'jdbc', 'chapters');
  const authored = readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx$/, ''));

  it('has an MDX file for every chapter, and a chapter for every MDX file', () => {
    const declared = jdbcChapters.map((c) => c.slug);
    expect(declared.filter((s) => !authored.includes(s))).toEqual([]);
    expect(authored.filter((s) => !declared.includes(s))).toEqual([]);
  });

  it('has unique slugs', () => {
    const slugs = jdbcChapters.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('never goes back down a level', () => {
    const order = jdbcLevels.map((l) => l.id);
    const ranks = jdbcChapters.map((c) => order.indexOf(c.level));
    expect(ranks.every((r) => r >= 0)).toBe(true);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  it('covers every level', () => {
    for (const level of jdbcLevels) {
      expect(jdbcChapters.some((c) => c.level === level.id), level.id).toBe(true);
    }
  });

  it('links "go deeper" lessons that exist', () => {
    const dangling = jdbcChapters.flatMap((c) =>
      c.lessons.filter((p) => !lessonPaths.has(p)).map((p) => `${c.slug} -> ${p}`),
    );
    expect(dangling).toEqual([]);
  });

  it('points at Shelf files that exist', () => {
    expect(shelf).toBeDefined();
    const dangling = jdbcChapters.flatMap((c) =>
      c.demoFiles.filter((p) => !shelfPaths.has(p)).map((p) => `${c.slug} -> ${p}`),
    );
    expect(dangling).toEqual([]);
  });
});

describe('Shelf demo project', () => {
  it('keeps every file under its two top-level folders', () => {
    const tops = new Set([...shelfPaths].map((p) => p.split('/')[0]));
    expect([...tops].sort()).toEqual(['shelf-api', 'shelf-db']);
  });

  it('shares no file path with any other project', () => {
    const others = demos.filter((d) => d.id !== 'shelf').flatMap((d) => d.files.map((f) => f.path));
    expect(others.filter((p) => shelfPaths.has(p))).toEqual([]);
  });
});
