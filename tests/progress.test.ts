import { beforeEach, describe, expect, it } from 'vitest';
import { completionOf, sanitise, streakOf, useProgress } from '@/store/progress';

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

/**
 * Local calendar date, matching what the store records.
 *
 * This deliberately does NOT use `toISOString()`. The store used to, and so did
 * this helper — so the fixtures and the code shared the same UTC assumption and
 * the suite could never fail, however far the test machine sat from UTC.
 */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString('en-CA');
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
    expect(streakOf([daysAgo(0), daysAgo(1), daysAgo(2)])).toBe(3);
  });

  it('survives a day that has not been worked yet', () => {
    expect(streakOf([daysAgo(1), daysAgo(2)])).toBe(2);
  });

  it('breaks when a day is missed', () => {
    expect(streakOf([daysAgo(0), daysAgo(2)])).toBe(1);
  });

  it('is zero once two days have been missed', () => {
    expect(streakOf([daysAgo(3), daysAgo(4)])).toBe(0);
  });
});

describe('sanitise', () => {
  it('returns an empty object for a non-object', () => {
    expect(sanitise(null)).toEqual({});
    expect(sanitise('nope')).toEqual({});
    expect(sanitise(42)).toEqual({});
  });

  it('coerces every wrong-typed field to a safe default', () => {
    // The shape a corrupt or hand-edited localStorage entry actually takes.
    // Before this existed, `completed: null` threw on the first render and,
    // because it threw on every load, bricked the app for that browser.
    const out = sanitise({
      completed: null,
      bookmarks: 'nope',
      activeDays: 7,
      quizzes: 5,
      lastVisited: { not: 'a string' },
      theme: 'banana',
    });

    expect(out).toEqual({
      completed: [],
      bookmarks: [],
      activeDays: [],
      quizzes: {},
      lastVisited: null,
      theme: 'system',
    });
  });

  it('keeps good values and drops only the bad entries', () => {
    const out = sanitise({
      completed: ['a/b', 42, 'c/d'],
      bookmarks: ['e/f'],
      activeDays: ['2026-01-01'],
      quizzes: {
        'a/b#check': { score: 3, total: 4, at: 123, attempts: 2 },
        'bad#check': { score: 'three', total: 4 },
        'null#check': null,
      },
      lastVisited: 'a/b',
      theme: 'dark',
    });

    expect(out.completed).toEqual(['a/b', 'c/d']);
    expect(out.bookmarks).toEqual(['e/f']);
    expect(out.theme).toBe('dark');
    expect(out.lastVisited).toBe('a/b');
    expect(Object.keys(out.quizzes ?? {})).toEqual(['a/b#check']);
  });

  it('defaults a quiz result that is missing its timestamp', () => {
    const out = sanitise({ quizzes: { 'a/b#c': { score: 1, total: 2 } } });
    expect(out.quizzes?.['a/b#c']).toEqual({ score: 1, total: 2, at: 0, attempts: 1 });
  });
});
