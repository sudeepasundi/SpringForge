import MiniSearch, { type SearchResult } from 'minisearch';
import rawDocs from 'virtual:search-index';
import { flatLessons } from '@/content/curriculum';

export interface IndexedLesson {
  id: string;
  title: string;
  summary: string;
  moduleTitle: string;
  moduleSlug: string;
  tags: string;
  headings: string;
  body: string;
}

export interface Hit {
  path: string;
  title: string;
  moduleTitle: string;
  summary: string;
  /** A short window of body text around the first match, for the result row. */
  excerpt: string;
  score: number;
}

const bodyByPath = new Map(rawDocs.map((d) => [d.id, d]));

/**
 * The manifest is authoritative: a lesson is searchable by its metadata even
 * before its MDX file exists, so an in-progress module still routes correctly.
 */
const documents: IndexedLesson[] = flatLessons.map(({ module, lesson, path }) => {
  const doc = bodyByPath.get(path);
  return {
    id: path,
    title: lesson.title,
    summary: lesson.summary,
    moduleTitle: module.title,
    moduleSlug: module.slug,
    tags: lesson.tags.join(' '),
    headings: doc?.headings.join(' · ') ?? '',
    body: doc?.body ?? lesson.objectives.join(' '),
  };
});

let index: MiniSearch<IndexedLesson> | null = null;

function getIndex(): MiniSearch<IndexedLesson> {
  if (index) return index;
  index = new MiniSearch<IndexedLesson>({
    fields: ['title', 'summary', 'headings', 'tags', 'moduleTitle', 'body'],
    storeFields: ['title', 'summary', 'moduleTitle'],
    searchOptions: {
      prefix: true,
      fuzzy: 0.15,
      boost: { title: 5, headings: 3, tags: 3, summary: 2, moduleTitle: 1.5 },
      combineWith: 'AND',
    },
  });
  index.addAll(documents);
  return index;
}

const bodyText = new Map(documents.map((d) => [d.id, d.body]));

function excerptFor(path: string, query: string): string {
  const body = bodyText.get(path) ?? '';
  const term = query.trim().split(/\s+/)[0] ?? '';
  if (!term) return body.slice(0, 150);
  const at = body.toLowerCase().indexOf(term.toLowerCase());
  if (at < 0) return body.slice(0, 150);
  const start = Math.max(0, at - 60);
  return (start > 0 ? '…' : '') + body.slice(start, start + 170).trim() + '…';
}

export function search(query: string, limit = 12): Hit[] {
  const q = query.trim();
  if (q.length < 2) return [];
  const results = getIndex().search(q) as (SearchResult & {
    title: string;
    summary: string;
    moduleTitle: string;
  })[];
  return results.slice(0, limit).map((r) => ({
    path: String(r.id),
    title: r.title,
    summary: r.summary,
    moduleTitle: r.moduleTitle,
    excerpt: excerptFor(String(r.id), q),
    score: r.score,
  }));
}

export function suggest(query: string, limit = 5): string[] {
  const q = query.trim();
  if (q.length < 2) return [];
  return getIndex()
    .autoSuggest(q, { fuzzy: 0.2 })
    .slice(0, limit)
    .map((s) => s.suggestion);
}
