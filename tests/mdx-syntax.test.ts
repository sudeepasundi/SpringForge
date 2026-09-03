import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const CONTENT_ROOT = join(process.cwd(), 'src', 'content', 'modules');

function mdxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return mdxFiles(full);
    return entry.endsWith('.mdx') ? [full] : [];
  });
}

/**
 * Returns the lines MDX will parse as JSX — everything outside a fenced code
 * block and outside a template-literal prop such as a Mermaid `chart`.
 *
 * Both exclusions are needed. Without the first, YAML and PromQL samples trip
 * the quote check; without the second, shell comments inside a <Terminal> look
 * like markdown headings.
 */
function jsxLines(source: string): { line: string; number: number }[] {
  const out: { line: string; number: number }[] = [];
  let inFence = false;
  let inTemplate = false;

  source.split(/\r?\n/).forEach((line, i) => {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;

    // An odd number of backticks opens or closes a template literal. Inline
    // code in prose is always balanced within a single line, so it is unaffected.
    const backticks = (line.match(/`/g) ?? []).length;
    const wasInTemplate = inTemplate;
    if (backticks % 2 === 1) inTemplate = !inTemplate;

    if (!wasInTemplate && !inTemplate) out.push({ line, number: i + 1 });
  });

  return out;
}

const files = mdxFiles(CONTENT_ROOT);

/**
 * These guard against MDX mistakes that surface only as a `vite build` failure,
 * which names a file but no line. A failing unit test pointing at the exact
 * line is a far shorter feedback loop.
 */
describe('MDX syntax', () => {
  it('finds lesson files to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  /**
   * An attribute like `title="Often "none""` closes at the second quote and
   * then fails on the third. This has broken the build twice, so it is a test.
   */
  it('has no nested double quotes inside a JSX attribute value', () => {
    const offenders: string[] = [];

    for (const file of files) {
      for (const { line, number } of jsxLines(readFileSync(file, 'utf8'))) {
        // An attribute value that closes, then continues with more characters
        // and another quote, rather than ending in whitespace, `/` or `>`.
        if (/\s[a-zA-Z-]+="[^"]*"[^\s/>=]+[^"]*"/.test(line)) {
          offenders.push(`${file}:${number}\n    ${line.trim()}`);
        }
      }
    }

    expect(offenders, `nested quotes in a JSX attribute:\n  ${offenders.join('\n  ')}`).toEqual([]);
  });

  /** Every diagram needs alt text to be usable with a screen reader. */
  it('gives every Mermaid diagram alt text and a caption', () => {
    const offenders: string[] = [];

    for (const file of files) {
      const diagrams = readFileSync(file, 'utf8').match(/<Mermaid[\s\S]*?\n\/>/g) ?? [];
      for (const diagram of diagrams) {
        if (!diagram.includes('alt=')) offenders.push(`${file}: a <Mermaid> has no alt text`);
        if (!diagram.includes('caption=')) offenders.push(`${file}: a <Mermaid> has no caption`);
      }
    }

    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  /**
   * A lesson page renders its title, summary and objectives from the manifest,
   * so an h1 in the body would duplicate the page heading.
   */
  it('starts lesson bodies at h2, never h1', () => {
    const offenders: string[] = [];

    for (const file of files) {
      for (const { line, number } of jsxLines(readFileSync(file, 'utf8'))) {
        if (/^#\s/.test(line)) offenders.push(`${file}:${number} — h1 in a lesson body`);
      }
    }

    expect(offenders, offenders.join('\n')).toEqual([]);
  });
});
