/**
 * Build-time search index.
 *
 * Walks every lesson MDX file, strips code fences / JSX / markdown syntax down to
 * readable prose, and exposes the result as the virtual module `virtual:search-index`.
 * Doing this at build time keeps MiniSearch's runtime cost to "hydrate a JSON blob".
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { Plugin } from 'vite';

const VIRTUAL_ID = 'virtual:search-index';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

export interface SearchDoc {
  /** `moduleSlug/lessonSlug` — matches the route path. */
  id: string;
  moduleSlug: string;
  lessonSlug: string;
  headings: string[];
  body: string;
}

function walk(dir: string): string[] {
  let out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out = out.concat(walk(full));
    else if (entry.endsWith('.mdx')) out.push(full);
  }
  return out;
}

/** Reduce MDX to searchable prose. Deliberately lossy — precision beats fidelity here. */
export function mdxToText(source: string): { headings: string[]; body: string } {
  const headings: string[] = [];
  let text = source
    .replace(/^---\r?\n[\s\S]*?\r?\n---/, '') // frontmatter
    .replace(/^import[^\n]*$/gm, '')
    .replace(/^export[\s\S]*?^\}/gm, '')
    .replace(/```[\s\S]*?```/g, ' ') // fenced code
    .replace(/<[^>]+>/g, ' '); // JSX / html tags

  for (const match of text.matchAll(/^#{1,4}\s+(.+)$/gm)) {
    const h = match[1];
    if (h) headings.push(h.replace(/[*`_]/g, '').trim());
  }

  text = text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`>|]/g, ' ')
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return { headings, body: text };
}

export function buildIndex(contentRoot: string): SearchDoc[] {
  return walk(contentRoot).map((file) => {
    const rel = relative(contentRoot, file).split(sep);
    const lessonSlug = (rel.pop() ?? '').replace(/\.mdx$/, '');
    const moduleSlug = rel.join('/');
    const { headings, body } = mdxToText(readFileSync(file, 'utf8'));
    return { id: `${moduleSlug}/${lessonSlug}`, moduleSlug, lessonSlug, headings, body };
  });
}

export function searchIndexPlugin(): Plugin {
  let contentRoot = '';
  return {
    name: 'springforge:search-index',
    configResolved(config) {
      contentRoot = join(config.root, 'src', 'content', 'modules');
    },
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },
    load(id) {
      if (id !== RESOLVED_ID) return null;
      return `export default ${JSON.stringify(buildIndex(contentRoot))};`;
    },
    handleHotUpdate(ctx) {
      if (!ctx.file.endsWith('.mdx')) return;
      const mod = ctx.server.moduleGraph.getModuleById(RESOLVED_ID);
      if (mod) ctx.server.moduleGraph.invalidateModule(mod);
    },
  };
}
