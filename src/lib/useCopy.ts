import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Copy-to-clipboard with the two failure modes that actually happen.
 *
 * `navigator.clipboard` is undefined outside a secure context — which includes
 * opening `dist/index.html` straight from disk, something the README explicitly
 * supports — and even where it exists the promise rejects when the document is
 * not focused or permission is denied. Neither may throw out of a click handler:
 * the code is still selectable, so a silent no-op is the right degradation.
 */
export function useCopy(resetAfterMs = 1600): { copied: boolean; copy: (text: string) => void } {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = useCallback(
    (text: string) => {
      const confirm = () => {
        setCopied(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(false), resetAfterMs);
      };

      try {
        // Optional chaining covers the missing-API case; the try covers
        // implementations that throw synchronously in an insecure context.
        const write = navigator.clipboard?.writeText(text);
        if (!write) return;
        void write.then(confirm, () => {
          /* denied or unfocused — leave the button unchanged */
        });
      } catch {
        /* no clipboard available; the text remains selectable */
      }
    },
    [resetAfterMs],
  );

  return { copied, copy };
}
