import { beforeEach, describe, expect, it } from 'vitest';
import { completionOf, streakOf, useProgress } from '@/store/progress';

function reset() {
  useProgress.setState({
    completed: [],
    bookmarks: [],
    quizzes: {},
    lastVisited: null,
    activeDays: [],
    theme: 'system',
  });
}

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

describe('progress store', () => {
  beforeEach(reset);

  it('toggles completion both ways', () => {
    const { toggleComplete } = useProgress.getState();
    toggleComplete('foundations/what-is-spring');
    expect(useProgress.getState().completed).toContain('foundations/what-is-spring');
    toggleComplete('foundations/what-is-spring');
    expect(useProgress.getState().completed).toEqual([]);
  });

  it('records an active day only when a lesson is completed', () => {
    const { toggleComplete } = useProgress.getState();
    toggleComplete('a/b');
    expect(useProgress.getState().activeDays).toHaveLength(1);

    // Un-completing must not remove the day — it still happened.
    toggleComplete('a/b');
    expect(useProgress.getState().activeDays).toHaveLength(1);
  });

  it('setComplete is idempotent', () => {
    const { setComplete } = useProgress.getState();
    setComplete('a/b', true);
    setComplete('a/b', true);
    expect(useProgress.getState().completed).toEqual(['a/b']);
  });

  it('keeps the best quiz score but counts every attempt', () => {
    const { recordQuiz } = useProgress.getState();
    recordQuiz('a/b#check', 3, 3);
    recordQuiz('a/b#check', 1, 3);

    const result = useProgress.getState().quizzes['a/b#check'];
    expect(result?.score).toBe(3);
    expect(result?.attempts).toBe(2);
  });

  it('resets progress but leaves the theme alone', () => {
    const store = useProgress.getState();
    store.setTheme('dark');
    store.toggleComplete('a/b');
    store.toggleBookmark('a/b');
    useProgress.getState().resetProgress();

    const after = useProgress.getState();
    expect(after.completed).toEqual([]);
    expect(after.bookmarks).toEqual([]);
    expect(after.theme).toBe('dark');
  });
});

describe('completionOf', () => {
  it('returns 0 for an empty module', () => {
    expect(completionOf(['a/b'], [])).toBe(0);
  });

  it('counts only paths that belong to the module', () => {
    expect(completionOf(['a/b', 'x/y'], ['a/b', 'a/c'])).toBe(0.5);
  });
});

describe('streakOf', () => {
  it('is zero with no activity', () => {
    expect(streakOf([])).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    expect(streakOf([isoDaysAgo(0), isoDaysAgo(1), isoDaysAgo(2)])).toBe(3);
  });

  it('survives a day that has not been worked yet', () => {
    expect(streakOf([isoDaysAgo(1), isoDaysAgo(2)])).toBe(2);
  });

  it('breaks when a day is missed', () => {
    expect(streakOf([isoDaysAgo(0), isoDaysAgo(2)])).toBe(1);
  });

  it('is zero once two days have been missed', () => {
    expect(streakOf([isoDaysAgo(3), isoDaysAgo(4)])).toBe(0);
  });
});
