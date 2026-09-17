import { describe, expect, it } from 'vitest';
import { questionSets } from '@/content/qa';
import { questionDifficulties } from '@/content/qa/types';

/**
 * A revision page links each question to a chapter and filters by topic and
 * difficulty. A typo in any of those silently hides a question or renders a
 * dead "In depth" link.
 */

const difficultyIds = new Set<string>(questionDifficulties.map((d) => d.id));

describe('question ids', () => {
  it('are unique across every set, and URL-safe', () => {
    const ids = questionSets.flatMap((s) => s.questions.map((q) => q.id));
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
    expect(ids.filter((id) => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id))).toEqual([]);
  });
});

describe.each(questionSets.map((s) => [s.book.id, s] as const))('%s questions', (_id, set) => {
  const { book, questions } = set;
  const groupOf = new Map(book.chapters.map((c) => [c.slug, c.group]));

  it('has a useful number of questions', () => {
    expect(questions.length).toBeGreaterThanOrEqual(60);
  });

  it('uses the book’s groups as topics, in order', () => {
    expect(set.topics.map((t) => t.id)).toEqual(book.groups.map((g) => g.id));
  });

  it('uses only known difficulties', () => {
    expect(questions.filter((q) => !difficultyIds.has(q.difficulty)).map((q) => q.id)).toEqual([]);
  });

  it('links every question to an existing chapter in its own part', () => {
    const bad = questions
      .filter((q) => groupOf.get(q.chapter) !== q.topic)
      .map((q) => `${q.id} -> ${q.chapter} (${q.topic})`);
    expect(bad).toEqual([]);
  });

  it('covers every topic', () => {
    for (const group of book.groups) {
      expect(questions.filter((q) => q.topic === group.id).length, group.id).toBeGreaterThanOrEqual(8);
    }
  });

  it('has non-empty text and balanced inline code', () => {
    const bad = questions
      .filter((q) =>
        [q.question, q.answer, ...(q.points ?? [])].some(
          (text) => !text.trim() || (text.match(/`/g) ?? []).length % 2 !== 0,
        ),
      )
      .map((q) => q.id);
    expect(bad).toEqual([]);
  });
});
