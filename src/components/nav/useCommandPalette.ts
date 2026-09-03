import { useEffect, useState } from 'react';

/**
 * Owns the ⌘K / Ctrl-K and `/` shortcuts.
 *
 * Deliberately in its own module: `AppShell` needs the hook on every page, but
 * the palette itself — and with it MiniSearch and the full-text index for every
 * lesson — should not be in the entry chunk. Keeping the hook separate lets the
 * component be lazy-loaded.
 */
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
