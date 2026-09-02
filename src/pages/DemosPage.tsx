import { useState } from 'react';
import { Boxes } from 'lucide-react';
import { demos } from '@/content/demos';
import { CodeExplorer } from '@/components/mdx/CodeExplorer';
import { cn } from '@/lib/cn';

export default function DemosPage() {
  const [activeId, setActiveId] = useState(demos[0]?.id ?? '');
  const demo = demos.find((d) => d.id === activeId) ?? demos[0];

  return (
    <div className="mx-auto max-w-[76rem] px-5 py-10 sm:px-8">
      <header className="mb-8">
        <h1 className="flex items-center gap-2.5 text-[2rem] font-semibold tracking-[-0.025em]">
          <Boxes size={26} className="text-[color:var(--sf-accent)]" />
          Demo projects
        </h1>
        <p className="mt-2.5 mb-0 max-w-[64ch] text-[0.98rem] leading-relaxed text-[color:var(--sf-text-muted)]">
          Real, compilable source you can read end to end. Nothing runs in the browser — a JVM does
          not fit in one — so copy any file into an IDE and it will build. The lessons link
          straight to the files they discuss.
        </p>
      </header>

      {demos.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {demos.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setActiveId(d.id)}
              className={cn(
                'rounded-lg border px-3.5 py-2 text-[0.86rem] transition',
                d.id === demo?.id
                  ? 'border-[color:var(--sf-accent)] bg-[color:var(--sf-accent-soft)] font-medium text-[color:var(--sf-accent-text)]'
                  : 'text-[color:var(--sf-text-muted)] hover:border-[color:var(--sf-border-strong)]',
              )}
            >
              {d.name}
            </button>
          ))}
        </div>
      )}

      {demo && (
        <>
          <section className="rounded-[var(--radius-token)] border bg-[color:var(--sf-surface)] p-5">
            <h2 className="m-0 text-[1.25rem] font-semibold">{demo.name}</h2>
            <p className="mt-0.5 mb-0 text-[0.85rem] text-[color:var(--sf-text-faint)]">
              {demo.tagline}
            </p>
            <p className="mt-3 mb-0 max-w-[68ch] text-[0.92rem] leading-relaxed text-[color:var(--sf-text-muted)]">
              {demo.description}
            </p>
            <ul className="mt-4 mb-0 flex list-none flex-wrap gap-1.5 p-0">
              {demo.stack.map((s) => (
                <li
                  key={s}
                  className="rounded-full border px-2.5 py-1 text-[0.72rem] text-[color:var(--sf-text-muted)]"
                >
                  {s}
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-5">
            <CodeExplorer files={demo.files} title={`${demo.name} — source`} height={620} />
          </div>
        </>
      )}
    </div>
  );
}
