/**
 * Build-time search index.
 *
 * Walks every lesson MDX file, strips code fences / JSX / markdown syntax down to
 * readable prose, and exposes the result as the virtual module `virtual:search-index`.
 * Doing this at build time keeps MiniSearch's runtime cost to "hydrate a JSON blob".
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
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
    // Template-literal expressions: Mermaid charts and Terminal transcripts.
    // Removed first, because a chart's arrows (-->) would end the tag match early.
    .replace(/\{`[\s\S]*?`\}/g, ' ')
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

/**
 * Basics guides share the index with lessons. Their ids are prefixed
 * `guide:` so the runtime can tell them apart from `module/lesson` paths.
 */
export function buildGuideIndex(guidesRoot: string): SearchDoc[] {
  return walk(guidesRoot).map((file) => {
    const slug = (file.split(sep).pop() ?? '').replace(/\.mdx$/, '');
    const { headings, body } = mdxToText(readFileSync(file, 'utf8'));
    return { id: `guide:${slug}`, moduleSlug: 'basics', lessonSlug: slug, headings, body };
  });
}

/** Chapters of a book (Spring JDBC, Java), ids prefixed `<book>:`. */
export function buildChapterIndex(chaptersRoot: string, book: string): SearchDoc[] {
  if (!existsSync(chaptersRoot)) return [];
  return walk(chaptersRoot).map((file) => {
    const slug = (file.split(sep).pop() ?? '').replace(/\.mdx$/, '');
    const { headings, body } = mdxToText(readFileSync(file, 'utf8'));
    return { id: `${book}:${slug}`, moduleSlug: book, lessonSlug: slug, headings, body };
  });
}

/** Directories under src/content holding chapter books. */
const CHAPTER_BOOKS = ['fundamentals', 'jdbc', 'java'];

export function searchIndexPlugin(): Plugin {
  let contentRoot = '';
  let guidesRoot = '';
  let contentBase = '';
  return {
    name: 'springforge:search-index',
    configResolved(config) {
      contentRoot = join(config.root, 'src', 'content', 'modules');
      guidesRoot = join(config.root, 'src', 'content', 'basics', 'guides');
      contentBase = join(config.root, 'src', 'content');
    },
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },
    load(id) {
      if (id !== RESOLVED_ID) return null;
      const docs = [
        ...buildIndex(contentRoot),
        ...buildGuideIndex(guidesRoot),
        ...CHAPTER_BOOKS.flatMap((book) =>
          buildChapterIndex(join(contentBase, book, 'chapters'), book),
        ),
      ];
      return `export default ${JSON.stringify(docs)};`;
    },
    handleHotUpdate(ctx) {
      if (!ctx.file.endsWith('.mdx')) return;
      const mod = ctx.server.moduleGraph.getModuleById(RESOLVED_ID);
      if (mod) ctx.server.moduleGraph.invalidateModule(mod);
    },
  };
}
