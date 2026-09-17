import { describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { books } from '@/content/chapters';
import { flatLessons } from '@/content/curriculum';
import { demos } from '@/content/demos';

/**
 * Chapter books (Spring JDBC, Java) are manifests pointing at MDX files,
 * course lessons and demo files. None of those pointers is checked anywhere
 * else.
 */

const lessonPaths = new Set(flatLessons.map((l) => l.path));
const LEVELS = ['beginner', 'intermediate', 'advanced'];

describe.each(books.map((b) => [b.id, b] as const))('%s chapters', (_id, book) => {
  const dir = join(process.cwd(), 'src', 'content', book.id, 'chapters');
  const authored = readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx$/, ''));
  const demo = book.demo && demos.find((d) => d.id === book.demo?.id);
  const demoPaths = new Set(demo?.files.map((f) => f.path) ?? []);

  it('has an MDX file for every chapter, and a chapter for every MDX file', () => {
    const declared = book.chapters.map((c) => c.slug);
    expect(declared.filter((s) => !authored.includes(s))).toEqual([]);
    expect(authored.filter((s) => !declared.includes(s))).toEqual([]);
  });

  it('has unique slugs', () => {
    const slugs = book.chapters.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('lists chapters group by group, in group order, covering every group', () => {
    const order = book.groups.map((g) => g.id);
    const ranks = book.chapters.map((c) => order.indexOf(c.group));
    expect(ranks.every((r) => r >= 0)).toBe(true);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    expect(new Set(ranks).size).toBe(order.length);
  });

  it('never goes back down a level within a group', () => {
    for (const group of book.groups) {
      const ranks = book.chapters
        .filter((c) => c.group === group.id)
        .map((c) => LEVELS.indexOf(c.level));
      expect(ranks, group.id).toEqual([...ranks].sort((a, b) => a - b));
    }
  });

  it('links "go deeper" lessons that exist', () => {
    const dangling = book.chapters.flatMap((c) =>
      c.lessons.filter((p) => !lessonPaths.has(p)).map((p) => `${c.slug} -> ${p}`),
    );
    expect(dangling).toEqual([]);
  });

  it('points at demo files that exist', () => {
    if (book.demo) expect(demo).toBeDefined();
    const dangling = book.chapters.flatMap((c) =>
      c.demoFiles.filter((p) => !demoPaths.has(p)).map((p) => `${c.slug} -> ${p}`),
    );
    expect(dangling).toEqual([]);
  });
});

describe('demo projects', () => {
  it('never share a file path', () => {
    const seen = new Map<string, string>();
    const clashes: string[] = [];
    for (const demo of demos) {
      for (const file of demo.files) {
        const owner = seen.get(file.path);
        if (owner) clashes.push(`${file.path}: ${owner} and ${demo.id}`);
        seen.set(file.path, demo.id);
      }
    }
    expect(clashes).toEqual([]);
  });

  it('keeps Shelf under its two top-level folders', () => {
    const shelf = demos.find((d) => d.id === 'shelf');
    const tops = new Set(shelf?.files.map((f) => f.path.split('/')[0]));
    expect([...tops].sort()).toEqual(['shelf-api', 'shelf-db']);
  });
});
