import { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Check, ChevronRight, Circle } from 'lucide-react';
import { modules, trackOrder, tracks } from '@/content/curriculum';
import { useProgress, completionOf } from '@/store/progress';
import { prefetchLesson } from '@/lib/lessons';
import { cn } from '@/lib/cn';
import type { Module } from '@/lib/types';

function ModuleGroup({
  module,
  completed,
  openByDefault,
}: {
  module: Module;
  completed: string[];
  openByDefault: boolean;
}) {
  const [open, setOpen] = useState(openByDefault);
  const [wasDefaultOpen, setWasDefaultOpen] = useState(openByDefault);

  // Navigating into a module expands it, but a manual collapse still sticks.
  // Adjusting during render is React's documented alternative to a setState
  // effect, and avoids a frame with the wrong group open.
  if (openByDefault !== wasDefaultOpen) {
    setWasDefaultOpen(openByDefault);
    if (openByDefault) setOpen(true);
  }

  const paths = module.lessons.map((l) => `${module.slug}/${l.slug}`);
  const done = completionOf(completed, paths);
  const doneCount = Math.round(done * paths.length);

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-[color:var(--sf-surface-2)]"
      >
        <ChevronRight
          size={14}
          className={cn(
            'shrink-0 text-[color:var(--sf-text-faint)] transition-transform',
            open && 'rotate-90',
          )}
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-1.5">
            <span className="font-[family-name:var(--font-mono)] text-[0.68rem] text-[color:var(--sf-text-faint)]">
              {module.id}
            </span>
            <span className="truncate text-[0.85rem] font-medium">{module.title}</span>
          </span>
          <span className="mt-1 flex items-center gap-2">
            <span className="h-1 flex-1 overflow-hidden rounded-full bg-[color:var(--sf-surface-2)]">
              <span
                className="block h-full rounded-full bg-[color:var(--sf-accent)] transition-[width]"
                style={{ width: `${done * 100}%` }}
              />
            </span>
            <span className="text-[0.65rem] tabular-nums text-[color:var(--sf-text-faint)]">
              {doneCount}/{paths.length}
            </span>
          </span>
        </span>
      </button>

      {open && (
        <ul className="mt-0.5 mb-1 ml-[1.35rem] list-none border-l pl-2">
          {module.lessons.map((lesson) => {
            const path = `${module.slug}/${lesson.slug}`;
            const isDone = completed.includes(path);
            return (
              <li key={lesson.slug}>
                <NavLink
                  to={`/learn/${path}`}
                  onMouseEnter={() => prefetchLesson(module, lesson.slug)}
                  onFocus={() => prefetchLesson(module, lesson.slug)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-start gap-2 rounded-md py-1.5 pr-2 pl-2 text-[0.8rem] leading-snug transition',
                      isActive
                        ? 'bg-[color:var(--sf-accent-soft)] font-medium text-[color:var(--sf-accent-text)]'
                        : 'text-[color:var(--sf-text-muted)] hover:bg-[color:var(--sf-surface-2)] hover:text-[color:var(--sf-text)]',
                    )
                  }
                >
                  {isDone ? (
                    <Check
                      size={12}
                      strokeWidth={3}
                      className="mt-[0.28em] shrink-0 text-[color:var(--sf-accent)]"
                    />
                  ) : (
                    <Circle size={12} className="mt-[0.28em] shrink-0 opacity-35" />
                  )}
                  <span>{lesson.title}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const completed = useProgress((s) => s.completed);
  const location = useLocation();
  const activeModule = location.pathname.split('/')[2];

  const grouped = useMemo(
    () =>
      trackOrder.map((track) => ({
        track,
        items: modules.filter((m) => m.track === track),
      })),
    [],
  );

  return (
    <nav aria-label="Curriculum" className="pb-16" onClick={onNavigate}>
      {grouped.map(({ track, items }) => (
        <section key={track} className="mb-4">
          <h2 className="px-2 pt-3 pb-1.5 text-[0.64rem] font-semibold tracking-[0.12em] text-[color:var(--sf-text-faint)] uppercase">
            {tracks[track].label}
          </h2>
          <ul className="m-0 list-none p-0">
            {items.map((module) => (
              <ModuleGroup
                key={module.slug}
                module={module}
                completed={completed}
                openByDefault={module.slug === activeModule}
              />
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}
