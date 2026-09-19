import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { craftBook } from '@/content/craft';

/**
 * The Craft section promises worked problems the reader steps through and
 * practice problems with hints. These checks keep every pattern chapter to
 * that promise, and every stage to the "try first" shape.
 */

const dir = join(process.cwd(), 'src/content/craft/chapters');
const source = (slug: string) => readFileSync(join(dir, `${slug}.mdx`), 'utf8');
const patterns = craftBook.chapters.filter((c) => c.group === 'patterns');

describe('Craft pattern chapters', () => {
  it.each(patterns.map((c) => [c.slug]))('%s has a worked walkthrough with at least three stages', (slug) => {
    const walkthroughs = source(slug).match(/<Walkthrough[\s\S]*?<\/Walkthrough>/g) ?? [];
    expect(walkthroughs.length).toBeGreaterThanOrEqual(1);
    for (const w of walkthroughs) {
      expect((w.match(/<Stage\b/g) ?? []).length).toBeGreaterThanOrEqual(3);
    }
  });

  it.each(patterns.map((c) => [c.slug]))('%s has practice problems with hints', (slug) => {
    const text = source(slug);
    expect(text).toMatch(/^## Practice/m);
    expect((text.match(/<Reveal\b/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });
});

describe('Craft walkthrough stages', () => {
  it('all have a title and a prompt', () => {
    const bad: string[] = [];
    for (const chapter of craftBook.chapters) {
      for (const m of source(chapter.slug).matchAll(/<Stage\b([^>]*)>/g)) {
        const attrs = m[1] ?? '';
        if (!/\stitle="[^"]+"/.test(attrs) || !/\sprompt="[^"]+"/.test(attrs)) {
          bad.push(`${chapter.slug}: ${m[0].slice(0, 60)}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});
