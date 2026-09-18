import { Link, useSearchParams } from 'react-router-dom';
import { TerminalSquare } from 'lucide-react';
import { datasets } from '@/content/sql/datasets';
import { LazySqlPlayground } from '@/components/sql/lazy';
import { cn } from '@/lib/cn';

const STARTERS: Record<string, string> = {
  shop: `-- Revenue per category, delivered orders only
SELECT c.name AS category,
       ROUND(SUM(oi.quantity * oi.unit_price), 2) AS revenue
FROM order_item oi
JOIN orders o   ON o.id = oi.order_id
JOIN product p  ON p.id = oi.product_id
JOIN category c ON c.id = p.category_id
WHERE o.status = 'DELIVERED'
GROUP BY c.name
ORDER BY revenue DESC;`,
  hr: `-- Everyone with their manager's name
SELECT e.first_name || ' ' || e.last_name AS employee,
       e.job_title,
       m.first_name || ' ' || m.last_name AS manager
FROM employee e
LEFT JOIN employee m ON m.id = e.manager_id
ORDER BY e.id;`,
};

/** A full-page SQL editor over either sample dataset. `?dataset=` picks one. */
export default function SqlPlaygroundPage() {
  const [params, setParams] = useSearchParams();
  const current = datasets.find((d) => d.id === params.get('dataset')) ?? datasets[0]!;

  return (
    <div className="mx-auto max-w-[62rem] px-5 py-10 sm:px-8">
      <nav
        className="mb-4 flex items-center gap-1.5 text-[0.78rem] text-[color:var(--sf-text-faint)]"
        aria-label="Breadcrumb"
      >
        <Link to="/sql" className="hover:text-[color:var(--sf-text)]">
          SQL
        </Link>
        <span>/</span>
        <span>Playground</span>
      </nav>

      <header className="mb-6">
        <h1 className="flex items-center gap-2.5 text-[2rem] font-semibold tracking-[-0.025em]">
          <TerminalSquare size={26} className="shrink-0 text-[color:var(--sf-accent)]" />
          SQL playground
        </h1>
        <p className="mt-2.5 mb-0 max-w-[64ch] text-[0.98rem] leading-relaxed text-[color:var(--sf-text-muted)]">
          Write any SQL against a sample database. It runs on SQLite inside your browser — nothing is
          sent anywhere, and Reset puts the data back.
        </p>
      </header>

      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Dataset">
        {datasets.map((d) => (
          <button
            key={d.id}
            type="button"
            aria-pressed={d.id === current.id}
            onClick={() => setParams({ dataset: d.id }, { replace: true })}
            className={cn(
              'rounded-[var(--radius-token)] border px-3.5 py-2 text-left transition',
              d.id === current.id
                ? 'border-[color:var(--sf-accent)] bg-[color:var(--sf-accent-soft)]'
                : 'bg-[color:var(--sf-surface)] hover:border-[color:var(--sf-border-strong)]',
            )}
          >
            <span className="block text-[0.9rem] font-semibold">{d.title}</span>
            <span className="block max-w-[26rem] text-[0.76rem] text-[color:var(--sf-text-muted)]">
              {d.description}
            </span>
          </button>
        ))}
      </div>

      {/* Keyed by dataset: switching gives a fresh editor and database. */}
      <LazySqlPlayground
        key={current.id}
        dataset={current.id}
        query={STARTERS[current.id] ?? 'SELECT 1;'}
        title="Playground"
        showSchema
      />
    </div>
  );
}
