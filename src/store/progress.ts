import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ThemePref = 'light' | 'dark' | 'system';

export interface QuizResult {
  /** Correct answers out of `total`. */
  score: number;
  total: number;
  /** Epoch millis of the most recent attempt. */
  at: number;
  attempts: number;
}

interface ProgressState {
  /** Lesson paths (`moduleSlug/lessonSlug`) marked complete. */
  completed: string[];
  bookmarks: string[];
  /** Keyed by `lessonPath#quizId`. */
  quizzes: Record<string, QuizResult>;
  lastVisited: string | null;
  /** ISO dates (YYYY-MM-DD) on which at least one lesson was completed. */
  activeDays: string[];
  theme: ThemePref;

  toggleComplete: (path: string) => void;
  setComplete: (path: string, done: boolean) => void;
  toggleBookmark: (path: string) => void;
  recordQuiz: (key: string, score: number, total: number) => void;
  visit: (path: string) => void;
  setTheme: (theme: ThemePref) => void;
  resetProgress: () => void;
}

const STORAGE_KEY = 'springforge:v1';

const THEMES: ThemePref[] = ['light', 'dark', 'system'];

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

/**
 * Coerce whatever is in localStorage into the shape the store promises.
 *
 * This is not defensive programming for its own sake: the key is shared with the
 * anti-flash script in index.html, it survives across releases, and a user can
 * edit it. Without this, a single `"completed": null` makes the first
 * `completed.includes(...)` throw during render — and because that happens on
 * every load, the app is permanently dead for that browser with no way back.
 */
export function sanitise(persisted: unknown): Partial<ProgressState> {
  if (!persisted || typeof persisted !== 'object') return {};
  const raw = persisted as Record<string, unknown>;

  const quizzes: Record<string, QuizResult> = {};
  if (raw.quizzes && typeof raw.quizzes === 'object') {
    for (const [key, value] of Object.entries(raw.quizzes as Record<string, unknown>)) {
      if (!value || typeof value !== 'object') continue;
      const q = value as Record<string, unknown>;
      if (typeof q.score !== 'number' || typeof q.total !== 'number') continue;
      quizzes[key] = {
        score: q.score,
        total: q.total,
        at: typeof q.at === 'number' ? q.at : 0,
        attempts: typeof q.attempts === 'number' ? q.attempts : 1,
      };
    }
  }

  return {
    completed: stringArray(raw.completed),
    bookmarks: stringArray(raw.bookmarks),
    activeDays: stringArray(raw.activeDays),
    quizzes,
    lastVisited: typeof raw.lastVisited === 'string' ? raw.lastVisited : null,
    theme: THEMES.includes(raw.theme as ThemePref) ? (raw.theme as ThemePref) : 'system',
  };
}

/**
 * Local calendar date as YYYY-MM-DD.
 *
 * `toISOString()` would give the UTC date, so a learner in UTC+13 finishing a
 * lesson at 9am would have it recorded against the previous day and one in UTC-8
 * finishing in the evening against the next — breaking streaks for everyone not
 * near UTC. `en-CA` formats as YYYY-MM-DD, which is what we want to compare.
 */
function localDay(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA');
}

function today(): string {
  return localDay();
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      completed: [],
      bookmarks: [],
      quizzes: {},
      lastVisited: null,
      activeDays: [],
      theme: 'system',

      setComplete: (path, done) =>
        set((s) => {
          const has = s.completed.includes(path);
          if (has === done) return s;
          return {
            completed: done ? [...s.completed, path] : s.completed.filter((p) => p !== path),
            activeDays:
              done && !s.activeDays.includes(today()) ? [...s.activeDays, today()] : s.activeDays,
          };
        }),

      toggleComplete: (path) =>
        set((s) => {
          const done = !s.completed.includes(path);
          return {
            completed: done ? [...s.completed, path] : s.completed.filter((p) => p !== path),
            activeDays:
              done && !s.activeDays.includes(today()) ? [...s.activeDays, today()] : s.activeDays,
          };
        }),

      toggleBookmark: (path) =>
        set((s) => ({
          bookmarks: s.bookmarks.includes(path)
            ? s.bookmarks.filter((p) => p !== path)
            : [...s.bookmarks, path],
        })),

      recordQuiz: (key, score, total) =>
        set((s) => {
          const prev = s.quizzes[key];
          // Keep the best score, but always advance the attempt counter.
          const best = prev && prev.score > score ? prev.score : score;
          return {
            quizzes: {
              ...s.quizzes,
              [key]: { score: best, total, at: Date.now(), attempts: (prev?.attempts ?? 0) + 1 },
            },
          };
        }),

      visit: (path) => set({ lastVisited: path }),

      setTheme: (theme) => set({ theme }),

      resetProgress: () =>
        set({ completed: [], bookmarks: [], quizzes: {}, activeDays: [], lastVisited: null }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Theme is intentionally persisted alongside progress: index.html reads this
      // same key before first paint to avoid a flash of the wrong theme.
      migrate: (persisted, version) => {
        // v0 predates streaks and bookmarks; seed them rather than dropping progress.
        if (version === 0 && persisted && typeof persisted === 'object') {
          return { activeDays: [], bookmarks: [], ...(persisted as Partial<ProgressState>) };
        }
        return persisted;
      },
      // `migrate` only runs when the stored version differs, so validation has to
      // live here: `merge` runs on every rehydrate, including the normal case.
      merge: (persisted, current) => ({ ...current, ...sanitise(persisted) }),
    },
  ),
);

/* ------------------------------ selectors ------------------------------ */

export function useIsComplete(path: string): boolean {
  return useProgress((s) => s.completed.includes(path));
}

export function useIsBookmarked(path: string): boolean {
  return useProgress((s) => s.bookmarks.includes(path));
}

/** Fraction 0–1 of the given lesson paths that are complete. */
export function completionOf(completed: string[], paths: string[]): number {
  if (paths.length === 0) return 0;
  const set = new Set(completed);
  return paths.filter((p) => set.has(p)).length / paths.length;
}

/** Consecutive days ending today (or yesterday) with at least one completion. */
export function streakOf(activeDays: string[]): number {
  if (activeDays.length === 0) return 0;
  const days = new Set(activeDays);
  const cursor = new Date();
  // A streak stays alive until the end of tomorrow, so start from yesterday
  // if nothing has been completed today yet.
  if (!days.has(localDay(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(localDay(cursor))) return 0;
  }
  let streak = 0;
  while (days.has(localDay(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
