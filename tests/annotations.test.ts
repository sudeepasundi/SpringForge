import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { demos } from '@/content/demos';

/**
 * `<CodeExplorer>` annotations reference a demo file by raw path and a line
 * range by string. Neither is checked by anything: a typo in the path silently
 * renders no annotation, and a range past the end of the file silently
 * highlights nothing.
 *
 * Both happened. Four ranges shipped wrong in the Infrastructure track, one of
 * them spanning into an entirely different config entry, and they were only
 * found by measuring the rendered DOM. This does that check statically.
 */

// All MDX content: lessons, Basics guides and Spring JDBC chapters.
const ROOT = join(process.cwd(), 'src/content');

function mdxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return mdxFiles(full);
    return entry.endsWith('.mdx') ? [full] : [];
  });
}

/** Every demo file in every project, by path. */
const demoLineCounts = new Map<string, number>();
for (const demo of demos) {
  for (const file of demo.files) {
    demoLineCounts.set(file.path, file.code.split('\n').length);
  }
}

interface Annotation {
  lesson: string;
  file: string;
  lines: string;
}

/**
 * Parses the `annotations={[...]}` blocks well enough to extract each entry's
 * `file` and `lines`. The MDX is authored to one shape, so a regex pair is
 * sufficient and avoids compiling MDX just to lint it.
 */
function annotations(): Annotation[] {
  const out: Annotation[] = [];
  for (const path of mdxFiles(ROOT)) {
    const lesson = path.slice(ROOT.length + 1).replace(/\\/g, '/');
    const source = readFileSync(path, 'utf8');
    if (!source.includes('<CodeExplorer')) continue;

    for (const entry of source.matchAll(/\{\s*file: '([^']+)',\s*lines: '([^']+)',/g)) {
      out.push({ lesson, file: entry[1]!, lines: entry[2]! });
    }
  }
  return out;
}

describe('CodeExplorer annotations', () => {
  const all = annotations();

  it('finds annotations to check', () => {
    expect(all.length).toBeGreaterThan(40);
  });

  it('every annotation names a real demo file', () => {
    const missing = all
      .filter((a) => !demoLineCounts.has(a.file))
      .map((a) => `${a.lesson}: no demo file "${a.file}"`);
    expect(missing).toEqual([]);
  });

  it('every line range is well formed and within the file', () => {
    const bad: string[] = [];

    for (const a of all) {
      const total = demoLineCounts.get(a.file);
      if (total === undefined) continue; // reported by the test above

      for (const part of a.lines.split(',')) {
        const [from, to] = part.trim().split('-').map(Number);
        const end = to ?? from ?? NaN;

        if (!from || Number.isNaN(from) || Number.isNaN(end)) {
          bad.push(`${a.lesson}: "${a.lines}" is not a line range`);
        } else if (end < from) {
          bad.push(`${a.lesson}: "${a.lines}" ends before it starts`);
        } else if (end > total) {
          bad.push(
            `${a.lesson}: "${a.lines}" runs past the end of ${a.file} (${total} lines)`,
          );
        }
      }
    }

    expect(bad).toEqual([]);
  });

  it('every explorer sets a defaultFile that it actually includes', () => {
    const bad: string[] = [];
    for (const path of mdxFiles(ROOT)) {
      const source = readFileSync(path, 'utf8');
      const lesson = path.slice(ROOT.length + 1).replace(/\\/g, '/');
      for (const m of source.matchAll(/defaultFile="([^"]+)"/g)) {
        if (!demoLineCounts.has(m[1]!)) {
          bad.push(`${lesson}: defaultFile "${m[1]}" is not a demo file`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});
