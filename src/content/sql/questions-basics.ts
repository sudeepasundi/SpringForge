import type { QaQuestion } from '@/content/qa/types';

/** Foundations and combining data. Answers are plain text; `backticks` mark inline code. */
export const questionsSqlBasics: QaQuestion[] = [
  // ── Foundations ────────────────────────────────────────────────────────
  {
    id: 'sql-statement-types',
    topic: 'foundations',
    difficulty: 'basic',
    question: "What are DDL, DML, DQL, DCL and TCL?",
    answer:
      "Families of SQL statements. DDL defines structure (`CREATE`, `ALTER`, `DROP`, `TRUNCATE`); DML changes rows (`INSERT`, `UPDATE`, `DELETE`, `MERGE`); DQL queries (`SELECT`); DCL controls permissions (`GRANT`, `REVOKE`); TCL controls transactions (`BEGIN`, `COMMIT`, `ROLLBACK`, `SAVEPOINT`).",
    chapter: 'what-is-sql',
  },
  {
    id: 'primary-vs-foreign-key',
    topic: 'foundations',
    difficulty: 'basic',
    question: "What is the difference between a primary key and a foreign key?",
    answer:
      "A primary key uniquely identifies each row of a table: unique, not null, one per table (possibly over several columns). A foreign key is a column in one table that references the primary (or unique) key of another, and the database rejects values that point to a missing row. Primary keys give identity; foreign keys give relationships and referential integrity.",
    chapter: 'what-is-sql',
  },
  {
    id: 'sql-declarative',
    topic: 'foundations',
    difficulty: 'intermediate',
    question: "What does it mean that SQL is declarative?",
    answer:
      "You describe the result you want, not the steps to compute it. The database's query planner chooses how: which indexes to use, the join order and algorithm, whether to sort or hash. The same query can therefore become fast or slow when indexes or data statistics change, without the SQL changing.",
    chapter: 'what-is-sql',
  },
  {
    id: 'and-or-precedence',
    topic: 'foundations',
    difficulty: 'basic',
    question: "What does `WHERE a = 1 OR b = 2 AND c = 3` mean?",
    answer:
      "`AND` binds tighter than `OR`, so it means `a = 1 OR (b = 2 AND c = 3)`. Rows with `a = 1` match regardless of `c`. Whenever `AND` and `OR` are mixed, add parentheses to state the intent explicitly.",
    chapter: 'select-and-where',
  },
  {
    id: 'like-wildcards',
    topic: 'foundations',
    difficulty: 'basic',
    question: "How do `LIKE` wildcards work, and is `LIKE` case-sensitive?",
    answer:
      "`%` matches any sequence of characters (including none) and `_` matches exactly one. Case sensitivity depends on the database: case-insensitive for ASCII in SQLite, collation-dependent (usually insensitive) in MySQL, case-sensitive in PostgreSQL, which offers `ILIKE` for insensitive matching. A pattern starting with `%` cannot use a normal index.",
    chapter: 'select-and-where',
  },
  {
    id: 'null-equals-null',
    topic: 'foundations',
    difficulty: 'basic',
    question: "Why does `WHERE column = NULL` return no rows?",
    answer:
      "`NULL` means unknown, and any comparison with an unknown value is unknown rather than true or false (three-valued logic). `WHERE` keeps only rows where the condition is true, so `= NULL` never matches. Use `IS NULL` or `IS NOT NULL`.",
    chapter: 'null',
  },
  {
    id: 'not-in-null',
    topic: 'foundations',
    difficulty: 'intermediate',
    question: "Why can `NOT IN (subquery)` return no rows at all?",
    answer:
      "If the subquery returns a `NULL`, `x NOT IN (…, NULL)` expands to `… AND x <> NULL`, which is unknown for every row, so nothing passes the `WHERE`. Use `NOT EXISTS`, which is NULL-safe, or filter the subquery with `IS NOT NULL`.",
    code: {
      lang: 'sql',
      dataset: 'hr',
      code: `-- employees who manage nobody
SELECT first_name FROM employee e
WHERE NOT EXISTS (SELECT 1 FROM employee r WHERE r.manager_id = e.id);`,
    },
    chapter: 'null',
  },
  {
    id: 'coalesce-nullif',
    topic: 'foundations',
    difficulty: 'basic',
    question: "What do `COALESCE` and `NULLIF` do?",
    answer:
      "`COALESCE(a, b, …)` returns its first non-NULL argument — used for defaults such as `COALESCE(commission, 0)`. `NULLIF(a, b)` returns `NULL` when `a = b`, otherwise `a` — commonly used to avoid division by zero: `total / NULLIF(count, 0)`.",
    chapter: 'null',
  },
  {
    id: 'offset-vs-keyset',
    topic: 'foundations',
    difficulty: 'intermediate',
    question: "Why is `LIMIT … OFFSET` slow for deep pages, and what is the alternative?",
    answer:
      "The database must still read and discard all the skipped rows, so page 10,000 costs 10,000 pages of work, and rows inserted or deleted between requests shift pages. Keyset (seek) pagination remembers the last key seen and asks for `WHERE key > :last ORDER BY key LIMIT n`, which uses an index and costs the same for every page. It cannot jump to an arbitrary page number.",
    chapter: 'sorting-and-pagination',
  },
  {
    id: 'order-without-order-by',
    topic: 'foundations',
    difficulty: 'basic',
    question: "Is the order of rows guaranteed without `ORDER BY`?",
    answer:
      "No. Without `ORDER BY`, the database may return rows in any order, and the order can change after data changes, an index is added, a version upgrade or parallel execution. Always sort results you display or paginate, with a unique tie-breaker such as the primary key.",
    chapter: 'sorting-and-pagination',
  },
  {
    id: 'case-expression',
    topic: 'foundations',
    difficulty: 'basic',
    question: "How does a `CASE` expression work?",
    answer:
      "`CASE WHEN condition THEN value … ELSE value END` evaluates the `WHEN` branches in order and returns the first matching value, or the `ELSE` value (or `NULL` without an `ELSE`). It can be used anywhere an expression is allowed — in `SELECT`, `WHERE`, `ORDER BY`, and inside aggregates for conditional counting.",
    chapter: 'expressions-and-functions',
  },
  {
    id: 'money-type',
    topic: 'foundations',
    difficulty: 'intermediate',
    question: "Why should money not be stored as FLOAT or DOUBLE?",
    answer:
      "Binary floating point cannot represent most decimal fractions exactly, so `0.1 + 0.2` becomes `0.30000000000000004` and sums drift by cents. Use a fixed-point type — `DECIMAL(p, s)` / `NUMERIC` — or store integer minor units (cents), and round only at defined points.",
    chapter: 'expressions-and-functions',
  },

  // ── Combining data ─────────────────────────────────────────────────────
  {
    id: 'logical-query-order',
    topic: 'combining',
    difficulty: 'intermediate',
    question: "In what order is a SELECT statement logically evaluated?",
    answer:
      "`FROM`/`JOIN`, then `WHERE`, `GROUP BY`, `HAVING`, `SELECT` (including window functions), `DISTINCT`, `ORDER BY`, and finally `LIMIT`/`OFFSET`. That is why a `SELECT` alias cannot be used in `WHERE` but can be used in `ORDER BY`, and why aggregates are filtered with `HAVING`.",
    chapter: 'how-a-query-runs',
  },
  {
    id: 'where-vs-having',
    topic: 'combining',
    difficulty: 'basic',
    question: "What is the difference between `WHERE` and `HAVING`?",
    answer:
      "`WHERE` filters individual rows before grouping and cannot use aggregates. `HAVING` filters groups after `GROUP BY` and can use aggregates such as `COUNT(*) > 5`. Put plain row conditions in `WHERE` so fewer rows are grouped.",
    code: {
      lang: 'sql',
      dataset: 'shop',
      code: `SELECT customer_id, COUNT(*) AS orders
FROM orders
WHERE status <> 'CANCELLED'
GROUP BY customer_id
HAVING COUNT(*) >= 3;`,
    },
    chapter: 'aggregation',
  },
  {
    id: 'count-star-vs-column',
    topic: 'combining',
    difficulty: 'basic',
    question: "What is the difference between `COUNT(*)`, `COUNT(column)` and `COUNT(DISTINCT column)`?",
    answer:
      "`COUNT(*)` counts rows. `COUNT(column)` counts rows where that column is not `NULL`. `COUNT(DISTINCT column)` counts distinct non-NULL values. `COUNT(1)` is the same as `COUNT(*)` — there is no performance difference in modern databases.",
    chapter: 'aggregation',
  },
  {
    id: 'group-by-select-rule',
    topic: 'combining',
    difficulty: 'intermediate',
    question: "Why do you get an error for a column that is not in `GROUP BY`?",
    answer:
      "After grouping, each output row represents a whole group, so a column that is neither grouped nor aggregated has many possible values — the result would be ambiguous. PostgreSQL and MySQL (with `ONLY_FULL_GROUP_BY`, the default) reject it; add the column to `GROUP BY`, aggregate it, or use a window function. SQLite accepts it and picks an arbitrary value, which hides the bug.",
    chapter: 'aggregation',
  },
  {
    id: 'join-types',
    topic: 'combining',
    difficulty: 'basic',
    question: "Explain INNER, LEFT, RIGHT, FULL and CROSS joins.",
    answer:
      "`INNER JOIN` returns only pairs of rows that match the condition. `LEFT JOIN` returns every row from the left table, with `NULL`s for the right side where nothing matches; `RIGHT JOIN` is the mirror image. `FULL JOIN` keeps unmatched rows from both sides (MySQL lacks it). `CROSS JOIN` returns every combination — the Cartesian product.",
    chapter: 'joins',
  },
  {
    id: 'customers-without-orders',
    topic: 'combining',
    difficulty: 'basic',
    question: "Find customers who have never placed an order.",
    answer:
      "An anti-join: either `LEFT JOIN` orders and keep rows where the order side is `NULL`, or use `NOT EXISTS`. Avoid `NOT IN` if the subquery column can be `NULL`.",
    code: {
      lang: 'sql',
      dataset: 'shop',
      code: `SELECT c.name
FROM customer c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;`,
    },
    chapter: 'joins',
  },
  {
    id: 'employees-earning-more-than-manager',
    topic: 'combining',
    difficulty: 'intermediate',
    question: "Find employees who earn more than their manager.",
    answer:
      "Self-join the employee table: one alias for the employee, one for the manager, joined on `e.manager_id = m.id`, then compare salaries.",
    code: {
      lang: 'sql',
      dataset: 'hr',
      code: `SELECT e.first_name AS employee, e.salary, m.first_name AS manager, m.salary AS manager_salary
FROM employee e
JOIN employee m ON m.id = e.manager_id
WHERE e.salary > m.salary;`,
    },
    chapter: 'joins',
  },
  {
    id: 'left-join-where-trap',
    topic: 'combining',
    difficulty: 'intermediate',
    question: "Why does adding a `WHERE` condition on the right table make a LEFT JOIN behave like an INNER JOIN?",
    answer:
      "For left rows without a match, every right-side column is `NULL`, so a condition like `WHERE o.status = 'PAID'` is unknown and removes them. To filter the right side while keeping all left rows, move the condition into the `ON` clause: `LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'PAID'`.",
    chapter: 'joins',
  },
  {
    id: 'join-fan-out',
    topic: 'combining',
    difficulty: 'advanced',
    question: "Why can a SUM be too large after joining several tables?",
    answer:
      "Joining a parent to two independent one-to-many children multiplies rows: each child row of one table is repeated for each child row of the other, so sums and counts inflate. Aggregate each child table in its own subquery or CTE first, then join the aggregated results; `DISTINCT` only hides the problem.",
    chapter: 'joins',
  },
  {
    id: 'correlated-subquery',
    topic: 'combining',
    difficulty: 'intermediate',
    question: "What is a correlated subquery?",
    answer:
      "A subquery that refers to columns of the outer query, so conceptually it is evaluated once per outer row — for example, comparing each employee's salary with the average of their own department. Planners often rewrite them as joins, but on large tables check the plan, or rewrite with a join or window function.",
    code: {
      lang: 'sql',
      dataset: 'hr',
      code: `SELECT e.first_name, e.salary
FROM employee e
WHERE e.salary > (SELECT AVG(x.salary) FROM employee x WHERE x.department_id = e.department_id);`,
    },
    chapter: 'subqueries',
  },
  {
    id: 'in-vs-exists',
    topic: 'combining',
    difficulty: 'intermediate',
    question: "What is the difference between `IN` and `EXISTS`?",
    answer:
      "`IN (subquery)` checks whether a value is in the list the subquery returns; `EXISTS (subquery)` checks whether the (usually correlated) subquery returns any row and can stop at the first. Modern planners often execute them the same way. The practical difference is `NOT IN` versus `NOT EXISTS`: `NOT IN` returns nothing if the list contains a `NULL`.",
    chapter: 'subqueries',
  },
  {
    id: 'union-vs-union-all',
    topic: 'combining',
    difficulty: 'basic',
    question: "What is the difference between `UNION` and `UNION ALL`?",
    answer:
      "`UNION` combines two result sets and removes duplicates, which requires a sort or hash; `UNION ALL` keeps every row and is cheaper. Use `UNION ALL` unless you actually need duplicates removed. Both need the same number of columns with compatible types.",
    chapter: 'set-operations-and-ctes',
  },
  {
    id: 'what-is-cte',
    topic: 'combining',
    difficulty: 'intermediate',
    question: "What is a CTE, and when would you use a recursive one?",
    answer:
      "A common table expression (`WITH name AS (…)`) names a subquery so the main query — and later CTEs — can refer to it, making complex queries readable as steps. A recursive CTE has an anchor query and a recursive part joined with `UNION ALL`; it repeats until no new rows appear. Use it for hierarchies such as org charts and category trees, and to generate series.",
    code: {
      lang: 'sql',
      dataset: 'hr',
      code: `WITH RECURSIVE chain AS (
  SELECT id, first_name, 1 AS level FROM employee WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, e.first_name, c.level + 1 FROM employee e JOIN chain c ON e.manager_id = c.id
)
SELECT * FROM chain ORDER BY level;`,
    },
    chapter: 'set-operations-and-ctes',
  },
  {
    id: 'derived-table',
    topic: 'combining',
    difficulty: 'basic',
    question: "Find the average number of orders per customer.",
    answer:
      "Aggregate in two steps: count orders per customer in a derived table or CTE, then average those counts. Decide whether customers with no orders should count as zero; if so, start from the customer table with a LEFT JOIN.",
    code: {
      lang: 'sql',
      dataset: 'shop',
      code: `SELECT AVG(order_count) AS avg_orders
FROM (
  SELECT c.id, COUNT(o.id) AS order_count
  FROM customer c
  LEFT JOIN orders o ON o.customer_id = c.id
  GROUP BY c.id
) per_customer;`,
    },
    chapter: 'subqueries',
  },
];
