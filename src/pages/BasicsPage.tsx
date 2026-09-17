import { Link } from 'react-router-dom';
import { ArrowRight, AtSign, Clock, Layers } from 'lucide-react';
import {
  annotationAnchor,
  annotationCategories,
  annotations,
  basicsGuides,
} from '@/content/basics';
import { prefetchGuide } from '@/lib/basics';

/** The annotations people look up most — a shortcut row on the hub. */
const QUICK = [
  'Autowired',
  'Qualifier',
  'Transactional',
  'Configuration',
  'Bean',
  'Value',
  'ConfigurationProperties',
  'RestController',
  'Valid',
  'Async',
  'Cacheable',
  'SpringBootTest',
];

export default function BasicsPage() {
  return (
    <div className="mx-auto max-w-[62rem] px-5 py-10 sm:px-8">
      <header className="mb-8">
        <h1 className="flex items-center gap-2.5 text-[2rem] font-semibold tracking-[-0.025em]">
          <Layers size={26} className="text-[color:var(--sf-accent)]" />
          Basics
        </h1>
        <p className="mt-2.5 mb-0 max-w-[64ch] text-[0.98rem] leading-relaxed text-[color:var(--sf-text-muted)]">
          Quick, in-depth revision. Every common annotation in one searchable place, and short guides
          to the parts of Spring that trip people up most. Each entry links back to the lesson that
          explains it properly.
        </p>
      </header>

      <Link
        to="/basics/annotations"
        className="group block rounded-[var(--radius-token)] border bg-[color:var(--sf-surface)] p-5 transition hover:border-[color:var(--sf-accent)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="m-0 flex items-center gap-2 text-[1.25rem] font-semibold">
              <AtSign size={18} className="text-[color:var(--sf-accent)]" />
              Annotation reference
            </h2>
            <p className="mt-1.5 mb-0 max-w-[60ch] text-[0.92rem] leading-relaxed text-[color:var(--sf-text-muted)]">
              {annotations.length} annotations across {annotationCategories.length} categories — what
              each does at runtime, when to use it, and the mistake it is usually involved in.
            </p>
          </div>
          <ArrowRight
            size={18}
            className="mt-1 shrink-0 text-[color:var(--sf-text-faint)] transition group-hover:translate-x-0.5 group-hover:text-[color:var(--sf-accent)]"
          />
        </div>
        <ul className="mt-4 mb-0 flex list-none flex-wrap gap-1.5 p-0">
          {annotationCategories.map((c) => (
            <li
              key={c.id}
              className="rounded-full border px-2.5 py-1 text-[0.72rem] text-[color:var(--sf-text-muted)]"
            >
              {c.label}
            </li>
          ))}
        </ul>
      </Link>

      <section className="mt-5" aria-labelledby="quick">
        <h2
          id="quick"
          className="mb-2 text-[0.72rem] font-semibold tracking-[0.1em] text-[color:var(--sf-text-faint)] uppercase"
        >
          Jump straight to
        </h2>
        <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          {QUICK.map((name) => (
            <li key={name}>
              <Link
                to={`/basics/annotations?a=${annotationAnchor(name)}`}
                className="inline-block rounded-md border bg-[color:var(--sf-surface)] px-2.5 py-1 font-[family-name:var(--font-mono)] text-[0.8rem] text-[color:var(--sf-text-muted)] transition hover:border-[color:var(--sf-accent)] hover:text-[color:var(--sf-text)]"
              >
                @{name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-9" aria-labelledby="guides">
        <h2
          id="guides"
          className="mb-3 text-[0.72rem] font-semibold tracking-[0.1em] text-[color:var(--sf-text-faint)] uppercase"
        >
          Revision guides
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {basicsGuides.map((g) => (
            <Link
              key={g.slug}
              to={`/basics/${g.slug}`}
              onMouseEnter={() => prefetchGuide(g.slug)}
              onFocus={() => prefetchGuide(g.slug)}
              className="group flex flex-col rounded-[var(--radius-token)] border bg-[color:var(--sf-surface)] p-4 transition hover:border-[color:var(--sf-accent)]"
            >
              <h3 className="m-0 text-[1.02rem] font-semibold">{g.title}</h3>
              <p className="mt-1.5 mb-0 flex-1 text-[0.86rem] leading-relaxed text-[color:var(--sf-text-muted)]">
                {g.summary}
              </p>
              <span className="mt-3 flex items-center gap-1.5 text-[0.74rem] text-[color:var(--sf-text-faint)]">
                <Clock size={12} /> {g.minutes} min
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
