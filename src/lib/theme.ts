import { useEffect } from 'react';
import { useProgress, type ThemePref } from '@/store/progress';

const MEDIA = '(prefers-color-scheme: dark)';

export function resolveTheme(pref: ThemePref): 'light' | 'dark' {
  if (pref !== 'system') return pref;
  return window.matchMedia(MEDIA).matches ? 'dark' : 'light';
}

function apply(pref: ThemePref): void {
  document.documentElement.classList.toggle('dark', resolveTheme(pref) === 'dark');
}

/**
 * Keeps the `dark` class on <html> in sync with the stored preference.
 * `index.html` applies the same rule before first paint; this hook owns it
 * from hydration onwards and follows the OS when the preference is "system".
 */
export function useThemeSync(): void {
  const theme = useProgress((s) => s.theme);

  useEffect(() => {
    apply(theme);
    if (theme !== 'system') return;
    const mql = window.matchMedia(MEDIA);
    const onChange = () => apply('system');
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [theme]);
}

/** Cycles light → dark → system, which is the order users expect from a single button. */
export function nextTheme(pref: ThemePref): ThemePref {
  return pref === 'light' ? 'dark' : pref === 'dark' ? 'system' : 'light';
}
