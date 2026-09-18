import type { Chapter, ChapterBook } from '@/content/chapters/types';

type Entry = Omit<Chapter, 'demoFiles'>;

/** In reading order, part by part. Levels never go backwards within a part. */
const chapters: Entry[] = [
  // ── Part 1 — Foundations ───────────────────────────────────────────────
  {
    slug: 'what-is-sql',
    title: 'What SQL Is',
    summary:
      'Tables, rows, columns and keys; the relational model; the families of SQL statements; and how SQLite, MySQL and PostgreSQL differ.',
    minutes: 11,
    level: 'beginner',
    group: 'foundations',
    lessons: ['data/jpa-fundamentals'],
  },
  {
    slug: 'select-and-where',
    title: 'SELECT and WHERE',
    summary:
      'Choosing columns and rows: aliases, comparison and logical operators, precedence, IN, BETWEEN and LIKE.',
    minutes: 14,
    level: 'beginner',
    group: 'foundations',
    lessons: [],
  },
  {
    slug: 'null',
    title: 'NULL and Three-Valued Logic',
    summary:
      'What NULL means, why NULL = NULL is not true, IS NULL, COALESCE and NULLIF, and the NOT IN trap that silently returns nothing.',
    minutes: 12,
    level: 'beginner',
    group: 'foundations',
    lessons: [],
  },
  {
    slug: 'sorting-and-pagination',
    title: 'Sorting, Limiting and Pagination',
    summary:
      'ORDER BY with ties and NULLs, LIMIT and OFFSET versus FETCH FIRST, and keyset pagination for pages that stay fast.',
    minutes: 12,
    level: 'beginner',
    group: 'foundations',
    lessons: ['web-rest/api-design'],
  },
  {
    slug: 'expressions-and-functions',
    title: 'Expressions and Functions',
    summary:
      'Arithmetic, string, number and date functions, CASE expressions and CAST — with the places the dialects disagree.',
    minutes: 14,
    level: 'beginner',
    group: 'foundations',
    lessons: [],
  },

  // ── Part 2 — Combining data ────────────────────────────────────────────
  {
    slug: 'how-a-query-runs',
    title: 'How a Query Runs',
    summary:
      'The logical order a SELECT is evaluated in — FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY — and the errors that order explains.',
    minutes: 9,
    level: 'beginner',
    group: 'combining',
    lessons: [],
  },
  {
    slug: 'aggregation',
    title: 'Aggregation, GROUP BY and HAVING',
    summary:
      'COUNT, SUM, AVG, MIN and MAX; grouping; WHERE versus HAVING; COUNT(*) versus COUNT(column); and DISTINCT.',
    minutes: 15,
    level: 'intermediate',
    group: 'combining',
    lessons: [],
  },
  {
    slug: 'joins',
    title: 'Joins',
    summary:
      'Inner, left, right, full and cross joins, self-joins and anti-joins, with the row fan-out that surprises everyone once.',
    minutes: 18,
    level: 'intermediate',
    group: 'combining',
    lessons: ['data/entity-mapping', 'data/n-plus-one'],
  },
  {
    slug: 'subqueries',
    title: 'Subqueries',
    summary:
      'Scalar subqueries, IN and EXISTS, correlated subqueries, derived tables, and when a join is clearer or faster.',
    minutes: 14,
    level: 'intermediate',
    group: 'combining',
    lessons: [],
  },
  {
    slug: 'set-operations-and-ctes',
    title: 'Set Operations and CTEs',
    summary:
      'UNION, UNION ALL, INTERSECT and EXCEPT; WITH clauses for readable queries; and recursive CTEs that walk a hierarchy.',
    minutes: 15,
    level: 'intermediate',
    group: 'combining',
    lessons: [],
  },

  // ── Part 3 — Advanced querying ─────────────────────────────────────────
  {
    slug: 'window-functions',
    title: 'Window Functions I: Ranking',
    summary:
      'OVER and PARTITION BY, and the ranking functions ROW_NUMBER, RANK, DENSE_RANK and NTILE — calculations across rows without collapsing them.',
    minutes: 15,
    level: 'intermediate',
    group: 'advanced',
    lessons: [],
  },
  {
    slug: 'window-functions-running',
    title: 'Window Functions II: Running Totals and Frames',
    summary:
      'LAG and LEAD, running totals, moving averages, FIRST_VALUE and LAST_VALUE, and window frames — ROWS versus RANGE.',
    minutes: 15,
    level: 'intermediate',
    group: 'advanced',
    lessons: [],
  },
  {
    slug: 'classic-query-patterns',
    title: 'Classic Query Patterns',
    summary:
      'The questions interviewers love: nth highest value, top-N per group, finding and deleting duplicates, and gaps and islands.',
    minutes: 16,
    level: 'advanced',
    group: 'advanced',
    lessons: [],
  },
  {
    slug: 'conditional-aggregation',
    title: 'Conditional Aggregation and Pivoting',
    summary:
      'SUM(CASE …) and FILTER, turning rows into columns, and building the monthly report every business asks for.',
    minutes: 12,
    level: 'advanced',
    group: 'advanced',
    lessons: [],
  },

  // ── Part 4 — Changing data and schema ──────────────────────────────────
  {
    slug: 'insert-update-delete',
    title: 'INSERT, UPDATE and DELETE',
    summary:
      'Single and multi-row inserts, INSERT … SELECT, updates driven by other tables, RETURNING, and DELETE versus TRUNCATE versus DROP.',
    minutes: 14,
    level: 'intermediate',
    group: 'changing',
    lessons: [],
  },
  {
    slug: 'upserts',
    title: 'Upserts and Merges',
    summary:
      'Insert-or-update in one statement: ON CONFLICT, ON DUPLICATE KEY UPDATE and MERGE — and why check-then-insert races.',
    minutes: 10,
    level: 'intermediate',
    group: 'changing',
    lessons: ['event-driven/idempotency'],
  },
  {
    slug: 'tables-and-types',
    title: 'Tables and Data Types',
    summary:
      'CREATE, ALTER and DROP; choosing types for money, text and time; identity and auto-increment columns; and generated columns.',
    minutes: 14,
    level: 'intermediate',
    group: 'changing',
    lessons: ['data/migrations'],
  },
  {
    slug: 'constraints',
    title: 'Constraints and Integrity',
    summary:
      'Primary keys, foreign keys and what ON DELETE does, UNIQUE, CHECK, NOT NULL and DEFAULT — letting the database refuse bad data.',
    minutes: 13,
    level: 'intermediate',
    group: 'changing',
    lessons: ['data/entity-mapping'],
  },
  {
    slug: 'schema-design',
    title: 'Schema Design and Normalisation',
    summary:
      'First, second and third normal form with worked examples, one-to-many and many-to-many, when to denormalise, and naming.',
    minutes: 15,
    level: 'intermediate',
    group: 'changing',
    lessons: ['data/entity-mapping'],
  },
  {
    slug: 'views-and-triggers',
    title: 'Views, Materialized Views and Triggers',
    summary:
      'Saved queries as views, materialized views for expensive reports, and triggers — what they are good for and why to use them sparingly.',
    minutes: 12,
    level: 'advanced',
    group: 'changing',
    lessons: [],
  },

  // ── Part 5 — Performance and production ───────────────────────────────
  {
    slug: 'indexes-and-plans',
    title: 'Indexes and Query Plans',
    summary:
      'Watching a plan change from a scan to an index search, composite and covering indexes, and reading EXPLAIN in MySQL and PostgreSQL.',
    minutes: 16,
    level: 'advanced',
    group: 'production',
    lessons: ['data/n-plus-one', 'production/performance-tuning'],
  },
  {
    slug: 'transactions-in-sql',
    title: 'Transactions and Locking in SQL',
    summary:
      'BEGIN, COMMIT, ROLLBACK and SAVEPOINT, isolation levels in each database, and locking rows with SELECT … FOR UPDATE.',
    minutes: 14,
    level: 'advanced',
    group: 'production',
    lessons: ['data/transactions'],
  },
  {
    slug: 'procedures-and-permissions',
    title: 'Stored Procedures, Functions and Permissions',
    summary:
      'Procedures and functions in MySQL and PostgreSQL, users, roles, GRANT and REVOKE, and how much logic belongs in the database.',
    minutes: 13,
    level: 'advanced',
    group: 'production',
    lessons: ['security/security-hardening'],
  },
  {
    slug: 'sql-in-applications',
    title: 'SQL from Applications, and Anti-patterns',
    summary:
      'Parameters and injection, N+1 queries, batching and paging from code — and the query habits that quietly make databases slow.',
    minutes: 15,
    level: 'advanced',
    group: 'production',
    lessons: ['data/n-plus-one', 'data/jpa-fundamentals'],
  },
];

export const sqlBook: ChapterBook = {
  id: 'sql',
  basePath: '/sql',
  title: 'SQL',
  intro:
    'SQL from the first SELECT to window functions, schema design and query plans. Every example runs in your browser against a small sample database — edit it, break it, reset it. Queries are standard SQL, with notes where MySQL and PostgreSQL differ.',
  tags: 'sql database query mysql postgresql',
  groups: [
    { id: 'foundations', label: 'Part 1 · Foundations', blurb: 'Reading data: SELECT, WHERE, NULL, sorting and functions' },
    { id: 'combining', label: 'Part 2 · Combining Data', blurb: 'Aggregation, joins, subqueries and CTEs' },
    { id: 'advanced', label: 'Part 3 · Advanced Querying', blurb: 'Window functions and the classic query patterns' },
    { id: 'changing', label: 'Part 4 · Changing Data and Schema', blurb: 'Writes, upserts, tables, constraints and design' },
    { id: 'production', label: 'Part 5 · Performance and Production', blurb: 'Indexes, transactions, procedures and SQL from code' },
  ],
  chapters: chapters.map((c) => ({ ...c, demoFiles: [] })),
};
