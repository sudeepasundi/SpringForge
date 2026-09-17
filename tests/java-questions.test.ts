import { describe, expect, it } from 'vitest';
import { javaBook } from '@/content/java';
import { javaQuestions, questionDifficulties, questionTopics } from '@/content/java/questions';

/**
 * The Q&A page links each question to a chapter and filters by topic and
 * difficulty. A typo in any of those silently hides a question or renders a
 * dead "In depth" link.
 */

const chapterSlugs = new Set(javaBook.chapters.map((c) => c.slug));
const topicIds = new Set<string>(questionTopics.map((t) => t.id));
const difficultyIds = new Set<string>(questionDifficulties.map((d) => d.id));

describe('Java interview questions', () => {
  it('has a useful number of questions', () => {
    expect(javaQuestions.length).toBeGreaterThanOrEqual(80);
  });

  it('has unique, URL-safe ids', () => {
    const ids = javaQuestions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.filter((id) => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id))).toEqual([]);
  });

  it('uses the book’s groups as topics', () => {
    expect([...topicIds].sort()).toEqual(javaBook.groups.map((g) => g.id).sort());
  });

  it('uses only known topics and difficulties', () => {
    const bad = javaQuestions
      .filter((q) => !topicIds.has(q.topic) || !difficultyIds.has(q.difficulty))
      .map((q) => q.id);
    expect(bad).toEqual([]);
  });

  it('links every question to an existing chapter in its own part', () => {
    const groupOf = new Map(javaBook.chapters.map((c) => [c.slug, c.group]));
    const bad = javaQuestions
      .filter((q) => !chapterSlugs.has(q.chapter) || groupOf.get(q.chapter) !== q.topic)
      .map((q) => `${q.id} -> ${q.chapter}`);
    expect(bad).toEqual([]);
  });

  it('covers every topic', () => {
    for (const topic of topicIds) {
      expect(javaQuestions.filter((q) => q.topic === topic).length, topic).toBeGreaterThanOrEqual(8);
    }
  });

  it('has non-empty text and balanced inline code', () => {
    const bad = javaQuestions
      .filter((q) =>
        [q.question, q.answer, ...(q.points ?? [])].some(
          (text) => !text.trim() || (text.match(/`/g) ?? []).length % 2 !== 0,
        ),
      )
      .map((q) => q.id);
    expect(bad).toEqual([]);
  });
});
