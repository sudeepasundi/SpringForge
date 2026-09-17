import MiniSearch, { type SearchResult } from 'minisearch';
import rawDocs from 'virtual:search-index';
import { flatLessons } from '@/content/curriculum';
import {
  annotationAnchor,
  annotationCategories,
  annotations,
  basicsGuides,
} from '@/content/basics';
import { books } from '@/content/chapters';
import { questionSets } from '@/content/qa';
import { revisionPath } from '@/content/qa/types';

export type HitKind = 'lesson' | 'guide' | 'annotation' | 'chapter' | 'question';

export interface IndexedLesson {
  id: string;
  title: string;
  summary: string;
  moduleTitle: string;
  moduleSlug: string;
  tags: string;
  headings: string;
  body: string;
  kind: HitKind;
  href: string;
}

export interface Hit {
  /** Unique id: a lesson path, or `guide:`, `jdbc:`, `java:`, `annotation:` or `question:` prefixed. */
  path: string;
  kind: HitKind;
  /** Where selecting the hit navigates. */
  href: string;
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
const lessonDocs: IndexedLesson[] = flatLessons.map(({ module, lesson, path }) => {
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
    kind: 'lesson',
    href: `/learn/${path}`,
  };
});

const guideDocs: IndexedLesson[] = basicsGuides.map((guide) => {
  const doc = bodyByPath.get(`guide:${guide.slug}`);
  return {
    id: `guide:${guide.slug}`,
    title: guide.title,
    summary: guide.summary,
    moduleTitle: 'Basics · guide',
    moduleSlug: 'basics',
    tags: 'basics revision cheat sheet',
    headings: doc?.headings.join(' · ') ?? '',
    body: doc?.body ?? guide.summary,
    kind: 'guide',
    href: `/basics/${guide.slug}`,
  };
});

const chapterDocs: IndexedLesson[] = books.flatMap((book) => {
  const groupLabel = new Map(book.groups.map((g) => [g.id, g.label]));
  return book.chapters.map((chapter, i) => {
    const id = `${book.id}:${chapter.slug}`;
    const doc = bodyByPath.get(id);
    return {
      id,
      title: chapter.title,
      summary: chapter.summary,
      moduleTitle: `${book.title} · chapter ${i + 1}`,
      moduleSlug: book.id,
      // Split CamelCase names so "callable statement" finds CallableStatement.
      tags: [
        book.tags,
        chapter.level,
        groupLabel.get(chapter.group) ?? '',
        chapter.title.replace(/([a-z])([A-Z])/g, '$1 $2'),
      ].join(' '),
      headings: doc?.headings.join(' · ') ?? '',
      body: doc?.body ?? chapter.summary,
      kind: 'chapter' as const,
      href: `${book.basePath}/${chapter.slug}`,
    };
  });
});

const categoryLabel = new Map(annotationCategories.map((c) => [c.id, c.label]));

const annotationDocs: IndexedLesson[] = annotations.map((a) => {
  const anchor = annotationAnchor(a.name);
  return {
    id: `annotation:${anchor}`,
    title: `@${a.name}`,
    summary: a.summary,
    moduleTitle: `Annotation · ${categoryLabel.get(a.category) ?? a.category}`,
    moduleSlug: 'basics',
    tags: `annotation ${a.name} ${a.pkg}`,
    headings: '',
    body: [a.mechanism, a.useWhen, a.avoidWhen, a.pitfall, a.deprecated].filter(Boolean).join(' '),
    kind: 'annotation',
    href: `/basics/annotations?a=${anchor}`,
  };
});

/** Stripped of backticks: the answer text is indexed, not rendered. */
const questionDocs: IndexedLesson[] = questionSets.flatMap((set) => {
  const topicLabel = new Map(set.topics.map((t) => [t.id, t.label]));
  const bookId = set.book.id;
  return set.questions.map((q) => ({
    id: `question:${bookId}:${q.id}`,
    title: q.question.replace(/`/g, ''),
    summary: q.answer.split('\n')[0]!.replace(/`/g, ''),
    moduleTitle: `${set.book.title} Q&A · ${topicLabel.get(q.topic) ?? q.topic}`,
    moduleSlug: bookId,
    tags: `interview question ${set.book.tags} ${q.topic} ${q.difficulty}`,
    headings: '',
    body: [q.answer, ...(q.points ?? [])].join(' ').replace(/`/g, ''),
    kind: 'question' as const,
    href: `${revisionPath(set)}?q=${q.id}`,
  }));
});

const documents: IndexedLesson[] = [
  ...lessonDocs,
  ...guideDocs,
  ...chapterDocs,
  ...annotationDocs,
  ...questionDocs,
];

let index: MiniSearch<IndexedLesson> | null = null;

function getIndex(): MiniSearch<IndexedLesson> {
  if (index) return index;
  index = new MiniSearch<IndexedLesson>({
    fields: ['title', 'summary', 'headings', 'tags', 'moduleTitle', 'body'],
    storeFields: ['title', 'summary', 'moduleTitle', 'kind', 'href'],
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
    kind: HitKind;
    href: string;
  })[];
  return results.slice(0, limit).map((r) => ({
    path: String(r.id),
    kind: r.kind,
    href: r.href,
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
