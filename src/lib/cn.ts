/** Tiny class-name joiner. No dependency needed for what we do here. */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
