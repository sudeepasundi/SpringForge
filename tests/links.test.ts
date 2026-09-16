import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { modules, flatLessons } from '@/content/curriculum';

/**
 * Cross-links between lessons are plain markdown, so nothing checks them. Four
 * shipped broken — all of them a correct module slug with a near-miss lesson
 * slug, which is exactly the kind of typo review does not catch.
 */

const ROOT = join(process.cwd(), 'src/content/modules');

function mdxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return mdxFiles(full);
    return entry.endsWith('.mdx') ? [full] : [];
  });
}

interface Link {
  file: string;
  line: number;
  target: string;
}

function internalLinks(): Link[] {
  const out: Link[] = [];
  for (const file of mdxFiles(ROOT)) {
    const rel = file.slice(ROOT.length + 1).replace(/\\/g, '/');
    readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .forEach((line, i) => {
        for (const match of line.matchAll(/\]\((\/[^)\s]*)\)/g)) {
          out.push({ file: rel, line: i + 1, target: match[1]! });
        }
      });
  }
  return out;
}

const ROUTES = new Set(['/', '/path', '/demos', '/dashboard']);
const lessonPaths = new Set(flatLessons.map((l) => l.path));
const moduleSlugs = new Set(modules.map((m) => m.slug));

describe('internal links', () => {
  const links = internalLinks();

  it('finds links to check', () => {
    expect(links.length).toBeGreaterThan(20);
  });

  it('every /learn/<module>/<lesson> link resolves to a real lesson', () => {
    const broken = links
      .filter((l) => l.target.startsWith('/learn/'))
      .filter((l) => !lessonPaths.has(l.target.replace(/^\/learn\//, '').replace(/[#?].*$/, '')))
      .map((l) => `${l.file}:${l.line} -> ${l.target}`);

    expect(broken).toEqual([]);
  });

  it('every non-lesson internal link is a real route or module', () => {
    const broken = links
      .filter((l) => !l.target.startsWith('/learn/'))
      .filter((l) => {
        const clean = l.target.replace(/[#?].*$/, '');
        return !ROUTES.has(clean) && !moduleSlugs.has(clean.replace(/^\//, ''));
      })
      .map((l) => `${l.file}:${l.line} -> ${l.target}`);

    expect(broken).toEqual([]);
  });

  it('a link labelled "module NN" points at that module', () => {
    const wrong: string[] = [];
    for (const file of mdxFiles(ROOT)) {
      const rel = file.slice(ROOT.length + 1).replace(/\\/g, '/');
      readFileSync(file, 'utf8')
        .split(/\r?\n/)
        .forEach((line, i) => {
          for (const m of line.matchAll(/\[[Mm]odule (\d{2})\]\(\/learn\/([^/)]+)\//g)) {
            const declared = m[1]!;
            const slug = m[2]!;
            const target = modules.find((mod) => mod.slug === slug);
            if (target && target.id !== declared) {
              wrong.push(`${rel}:${i + 1} says module ${declared} but links to ${target.id}`);
            }
          }
        });
    }
    expect(wrong).toEqual([]);
  });
});
