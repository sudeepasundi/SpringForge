import type { Chapter, ChapterBook } from '@/content/chapters/types';

type Entry = Omit<Chapter, 'demoFiles'>;

/** In reading order, part by part. Levels never go backwards within a part. */
const chapters: Entry[] = [
  // ── Part 1 — The problem-solving method ───────────────────────────────
  {
    slug: 'how-good-programmers-solve-problems',
    title: 'How Good Programmers Solve Problems',
    summary:
      'The loop experienced developers follow — understand, explore, plan, code, test, reflect — and why starting by typing is the slow way.',
    minutes: 11,
    level: 'beginner',
    group: 'method',
    lessons: [],
  },
  {
    slug: 'understanding-the-problem',
    title: 'Understanding the Problem',
    summary:
      'Restating the problem, pinning down inputs, outputs and constraints, working examples by hand, asking clarifying questions and listing edge cases.',
    minutes: 13,
    level: 'beginner',
    group: 'method',
    lessons: [],
  },
  {
    slug: 'brute-force-first',
    title: 'Brute Force First, Then Optimise',
    summary:
      'Why the simplest correct solution comes first, how constraints tell you how fast it must be, and how to find the wasted work.',
    minutes: 13,
    level: 'beginner',
    group: 'method',
    lessons: [],
  },
  {
    slug: 'breaking-problems-down',
    title: 'Breaking Problems Down',
    summary:
      'Decomposition, writing the call before the function, pseudo-code, and solving a smaller version of the problem first.',
    minutes: 12,
    level: 'beginner',
    group: 'method',
    lessons: [],
  },
  {
    slug: 'checking-your-solution',
    title: 'Checking Your Solution',
    summary:
      'Tracing code by hand with a table, invariants, the off-by-one traps, and turning edge cases into tests before you are "done".',
    minutes: 12,
    level: 'beginner',
    group: 'method',
    lessons: [],
  },
  {
    slug: 'when-you-are-stuck',
    title: 'What to Do When You Are Stuck',
    summary:
      'A toolbox for being stuck: simplify, draw it, work backwards, change the representation, explain it aloud, time-box, and ask well.',
    minutes: 11,
    level: 'beginner',
    group: 'method',
    lessons: [],
  },

  // ── Part 2 — Problem patterns ─────────────────────────────────────────
  {
    slug: 'hash-maps-and-sets',
    title: 'Hash Maps and Sets',
    summary:
      'The most useful pattern of all: remember what you have seen. Lookups, counting and grouping, worked through Two Sum and anagram groups.',
    minutes: 15,
    level: 'intermediate',
    group: 'patterns',
    lessons: [],
  },
  {
    slug: 'two-pointers',
    title: 'Two Pointers',
    summary:
      'Walking an array from both ends, or with a fast and a slow index: pair sums in sorted data, removing duplicates in place, palindromes.',
    minutes: 14,
    level: 'intermediate',
    group: 'patterns',
    lessons: [],
  },
  {
    slug: 'sliding-window',
    title: 'Sliding Window',
    summary:
      'Keeping a running window over a sequence instead of recomputing it: the best block of k items, and the longest substring without repeats.',
    minutes: 14,
    level: 'intermediate',
    group: 'patterns',
    lessons: [],
  },
  {
    slug: 'sorting-and-greedy',
    title: 'Sorting and Greedy Choices',
    summary:
      'How sorting first simplifies problems, merging overlapping intervals, meeting rooms, and how to tell when a greedy choice is safe.',
    minutes: 14,
    level: 'intermediate',
    group: 'patterns',
    lessons: [],
  },
  {
    slug: 'binary-search-beyond-arrays',
    title: 'Binary Search, Beyond Arrays',
    summary:
      'Binary search done correctly, and its most useful form: searching for the smallest answer that works, such as a shipping capacity.',
    minutes: 14,
    level: 'intermediate',
    group: 'patterns',
    lessons: [],
  },
  {
    slug: 'recursion-and-backtracking',
    title: 'Recursion and Backtracking',
    summary:
      'Thinking recursively — trust the smaller call — then generating subsets and permutations, and pruning branches that cannot succeed.',
    minutes: 16,
    level: 'intermediate',
    group: 'patterns',
    lessons: [],
  },
  {
    slug: 'graphs-and-grids',
    title: 'Graphs and Grids',
    summary:
      'Seeing problems as graphs; depth-first search to count islands and breadth-first search for the shortest path through a maze.',
    minutes: 16,
    level: 'intermediate',
    group: 'patterns',
    lessons: [],
  },
  {
    slug: 'dynamic-programming',
    title: 'Dynamic Programming, Gently',
    summary:
      'From a slow recursive solution, to memoisation, to a table — climbing stairs and making change — and how to spot overlapping subproblems.',
    minutes: 17,
    level: 'intermediate',
    group: 'patterns',
    lessons: [],
  },

  // ── Part 3 — Writing and debugging real code ──────────────────────────
  {
    slug: 'reading-unfamiliar-code',
    title: 'Reading Unfamiliar Code',
    summary:
      'Finding the entry points, following one request end to end, and using the IDE, the tests and git history to understand a codebase you did not write.',
    minutes: 13,
    level: 'intermediate',
    group: 'real-code',
    lessons: ['foundations/project-anatomy', 'web-rest/request-lifecycle'],
  },
  {
    slug: 'names-functions-structure',
    title: 'Names, Functions and Structure',
    summary:
      'Names that explain, small functions at one level of detail, comments that say why, and a before-and-after refactor of real code.',
    minutes: 15,
    level: 'intermediate',
    group: 'real-code',
    lessons: [],
  },
  {
    slug: 'debugging-systematically',
    title: 'Debugging Systematically',
    summary:
      'Reproduce, observe, hypothesise, test, narrow down — with the debugger, logs and bisection — and fix the cause rather than the symptom.',
    minutes: 16,
    level: 'intermediate',
    group: 'real-code',
    lessons: ['boot-essentials/actuator-logging', 'observability/distributed-tracing'],
  },
  {
    slug: 'testing-as-you-go',
    title: 'Testing as You Go',
    summary:
      'What deserves a test, arrange–act–assert, writing the test first for a small feature, and the smells that make tests a burden.',
    minutes: 14,
    level: 'intermediate',
    group: 'real-code',
    lessons: ['testing/testing-strategy', 'testing/slice-tests'],
  },
  {
    slug: 'refactoring-safely',
    title: 'Refactoring Safely',
    summary:
      'Changing structure without changing behaviour: small steps under tests, the refactorings you will use weekly, and when to stop.',
    minutes: 13,
    level: 'intermediate',
    group: 'real-code',
    lessons: [],
  },
  {
    slug: 'code-review',
    title: 'Code Review',
    summary:
      'Making pull requests easy to review, reviewing usefully and kindly, and receiving feedback without taking it personally.',
    minutes: 12,
    level: 'intermediate',
    group: 'real-code',
    lessons: [],
  },

  // ── Part 4 — Getting better ───────────────────────────────────────────
  {
    slug: 'learning-a-new-technology',
    title: 'Learning a New Technology',
    summary:
      'A repeatable way to learn a framework, library or language: the official docs first, a toy project, reading its source, and knowing when you know enough.',
    minutes: 12,
    level: 'beginner',
    group: 'growth',
    lessons: [],
  },
  {
    slug: 'deliberate-practice',
    title: 'Deliberate Practice and Escaping Tutorial Hell',
    summary:
      'Why watching tutorials feels like progress and is not, how to practise so skill actually grows, and a plan for projects, katas and review.',
    minutes: 13,
    level: 'beginner',
    group: 'growth',
    lessons: [],
  },
  {
    slug: 'asking-good-questions',
    title: 'Asking Good Questions and Reading Docs',
    summary:
      'Searching well, reading documentation and error messages properly, and asking questions — with a minimal reproducible example — that get answered.',
    minutes: 11,
    level: 'beginner',
    group: 'growth',
    lessons: [],
  },
  {
    slug: 'using-ai-assistants-well',
    title: 'Using AI Assistants Well',
    summary:
      'Where AI coding assistants help and where they mislead, how to give them context, how to verify their output, and how to keep learning while using them.',
    minutes: 12,
    level: 'intermediate',
    group: 'growth',
    lessons: [],
  },
  {
    slug: 'habits-of-effective-engineers',
    title: 'Habits of Effective Engineers',
    summary:
      'Breaking work into tasks, estimating honestly, writing things down, communicating status, protecting focus — and a long-term learning plan.',
    minutes: 13,
    level: 'intermediate',
    group: 'growth',
    lessons: [],
  },
];

export const craftBook: ChapterBook = {
  id: 'craft',
  basePath: '/craft',
  title: 'Craft',
  intro:
    'How to approach a problem you have never seen, write code other people can work with, debug calmly, and keep getting better. Worked problems unfold one step at a time — try each step before you reveal the thinking.',
  tags: 'craft problem solving coding interview practice learning',
  groups: [
    { id: 'method', label: 'Part 1 · The Problem-Solving Method', blurb: 'A repeatable process for any problem' },
    { id: 'patterns', label: 'Part 2 · Problem Patterns', blurb: 'The shapes most problems turn out to have' },
    { id: 'real-code', label: 'Part 3 · Writing and Debugging Real Code', blurb: 'Reading, naming, debugging, testing, refactoring, reviewing' },
    { id: 'growth', label: 'Part 4 · Getting Better', blurb: 'Learning, practising, asking, and working well' },
  ],
  chapters: chapters.map((c) => ({ ...c, demoFiles: [] })),
};
