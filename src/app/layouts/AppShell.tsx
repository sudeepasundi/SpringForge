import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, Monitor, Moon, Search, Sun, X } from 'lucide-react';
import { Sidebar } from '@/components/nav/Sidebar';
import { CommandPalette, useCommandPalette } from '@/components/nav/CommandPalette';
import { useProgress } from '@/store/progress';
import { nextTheme } from '@/lib/theme';
import { totalLessons } from '@/content/curriculum';
import { cn } from '@/lib/cn';

const themeIcon = { light: Sun, dark: Moon, system: Monitor } as const;

function Logo() {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="SpringForge home">
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
        <rect width="32" height="32" rx="8" fill="var(--sf-accent)" />
        <path
          d="M9 22c6 2 11-1 12-6 .6-3-1-6-3-8 .4 2 .2 3.6-.8 5-.7-3-2.6-5-5.2-6 .8 2.2.4 4-1.2 6.2C9.4 15 8.4 17 9 22z"
          fill="#fff"
        />
      </svg>
      <span className="text-[0.98rem] leading-none font-semibold tracking-[-0.015em]">
        Spring<span className="text-[color:var(--sf-accent)]">Forge</span>
      </span>
    </Link>
  );
}

export function AppShell() {
  const location = useLocation();
  const { open, setOpen } = useCommandPalette();
  const [drawer, setDrawer] = useState(false);

  const theme = useProgress((s) => s.theme);
  const setTheme = useProgress((s) => s.setTheme);
  const completedCount = useProgress((s) => s.completed.length);

  const ThemeIcon = themeIcon[theme];
  const inCourse = location.pathname.startsWith('/learn');

  // Scrolling the window is a DOM side effect, so it belongs here. Closing the
  // drawer does not — it happens at the click that navigates, below.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawer]);

  const navLink = ({ isActive }: { isActive: boolean }) =>
    cn(
      'rounded-md px-2.5 py-1.5 text-[0.85rem] transition',
      isActive
        ? 'bg-[color:var(--sf-surface-2)] font-medium text-[color:var(--sf-text)]'
        : 'text-[color:var(--sf-text-muted)] hover:text-[color:var(--sf-text)]',
    );

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-[color:var(--sf-accent)] focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      <header
        className="sticky top-0 z-30 border-b bg-[color:var(--sf-bg)]/85 backdrop-blur-md"
        style={{ height: 'var(--sf-header-h)' }}
      >
        <div className="mx-auto flex h-full max-w-[110rem] items-center gap-3 px-4 sm:px-5">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setDrawer(true)}
            className="-ml-1 rounded-md p-1.5 text-[color:var(--sf-text-muted)] hover:bg-[color:var(--sf-surface-2)] lg:hidden"
          >
            <Menu size={18} />
          </button>

          <Logo />

          <nav className="ml-3 hidden items-center gap-0.5 md:flex" aria-label="Primary">
            <NavLink to="/path" className={navLink}>
              Path
            </NavLink>
            <NavLink to="/demos" className={navLink}>
              Demos
            </NavLink>
            <NavLink to="/dashboard" className={navLink}>
              Dashboard
            </NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 rounded-lg border bg-[color:var(--sf-surface)] py-1.5 pr-1.5 pl-2.5 text-[0.82rem] text-[color:var(--sf-text-faint)] transition hover:border-[color:var(--sf-border-strong)] hover:text-[color:var(--sf-text-muted)]"
            >
              <Search size={14} />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden rounded border px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[0.65rem] sm:block">
                ⌘K
              </kbd>
            </button>

            <span className="hidden rounded-lg border px-2.5 py-1.5 text-[0.75rem] tabular-nums text-[color:var(--sf-text-muted)] sm:block">
              <span className="font-semibold text-[color:var(--sf-accent-text)]">
                {completedCount}
              </span>
              <span className="text-[color:var(--sf-text-faint)]">/{totalLessons}</span>
            </span>

            <button
              type="button"
              onClick={() => setTheme(nextTheme(theme))}
              aria-label={`Theme: ${theme}. Click to change.`}
              title={`Theme: ${theme}`}
              className="rounded-lg border p-2 text-[color:var(--sf-text-muted)] transition hover:text-[color:var(--sf-text)]"
            >
              <ThemeIcon size={15} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[110rem]">
        {/* Desktop sidebar */}
        <aside
          className={cn(
            'sticky hidden shrink-0 overflow-y-auto border-r px-3 py-4 lg:block',
            !inCourse && 'lg:hidden',
          )}
          style={{
            width: 'var(--sf-sidebar-w)',
            top: 'var(--sf-header-h)',
            height: 'calc(100vh - var(--sf-header-h))',
          }}
        >
          <Sidebar />
        </aside>

        {/* Mobile drawer */}
        {drawer && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setDrawer(false)}
              aria-hidden
            />
            <div className="absolute inset-y-0 left-0 flex w-[min(20rem,86vw)] flex-col border-r bg-[color:var(--sf-bg)]">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <Logo />
                <button
                  type="button"
                  aria-label="Close navigation"
                  onClick={() => setDrawer(false)}
                  className="rounded-md p-1.5 text-[color:var(--sf-text-muted)]"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-3">
                <nav
                  className="mb-3 flex flex-col gap-0.5 border-b pb-3"
                  aria-label="Primary"
                  onClick={() => setDrawer(false)}
                >
                  <NavLink to="/path" className={navLink}>
                    Path
                  </NavLink>
                  <NavLink to="/demos" className={navLink}>
                    Demos
                  </NavLink>
                  <NavLink to="/dashboard" className={navLink}>
                    Dashboard
                  </NavLink>
                </nav>
                <Sidebar onNavigate={() => setDrawer(false)} />
              </div>
            </div>
          </div>
        )}

        <main id="main" className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={open} onOpenChange={setOpen} />
    </div>
  );
}
