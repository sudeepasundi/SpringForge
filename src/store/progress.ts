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

function today(): string {
  return new Date().toISOString().slice(0, 10);
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
  if (!days.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(cursor.toISOString().slice(0, 10))) return 0;
  }
  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
