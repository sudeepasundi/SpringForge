import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { BookOpen, CornerDownLeft, LayoutDashboard, Route, Search, Boxes } from 'lucide-react';
import { search as runSearch } from '@/lib/search';
import { flatLessons } from '@/content/curriculum';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = [
  { label: 'Learning path', to: '/path', icon: Route },
  { label: 'Your dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Demo projects', to: '/demos', icon: Boxes },
];

export function CommandPalette({ open, onOpenChange }: Props) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  // Clearing here rather than in an effect means the palette never renders
  // once with a stale query before the reset lands.
  const setOpen = (next: boolean) => {
    if (!next) setQuery('');
    onOpenChange(next);
  };

  const hits = useMemo(() => runSearch(query, 14), [query]);

  // With no query, offer a sensible starting set rather than an empty box.
  const browse = useMemo(() => flatLessons.slice(0, 6), []);

  function go(to: string) {
    setOpen(false);
    navigate(to);
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Search lessons"
      shouldFilter={false}
      className="fixed inset-0 z-50"
    >
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <div className="relative mx-auto mt-[12vh] w-[min(42rem,92vw)] overflow-hidden rounded-xl border bg-[color:var(--sf-surface)] shadow-2xl">
        <div className="flex items-center gap-2.5 border-b px-4">
          <Search size={16} className="shrink-0 text-[color:var(--sf-text-faint)]" />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            autoFocus
            placeholder="Search lessons, concepts, annotations…"
            className="w-full bg-transparent py-3.5 text-[0.95rem] outline-none placeholder:text-[color:var(--sf-text-faint)]"
          />
          <kbd className="hidden shrink-0 rounded border px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[0.65rem] text-[color:var(--sf-text-faint)] sm:block">
            esc
          </kbd>
        </div>

        <Command.List className="max-h-[min(24rem,60vh)] overflow-y-auto p-2">
          <Command.Empty className="px-3 py-8 text-center text-[0.85rem] text-[color:var(--sf-text-faint)]">
            Nothing matched “{query}”.
          </Command.Empty>

          {query.length < 2 && (
            <>
              <Command.Group
                heading="Jump to"
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-[0.65rem] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-[0.1em] [&_[cmdk-group-heading]]:text-[color:var(--sf-text-faint)] [&_[cmdk-group-heading]]:uppercase"
              >
                {shortcuts.map((s) => (
                  <Command.Item
                    key={s.to}
                    value={s.label}
                    onSelect={() => go(s.to)}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.88rem] data-[selected=true]:bg-[color:var(--sf-accent-soft)]"
                  >
                    <s.icon size={15} className="text-[color:var(--sf-text-faint)]" />
                    {s.label}
                  </Command.Item>
                ))}
              </Command.Group>

              <Command.Group
                heading="Start here"
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-[0.65rem] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-[0.1em] [&_[cmdk-group-heading]]:text-[color:var(--sf-text-faint)] [&_[cmdk-group-heading]]:uppercase"
              >
                {browse.map((ref) => (
                  <Command.Item
                    key={ref.path}
                    value={ref.path}
                    onSelect={() => go(`/learn/${ref.path}`)}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.88rem] data-[selected=true]:bg-[color:var(--sf-accent-soft)]"
                  >
                    <BookOpen size={15} className="shrink-0 text-[color:var(--sf-text-faint)]" />
                    <span className="truncate">{ref.lesson.title}</span>
                    <span className="ml-auto shrink-0 text-[0.7rem] text-[color:var(--sf-text-faint)]">
                      {ref.module.title}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            </>
          )}

          {hits.map((hit) => (
            <Command.Item
              key={hit.path}
              value={hit.path}
              onSelect={() => go(`/learn/${hit.path}`)}
              className="group flex cursor-pointer flex-col gap-1 rounded-lg px-2.5 py-2.5 data-[selected=true]:bg-[color:var(--sf-accent-soft)]"
            >
              <span className="flex items-center gap-2">
                <BookOpen size={14} className="shrink-0 text-[color:var(--sf-text-faint)]" />
                <span className="truncate text-[0.9rem] font-medium">{hit.title}</span>
                <span className="ml-auto shrink-0 text-[0.68rem] text-[color:var(--sf-text-faint)]">
                  {hit.moduleTitle}
                </span>
                <CornerDownLeft
                  size={12}
                  className="shrink-0 text-[color:var(--sf-text-faint)] opacity-0 group-data-[selected=true]:opacity-100"
                />
              </span>
              <span className="line-clamp-2 pl-6 text-[0.78rem] leading-snug text-[color:var(--sf-text-muted)]">
                {hit.excerpt || hit.summary}
              </span>
            </Command.Item>
          ))}
        </Command.List>
      </div>
    </Command.Dialog>
  );
}

/** Registers the ⌘K / Ctrl-K shortcut and the "/" quick-open. */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable === true;

      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === '/' && !typing && !open) {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return { open, setOpen };
}
