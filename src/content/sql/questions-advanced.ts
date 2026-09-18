import type { QaQuestion } from '@/content/qa/types';

/** Advanced querying, changing data and production. Answers are plain text; `backticks` mark inline code. */
export const questionsSqlAdvanced: QaQuestion[] = [
  // ── Windows and puzzles ────────────────────────────────────────────────
  {
    id: 'window-vs-group-by',
    topic: 'advanced',
    difficulty: 'intermediate',
    question: "What is a window function, and how does it differ from GROUP BY?",
    answer:
      "A window function computes a value across a set of rows related to the current row — `f(…) OVER (PARTITION BY … ORDER BY …)` — without collapsing them. `GROUP BY` returns one row per group; a window function returns every row with the group's value attached, so you can show each order next to its customer's total, or rank rows within a group.",
    chapter: 'window-functions',
  },
  {
    id: 'rank-vs-dense-rank',
    topic: 'advanced',
    difficulty: 'basic',
    question: "What is the difference between `ROW_NUMBER`, `RANK` and `DENSE_RANK`?",
    answer:
      "With two rows tied for second place: `ROW_NUMBER` gives 1, 2, 3, 4 (unique, ties broken arbitrarily); `RANK` gives 1, 2, 2, 4 (ties share a rank, then a gap); `DENSE_RANK` gives 1, 2, 2, 3 (no gap). Use `ROW_NUMBER` to pick exactly one row per group and `DENSE_RANK` for the nth distinct value.",
    chapter: 'window-functions',
  },
  {
    id: 'second-highest-salary',
    topic: 'advanced',
    difficulty: 'basic',
    question: "Find the second-highest salary.",
    answer:
      "Several correct answers: `DENSE_RANK` in a CTE and keep rank 2; `SELECT DISTINCT salary … ORDER BY salary DESC LIMIT 1 OFFSET 1`; or `SELECT MAX(salary) WHERE salary < (SELECT MAX(salary) …)`. Clarify whether ties count — the second distinct salary (DENSE_RANK) or the second person (ROW_NUMBER) — and what to return if there is none.",
    code: {
      lang: 'sql',
      dataset: 'hr',
      code: `WITH ranked AS (
  SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS r
  FROM employee
)
SELECT DISTINCT salary FROM ranked WHERE r = 2;`,
    },
    chapter: 'classic-query-patterns',
  },
  {
    id: 'nth-highest-per-department',
    topic: 'advanced',
    difficulty: 'intermediate',
    question: "Find the highest-paid employee in each department.",
    answer:
      "Rank within each department with a window function in a CTE and keep rank 1. Use `RANK` to return all tied employees, or `ROW_NUMBER` with a tie-breaker to return exactly one.",
    code: {
      lang: 'sql',
      dataset: 'hr',
      code: `WITH ranked AS (
  SELECT department_id, first_name, salary,
         RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS r
  FROM employee
  WHERE department_id IS NOT NULL
)
SELECT department_id, first_name, salary FROM ranked WHERE r = 1;`,
    },
    chapter: 'classic-query-patterns',
  },
  {
    id: 'find-duplicates',
    topic: 'advanced',
    difficulty: 'basic',
    question: "How do you find duplicate rows?",
    answer:
      "Group by the columns that define a duplicate and keep groups with more than one row. To see the individual rows, use `COUNT(*) OVER (PARTITION BY …)` and filter where it is greater than 1.",
    code: {
      lang: 'sql',
      dataset: 'hr',
      code: `SELECT email, COUNT(*) AS copies
FROM applicant
GROUP BY email
HAVING COUNT(*) > 1;`,
    },
    chapter: 'classic-query-patterns',
  },
  {
    id: 'delete-duplicates',
    topic: 'advanced',
    difficulty: 'intermediate',
    question: "Delete duplicate rows, keeping one of each.",
    answer:
      "Keep one row per duplicate group — usually the lowest id — and delete the others: `DELETE … WHERE id NOT IN (SELECT MIN(id) … GROUP BY …)`, or number rows with `ROW_NUMBER() OVER (PARTITION BY …)` and delete those with a number above 1. In MySQL, wrap the subquery in a derived table. Afterwards add a unique constraint so duplicates cannot return.",
    code: {
      lang: 'sql',
      dataset: 'hr',
      code: `DELETE FROM applicant
WHERE id NOT IN (SELECT MIN(id) FROM applicant GROUP BY email);

SELECT * FROM applicant;`,
    },
    chapter: 'classic-query-patterns',
  },
  {
    id: 'running-total',
    topic: 'advanced',
    difficulty: 'intermediate',
    question: "How do you compute a running total?",
    answer:
      "Use `SUM(x) OVER (ORDER BY …)`. Add `PARTITION BY` to restart per group, and specify `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` when the order column has ties, because the default `RANGE` frame treats ties as one step. Without window functions it needs a correlated subquery or self-join, which is quadratic.",
    code: {
      lang: 'sql',
      dataset: 'shop',
      code: `SELECT id, ordered_at,
       COUNT(*) OVER (ORDER BY ordered_at ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS orders_so_far
FROM orders
ORDER BY ordered_at;`,
    },
    chapter: 'window-functions-running',
  },
  {
    id: 'lag-lead',
    topic: 'advanced',
    difficulty: 'intermediate',
    question: "What are `LAG` and `LEAD` used for?",
    answer:
      "They read a value from the previous or next row within the window's order — for differences between consecutive rows such as month-over-month growth, the salary increase at each raise, or days since a customer's previous order. The optional arguments set the offset and a default for the edges.",
    code: {
      lang: 'sql',
      dataset: 'hr',
      code: `SELECT employee_id, effective_from, salary,
       salary - LAG(salary) OVER (PARTITION BY employee_id ORDER BY effective_from) AS raise
FROM salary_history;`,
    },
    chapter: 'window-functions-running',
  },
  {
    id: 'gaps-and-islands',
    topic: 'advanced',
    difficulty: 'advanced',
    question: "How do you find consecutive runs (gaps and islands)?",
    answer:
      "Number the rows in order with `ROW_NUMBER`, and subtract that number from the sequence value (a date or integer). Within a run of consecutive values the difference is constant, so grouping by it yields each island; `MIN`, `MAX` and `COUNT` describe the run. Gaps are the spaces between one island's end and the next start.",
    code: {
      lang: 'sql',
      dataset: 'hr',
      code: `WITH numbered AS (
  SELECT employee_id, work_date,
         julianday(work_date) - ROW_NUMBER() OVER (PARTITION BY employee_id ORDER BY work_date) AS grp
  FROM attendance
)
SELECT employee_id, MIN(work_date) AS start_day, MAX(work_date) AS end_day, COUNT(*) AS days
FROM numbered
GROUP BY employee_id, grp;`,
    },
    chapter: 'classic-query-patterns',
  },
  {
    id: 'latest-per-group',
    topic: 'advanced',
    difficulty: 'intermediate',
    question: "Get each customer's most recent order.",
    answer:
      "Number each customer's orders newest first with `ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY ordered_at DESC, id DESC)` and keep row 1. The older alternative — joining to a subquery of `MAX(ordered_at)` per customer — returns duplicates when two orders share the latest timestamp.",
    code: {
      lang: 'sql',
      dataset: 'shop',
      code: `WITH latest AS (
  SELECT o.*, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY ordered_at DESC, id DESC) AS rn
  FROM orders o
)
SELECT customer_id, id, ordered_at FROM latest WHERE rn = 1;`,
    },
    chapter: 'classic-query-patterns',
  },
  {
    id: 'pivot',
    topic: 'advanced',
    difficulty: 'intermediate',
    question: "How do you turn rows into columns (pivot) in plain SQL?",
    answer:
      "Use conditional aggregation: one `SUM(CASE WHEN category = 'X' THEN value ELSE 0 END)` (or `COUNT(*) FILTER (WHERE …)`) per output column, grouped by the row key. The columns must be known when writing the query; fully dynamic pivots need generated SQL or dialect-specific features.",
    code: {
      lang: 'sql',
      dataset: 'shop',
      code: `SELECT strftime('%Y-%m', ordered_at) AS month,
       SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) AS delivered,
       SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled
FROM orders
GROUP BY month;`,
    },
    chapter: 'conditional-aggregation',
  },
  {
    id: 'percent-of-total',
    topic: 'advanced',
    difficulty: 'intermediate',
    question: "How do you show each group's share of the total?",
    answer:
      "Divide each group's aggregate by the grand total, computed with a window function over the aggregate: `100.0 * SUM(x) / SUM(SUM(x)) OVER ()`. Windows run after grouping, so the inner `SUM` is per group and the outer one sums across groups. Multiply by `100.0` to avoid integer division.",
    chapter: 'conditional-aggregation',
  },

  // ── Writes and schema ──────────────────────────────────────────────────
  {
    id: 'delete-truncate-drop',
    topic: 'changing',
    difficulty: 'basic',
    question: "What is the difference between `DELETE`, `TRUNCATE` and `DROP`?",
    answer:
      "`DELETE` removes selected rows (with a `WHERE`), one by one, firing triggers, and can be rolled back. `TRUNCATE` removes all rows at once by deallocating storage, resets identity counters, and is very fast — transactional in PostgreSQL but an implicit commit in MySQL. `DROP TABLE` removes the table itself, structure and data.",
    chapter: 'insert-update-delete',
  },
  {
    id: 'safe-update',
    topic: 'changing',
    difficulty: 'basic',
    question: "How do you make a production UPDATE or DELETE safe?",
    answer:
      "Run the same `WHERE` as a `SELECT COUNT(*)` (and look at some rows) first; run the change inside a transaction and check the affected-row count before committing; have a recent backup; for big tables, change in batches to avoid long locks; and use tools or modes that reject `UPDATE`/`DELETE` without a key condition.",
    chapter: 'insert-update-delete',
  },
  {
    id: 'returning',
    topic: 'changing',
    difficulty: 'intermediate',
    question: "How do you get the id generated by an INSERT?",
    answer:
      "`INSERT … RETURNING id` in PostgreSQL, SQLite 3.35+ and MariaDB. In MySQL, call `LAST_INSERT_ID()` on the same connection. From Java, JDBC's `getGeneratedKeys()` (or Spring's `KeyHolder`) works across databases.",
    chapter: 'insert-update-delete',
  },
  {
    id: 'upsert',
    topic: 'changing',
    difficulty: 'intermediate',
    question: "What is an upsert, and why not just check whether the row exists first?",
    answer:
      "An upsert inserts a row or updates it if a row with the same key exists, in one atomic statement: `INSERT … ON CONFLICT (key) DO UPDATE` (PostgreSQL, SQLite), `ON DUPLICATE KEY UPDATE` (MySQL) or `MERGE`. Checking first and then inserting races: two requests can both see no row and both insert. The upsert relies on a unique constraint to detect the conflict.",
    code: {
      lang: 'sql',
      dataset: 'shop',
      code: `CREATE TABLE page_view (product_id INTEGER PRIMARY KEY, views INTEGER NOT NULL);
INSERT INTO page_view VALUES (1, 1) ON CONFLICT (product_id) DO UPDATE SET views = views + 1;
INSERT INTO page_view VALUES (1, 1) ON CONFLICT (product_id) DO UPDATE SET views = views + 1;
SELECT * FROM page_view;`,
    },
    chapter: 'upserts',
  },
  {
    id: 'replace-into',
    topic: 'changing',
    difficulty: 'advanced',
    question: "Why is `REPLACE INTO` a poor upsert?",
    answer:
      "It deletes the existing row and inserts a new one. That fires delete triggers, can cascade-delete child rows through foreign keys, changes auto-generated values, and resets any column not supplied. A true upsert updates the existing row in place.",
    chapter: 'upserts',
  },
  {
    id: 'identity-gaps',
    topic: 'changing',
    difficulty: 'intermediate',
    question: "Why do auto-increment ids have gaps?",
    answer:
      "Identity values are allocated before the transaction commits and are not returned when it rolls back; databases also cache or pre-allocate values, which can be lost on restart, and failed inserts consume them. Ids are guaranteed unique, not consecutive — never use them to count rows or detect missing records.",
    chapter: 'tables-and-types',
  },
  {
    id: 'varchar-vs-text',
    topic: 'changing',
    difficulty: 'basic',
    question: "`VARCHAR(n)` or `TEXT`?",
    answer:
      "In PostgreSQL they perform the same; use `text`, or `varchar(n)` only when the length limit is a genuine business rule. In MySQL, `VARCHAR` counts toward the 65,535-byte row limit and can be fully indexed, while `TEXT` is stored off-page and needs a prefix length to index. Always use `utf8mb4` in MySQL so all Unicode characters fit.",
    chapter: 'tables-and-types',
  },
  {
    id: 'constraint-types',
    topic: 'changing',
    difficulty: 'basic',
    question: "Which constraints does SQL offer, and why use them instead of application validation?",
    answer:
      "`NOT NULL`, `PRIMARY KEY`, `UNIQUE`, `FOREIGN KEY`, `CHECK` and `DEFAULT`. The database enforces them for every writer — every application version, script and admin tool — and atomically, so they cannot be bypassed by bugs or races. Application validation is still useful for friendly messages; constraints are the last line of defence.",
    chapter: 'constraints',
  },
  {
    id: 'on-delete-cascade',
    topic: 'changing',
    difficulty: 'intermediate',
    question: "What do `ON DELETE CASCADE`, `SET NULL` and `RESTRICT` do?",
    answer:
      "They decide what happens to child rows when the referenced parent is deleted. `RESTRICT`/`NO ACTION` (the default) refuses the delete while children exist; `CASCADE` deletes the children too — suitable for owned data such as order lines; `SET NULL` clears the foreign key — for optional links. Cascades can remove much more than intended, so use them deliberately.",
    chapter: 'constraints',
  },
  {
    id: 'normal-forms',
    topic: 'changing',
    difficulty: 'intermediate',
    question: "Explain 1NF, 2NF and 3NF.",
    answer:
      "First normal form: atomic values — no lists or repeating groups in a column — and a key. Second: every non-key column depends on the whole key, not part of a composite key. Third: non-key columns depend only on the key, not on other non-key columns. Together they store each fact once and prevent update, insert and delete anomalies.",
    chapter: 'schema-design',
  },
  {
    id: 'many-to-many',
    topic: 'changing',
    difficulty: 'basic',
    question: "How do you model a many-to-many relationship?",
    answer:
      "With a junction (link) table holding a foreign key to each side and a composite primary key over both, for example `assignment (employee_id, project_id)`. The junction table can carry attributes of the relationship itself, such as role and hours, or quantity and price for order lines.",
    chapter: 'schema-design',
  },
  {
    id: 'view-vs-materialized',
    topic: 'changing',
    difficulty: 'intermediate',
    question: "What is the difference between a view and a materialized view?",
    answer:
      "A view is a stored query: reading it runs the query, so it is always current but costs the full query each time. A materialized view stores the result and must be refreshed, so reads are fast but data is only as fresh as the last refresh. PostgreSQL and Oracle have materialized views; in MySQL and SQLite a summary table refreshed by a job plays the role.",
    chapter: 'views-and-triggers',
  },
  {
    id: 'triggers-when',
    topic: 'changing',
    difficulty: 'advanced',
    question: "When are triggers a good idea?",
    answer:
      "For small, data-level concerns: audit trails, maintaining a denormalised column, or enforcing a rule constraints cannot express. They are poor for business workflows because they are invisible in application code, run inside every write (slowing bulk operations), can cascade, and are easy to miss in tests and migrations.",
    chapter: 'views-and-triggers',
  },

  // ── Performance and production ─────────────────────────────────────────
  {
    id: 'index-how',
    topic: 'production',
    difficulty: 'basic',
    question: "How does an index speed up a query, and what does it cost?",
    answer:
      "A B-tree index keeps a column's values sorted with pointers to the rows, so the database finds matches in a few page reads instead of scanning the table; it also serves range queries and ordering. The costs: every insert, update and delete must also update the index, and indexes use disk and memory.",
    chapter: 'indexes-and-plans',
  },
  {
    id: 'composite-index-order',
    topic: 'production',
    difficulty: 'intermediate',
    question: "Does column order matter in a composite index?",
    answer:
      "Yes. An index on `(a, b)` is sorted by `a`, then by `b`, so it serves conditions on `a` alone or on `a` and `b`, and ordering by `b` within one `a`, but not a condition on `b` alone. Put columns compared with equality first, then the range or sort column.",
    chapter: 'indexes-and-plans',
  },
  {
    id: 'why-index-not-used',
    topic: 'production',
    difficulty: 'intermediate',
    question: "Why might a query not use an index that exists?",
    answer:
      "A function or expression on the column (`LOWER(email)`, `YEAR(created_at)`), a leading wildcard in `LIKE`, an implicit type conversion, a condition on a non-leading column of a composite index, `OR` across different columns, or the planner estimating that most rows match so a scan is cheaper (sometimes because statistics are stale). Check with `EXPLAIN`.",
    chapter: 'indexes-and-plans',
  },
  {
    id: 'covering-index',
    topic: 'production',
    difficulty: 'advanced',
    question: "What is a covering index?",
    answer:
      "An index that contains every column a query needs, so the database answers from the index alone without reading the table rows ('Index Only Scan' in PostgreSQL, 'Using index' in MySQL, 'COVERING INDEX' in SQLite). PostgreSQL's `INCLUDE` clause adds non-key columns for this purpose.",
    chapter: 'indexes-and-plans',
  },
  {
    id: 'explain-analyze',
    topic: 'production',
    difficulty: 'intermediate',
    question: "How do you read a query plan?",
    answer:
      "Run `EXPLAIN` (the plan) or `EXPLAIN ANALYZE` (the plan with real timings; it executes the query). Look for full scans on large tables (Seq Scan, type ALL), extra sort steps (Sort, Using filesort), nested loops over big inputs, and estimated row counts far from actual ones, which point to stale statistics.",
    chapter: 'indexes-and-plans',
  },
  {
    id: 'transaction-sql',
    topic: 'production',
    difficulty: 'basic',
    question: "What do `BEGIN`, `COMMIT`, `ROLLBACK` and `SAVEPOINT` do?",
    answer:
      "`BEGIN` (`START TRANSACTION` in MySQL) starts a transaction; `COMMIT` makes its changes permanent and visible; `ROLLBACK` undoes them all; `SAVEPOINT name` marks a point you can `ROLLBACK TO` without abandoning the whole transaction. Outside a transaction, each statement commits on its own.",
    chapter: 'transactions-in-sql',
  },
  {
    id: 'select-for-update',
    topic: 'production',
    difficulty: 'intermediate',
    question: "What does `SELECT … FOR UPDATE` do, and what are `SKIP LOCKED` and `NOWAIT`?",
    answer:
      "It locks the selected rows until the transaction ends, so no one else can update or lock them in between — used when you read a row and then update it based on what you read. `SKIP LOCKED` skips rows already locked by others, which is how job queues let many workers take different rows; `NOWAIT` fails immediately instead of waiting.",
    chapter: 'transactions-in-sql',
  },
  {
    id: 'isolation-defaults',
    topic: 'production',
    difficulty: 'advanced',
    question: "What are the default isolation levels of PostgreSQL and MySQL?",
    answer:
      "PostgreSQL defaults to Read Committed: each statement sees data committed before it started. MySQL InnoDB defaults to Repeatable Read: plain reads see a snapshot from the transaction's first read, and locking reads use gap locks to prevent phantoms. Lost updates remain possible under both defaults unless you use atomic updates, locks or version checks.",
    chapter: 'transactions-in-sql',
  },
  {
    id: 'stored-procedure-pros-cons',
    topic: 'production',
    difficulty: 'intermediate',
    question: "What are the pros and cons of stored procedures?",
    answer:
      "Pros: logic runs next to the data with fewer round trips, one implementation serves every client, and permissions can be granted on the procedure rather than the tables. Cons: harder to test, version, debug and deploy; ties you to one database vendor; and uses the database's CPU, usually the hardest resource to scale. Many teams keep invariants in constraints and workflows in application code.",
    chapter: 'procedures-and-permissions',
  },
  {
    id: 'least-privilege-db',
    topic: 'production',
    difficulty: 'basic',
    question: "Which database privileges should an application have?",
    answer:
      "Only what it needs: `SELECT`, `INSERT`, `UPDATE` and `DELETE` (and `EXECUTE` on procedures) on its own schema — no DDL, no superuser. Run migrations with a separate user that can alter the schema, give reporting users read-only access (ideally to views, on a replica), and keep credentials in a secrets manager.",
    chapter: 'procedures-and-permissions',
  },
  {
    id: 'sql-injection-db',
    topic: 'production',
    difficulty: 'basic',
    question: "How do you prevent SQL injection?",
    answer:
      "Never build SQL by concatenating input; pass values as bind parameters (`?` or named parameters) so they are always treated as data. Identifiers such as table names or sort columns cannot be parameters — allow-list them in code. Least-privilege database users limit the damage if something slips through.",
    chapter: 'sql-in-applications',
  },
  {
    id: 'n-plus-one-sql',
    topic: 'production',
    difficulty: 'intermediate',
    question: "What is the N+1 query problem and how do you fix it in SQL?",
    answer:
      "Fetching a list with one query and then issuing one more query per item, so N items cost N+1 round trips. Replace the loop with a single set-based query — a join, or `WHERE parent_id IN (…)` — and assemble the results in the application (in JPA: fetch joins, entity graphs or batch fetching).",
    chapter: 'sql-in-applications',
  },
  {
    id: 'select-star',
    topic: 'production',
    difficulty: 'basic',
    question: "Why is `SELECT *` discouraged in application code?",
    answer:
      "It transfers columns the code does not use (possibly large text or JSON), prevents covering-index plans, and makes the code fragile when columns are added, removed or reordered. Select the columns you need; `SELECT *` is fine for interactive exploration.",
    chapter: 'sql-in-applications',
  },
  {
    id: 'distinct-smell',
    topic: 'production',
    difficulty: 'advanced',
    question: "Why can adding `DISTINCT` to fix duplicates be a bad sign?",
    answer:
      "Duplicates usually come from a join that multiplies rows — joining to a one-to-many table you only needed to test for existence. `DISTINCT` hides the symptom at the cost of a sort or hash over the whole result, and aggregates computed before it are still wrong. Use `EXISTS`, aggregate before joining, or fix the join condition.",
    chapter: 'sql-in-applications',
  },
];
