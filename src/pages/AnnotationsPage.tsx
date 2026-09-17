import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AtSign, Search, X } from 'lucide-react';
import { AnnotationCard } from '@/components/basics/AnnotationCard';
import {
  annotationAnchor,
  annotationCategories,
  annotations,
  type AnnotationCategory,
  type AnnotationEntry,
} from '@/content/basics';
import { cn } from '@/lib/cn';

const labelOf = new Map(annotationCategories.map((c) => [c.id, c.label]));

function matches(entry: AnnotationEntry, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase().replace(/^@/, '');
  return [entry.name, entry.summary, entry.mechanism, entry.pkg, entry.useWhen]
    .join(' ')
    .toLowerCase()
    .includes(q);
}

/**
 * The catalogue. Filter state lives in the URL (?q=&cat=) so a filtered view
 * can be shared; ?a=<name> focuses one card. Hash routing owns the fragment,
 * so a query parameter is the only anchor available.
 */
export default function AnnotationsPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const category = (params.get('cat') ?? '') as AnnotationCategory | '';
  const focus = params.get('a') ?? '';

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const visible = useMemo(
    () => annotations.filter((a) => (!category || a.category === category) && matches(a, query)),
    [query, category],
  );

  const counts = useMemo(() => {
    const byCategory = new Map<string, number>();
    for (const a of annotations) {
      if (matches(a, query)) byCategory.set(a.category, (byCategory.get(a.category) ?? 0) + 1);
    }
    return byCategory;
  }, [query]);

  // Scroll to a focused card once it has rendered. Deferred to a macrotask
  // because the app shell scrolls to the top on navigation, and a parent's
  // effects run after this one — scrolling immediately would be undone. Not
  // requestAnimationFrame: that never fires in a background tab, so a link
  // opened there would never scroll.
  useEffect(() => {
    if (!focus) return;
    const timer = window.setTimeout(() => {
      document
        .getElementById(`annotation-${focus}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [focus]);

  const update = (next: Record<string, string>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    setParams(p, { replace: true });
  };

  const focusOn = (name: string) => {
    const anchor = annotationAnchor(name);
    // Keep the card being read open. It usually sits above the target, and
    // collapsing it mid-scroll would shift the page under the smooth scroll.
    setExpanded((s) => {
      const next = new Set(s).add(anchor);
      if (focus) next.add(focus);
      return next;
    });
    // Clear filters so the target is guaranteed to be on screen.
    setParams(new URLSearchParams({ a: anchor }), { replace: false });
  };

  const isOpen = (anchor: string) => expanded.has(anchor) || focus === anchor;

  const toggle = (anchor: string) => {
    // A card opened by ?a= is open because of the URL; closing it clears that.
    if (focus === anchor) {
      setExpanded((s) => {
        const next = new Set(s);
        next.delete(anchor);
        return next;
      });
      update({ a: '' });
      return;
    }
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(anchor)) next.delete(anchor);
      else next.add(anchor);
      return next;
    });
  };

  const allExpanded = visible.length > 0 && visible.every((a) => isOpen(annotationAnchor(a.name)));

  const groups = annotationCategories
    .map((c) => ({ ...c, items: visible.filter((a) => a.category === c.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-[62rem] px-5 py-10 sm:px-8">
      <nav
        className="mb-4 flex items-center gap-1.5 text-[0.78rem] text-[color:var(--sf-text-faint)]"
        aria-label="Breadcrumb"
      >
        <Link to="/basics" className="hover:text-[color:var(--sf-text)]">
          Basics
        </Link>
        <span>/</span>
        <span>Annotations</span>
      </nav>

      <header className="mb-6">
        <h1 className="flex items-center gap-2.5 text-[2rem] font-semibold tracking-[-0.025em]">
          <AtSign size={26} className="text-[color:var(--sf-accent)]" />
          Annotation reference
        </h1>
        <p className="mt-2.5 mb-0 max-w-[64ch] text-[0.98rem] leading-relaxed text-[color:var(--sf-text-muted)]">
          {annotations.length} annotations: what each one is for, what it actually does at runtime,
          when to reach for it, and the mistake it is usually involved in. Open a card for the
          detail and an example.
        </p>
      </header>

      <div className="sticky top-[var(--sf-header-h)] z-10 -mx-2 mb-5 bg-[color:var(--sf-bg)]/90 px-2 py-3 backdrop-blur-md">
        <label className="relative block">
          <span className="sr-only">Filter annotations</span>
          <Search
            size={15}
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[color:var(--sf-text-faint)]"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => update({ q: e.target.value, a: '' })}
            placeholder="Filter — try @Transactional, proxy, lazy, 404…"
            className="w-full rounded-lg border bg-[color:var(--sf-surface)] py-2.5 pr-9 pl-9 text-[0.92rem] outline-none focus:border-[color:var(--sf-accent)]"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear filter"
              onClick={() => update({ q: '' })}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-[color:var(--sf-text-faint)] hover:text-[color:var(--sf-text)]"
            >
              <X size={14} />
            </button>
          )}
        </label>

        <div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label="Category">
          <button
            type="button"
            aria-pressed={!category}
            onClick={() => update({ cat: '', a: '' })}
            className={cn(
              'rounded-full border px-2.5 py-1 text-[0.76rem] transition',
              !category
                ? 'border-[color:var(--sf-accent)] bg-[color:var(--sf-accent-soft)] font-medium text-[color:var(--sf-accent-text)]'
                : 'text-[color:var(--sf-text-muted)] hover:border-[color:var(--sf-border-strong)]',
            )}
          >
            All
          </button>
          {annotationCategories.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={category === c.id}
              onClick={() => update({ cat: category === c.id ? '' : c.id, a: '' })}
              className={cn(
                'rounded-full border px-2.5 py-1 text-[0.76rem] transition',
                category === c.id
                  ? 'border-[color:var(--sf-accent)] bg-[color:var(--sf-accent-soft)] font-medium text-[color:var(--sf-accent-text)]'
                  : 'text-[color:var(--sf-text-muted)] hover:border-[color:var(--sf-border-strong)]',
              )}
            >
              {c.label}
              <span className="ml-1 text-[color:var(--sf-text-faint)]">{counts.get(c.id) ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[0.76rem] text-[color:var(--sf-text-faint)]">
          <span aria-live="polite">
            {visible.length} of {annotations.length} shown
          </span>
          {visible.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (allExpanded) {
                  setExpanded(new Set());
                  update({ a: '' });
                } else {
                  setExpanded(new Set(visible.map((a) => annotationAnchor(a.name))));
                }
              }}
              className="hover:text-[color:var(--sf-text)]"
            >
              {allExpanded ? 'Collapse all' : 'Expand all'}
            </button>
          )}
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="rounded-[var(--radius-token)] border border-dashed px-4 py-8 text-center text-[color:var(--sf-text-muted)]">
          Nothing matches “{query}”.
        </p>
      ) : (
        groups.map((g) => (
          <section key={g.id} className="mb-8" aria-labelledby={`cat-${g.id}`}>
            <h2
              id={`cat-${g.id}`}
              className="mb-3 text-[0.72rem] font-semibold tracking-[0.1em] text-[color:var(--sf-text-faint)] uppercase"
            >
              {g.label}
            </h2>
            <div className="grid gap-2.5">
              {g.items.map((entry) => {
                const anchor = annotationAnchor(entry.name);
                return (
                  <AnnotationCard
                    key={entry.name}
                    entry={entry}
                    categoryLabel={labelOf.get(entry.category) ?? entry.category}
                    expanded={isOpen(anchor)}
                    focused={focus === anchor}
                    onToggle={() => toggle(anchor)}
                    onFocusRelated={focusOn}
                  />
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
