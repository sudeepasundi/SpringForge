import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MessageCircleQuestion, Search, X } from 'lucide-react';
import { QuestionCard } from '@/components/qa/QuestionCard';
import { questionDifficulties, type QaQuestion, type QuestionSet } from '@/content/qa/types';
import { cn } from '@/lib/cn';

function matches(q: QaQuestion, text: string): boolean {
  if (!text) return true;
  const needle = text.toLowerCase();
  return [q.question, q.answer, ...(q.points ?? [])].join(' ').toLowerCase().includes(needle);
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-full border px-2.5 py-1 text-[0.76rem] transition',
        active
          ? 'border-[color:var(--sf-accent)] bg-[color:var(--sf-accent-soft)] font-medium text-[color:var(--sf-accent-text)]'
          : 'text-[color:var(--sf-text-muted)] hover:border-[color:var(--sf-border-strong)]',
      )}
    >
      {children}
    </button>
  );
}

/**
 * Interview-style revision. Filters live in the URL (?s=&topic=&level=) so a
 * filtered view can be shared; ?q=<id> opens and scrolls to one question.
 */
export function RevisionPage({ set }: { set: QuestionSet }) {
  const { book, topics: questionTopics, questions } = set;
  const topicLabel = useMemo(
    () => new Map<string, string>(questionTopics.map((t) => [t.id, t.label])),
    [questionTopics],
  );
  const chapterTitle = useMemo(
    () => new Map(book.chapters.map((c) => [c.slug, c.title])),
    [book],
  );
  const [params, setParams] = useSearchParams();
  const text = params.get('s') ?? '';
  const topic = params.get('topic') ?? '';
  const level = params.get('level') ?? '';
  const focus = params.get('q') ?? '';

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const visible = useMemo(
    () =>
      questions.filter(
        (q) =>
          (!topic || q.topic === topic) && (!level || q.difficulty === level) && matches(q, text),
      ),
    [questions, text, topic, level],
  );

  const topicCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const q of questions) {
      if ((!level || q.difficulty === level) && matches(q, text)) {
        counts.set(q.topic, (counts.get(q.topic) ?? 0) + 1);
      }
    }
    return counts;
  }, [questions, text, level]);

  // Deferred to a macrotask: the app shell scrolls to the top after
  // navigation, and a rAF never fires in a background tab. Same as the
  // annotation reference.
  useEffect(() => {
    if (!focus) return;
    const timer = window.setTimeout(() => {
      document
        .getElementById(`question-${focus}`)
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

  const isOpen = (id: string) => expanded.has(id) || focus === id;

  const toggle = (id: string) => {
    if (focus === id) {
      setExpanded((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
      update({ q: '' });
      return;
    }
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allExpanded = visible.length > 0 && visible.every((q) => isOpen(q.id));

  const groups = questionTopics
    .map((t) => ({ ...t, items: visible.filter((q) => q.topic === t.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-[62rem] px-5 py-10 sm:px-8">
      <nav
        className="mb-4 flex items-center gap-1.5 text-[0.78rem] text-[color:var(--sf-text-faint)]"
        aria-label="Breadcrumb"
      >
        <Link to={book.basePath} className="hover:text-[color:var(--sf-text)]">
          {book.title}
        </Link>
        <span>/</span>
        <span>Interview Q&amp;A</span>
      </nav>

      <header className="mb-6">
        <h1 className="flex items-center gap-2.5 text-[2rem] font-semibold tracking-[-0.025em]">
          <MessageCircleQuestion size={26} className="shrink-0 text-[color:var(--sf-accent)]" />
          {book.title} interview Q&amp;A
        </h1>
        <p className="mt-2.5 mb-0 max-w-[64ch] text-[0.98rem] leading-relaxed text-[color:var(--sf-text-muted)]">
          {questions.length} questions. {set.intro} Try answering before you open a card.
        </p>
      </header>

      <div className="sticky top-[var(--sf-header-h)] z-10 -mx-2 mb-5 bg-[color:var(--sf-bg)]/90 px-2 py-3 backdrop-blur-md">
        <label className="relative block">
          <span className="sr-only">Filter questions</span>
          <Search
            size={15}
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[color:var(--sf-text-faint)]"
          />
          <input
            type="search"
            value={text}
            onChange={(e) => update({ s: e.target.value, q: '' })}
            placeholder={set.placeholder}
            className="w-full rounded-lg border bg-[color:var(--sf-surface)] py-2.5 pr-9 pl-9 text-[0.92rem] outline-none focus:border-[color:var(--sf-accent)]"
          />
          {text && (
            <button
              type="button"
              aria-label="Clear filter"
              onClick={() => update({ s: '' })}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-[color:var(--sf-text-faint)] hover:text-[color:var(--sf-text)]"
            >
              <X size={14} />
            </button>
          )}
        </label>

        <div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label="Topic">
          <Chip active={!topic} onClick={() => update({ topic: '', q: '' })}>
            All
          </Chip>
          {questionTopics.map((t) => (
            <Chip
              key={t.id}
              active={topic === t.id}
              onClick={() => update({ topic: topic === t.id ? '' : t.id, q: '' })}
            >
              {t.label}
              <span className="ml-1 text-[color:var(--sf-text-faint)]">{topicCounts.get(t.id) ?? 0}</span>
            </Chip>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5" role="group" aria-label="Difficulty">
          <span className="mr-1 text-[0.72rem] text-[color:var(--sf-text-faint)]">Difficulty</span>
          {questionDifficulties.map((d) => (
            <Chip
              key={d.id}
              active={level === d.id}
              onClick={() => update({ level: level === d.id ? '' : d.id, q: '' })}
            >
              {d.label}
            </Chip>
          ))}
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[0.76rem] text-[color:var(--sf-text-faint)]">
          <span aria-live="polite">
            {visible.length} of {questions.length} shown
          </span>
          {visible.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (allExpanded) {
                  setExpanded(new Set());
                  update({ q: '' });
                } else {
                  setExpanded(new Set(visible.map((q) => q.id)));
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
          No question matches those filters.
        </p>
      ) : (
        groups.map((g) => (
          <section key={g.id} className="mb-8" aria-labelledby={`topic-${g.id}`}>
            <h2
              id={`topic-${g.id}`}
              className="mb-3 text-[0.72rem] font-semibold tracking-[0.1em] text-[color:var(--sf-text-faint)] uppercase"
            >
              {g.label}
            </h2>
            <div className="grid gap-2.5">
              {g.items.map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  topicLabel={topicLabel.get(q.topic) ?? q.topic}
                  chapterTitle={chapterTitle.get(q.chapter) ?? q.chapter}
                  chapterHref={`${book.basePath}/${q.chapter}`}
                  expanded={isOpen(q.id)}
                  focused={focus === q.id}
                  onToggle={() => toggle(q.id)}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
