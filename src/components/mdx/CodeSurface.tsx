import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { highlight } from '@/lib/highlighter';
import { cn } from '@/lib/cn';

export function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <button
      type="button"
      aria-label={copied ? 'Copied' : 'Copy code'}
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => setCopied(false), 1600);
        });
      }}
      className={cn(
        'rounded-md border bg-[color:var(--sf-surface-2)] p-1.5 text-[color:var(--sf-text-muted)] transition hover:text-[color:var(--sf-text)]',
        className,
      )}
    >
      {copied ? <Check size={13} strokeWidth={2.6} /> : <Copy size={13} />}
    </button>
  );
}

/** Parses "3-7, 12" into a Set of 1-based line numbers. */
export function parseLineRanges(spec: string | undefined): Set<number> {
  const out = new Set<number>();
  if (!spec) return out;
  for (const chunk of spec.split(',')) {
    const [a, b] = chunk.trim().split('-').map(Number);
    if (!a || Number.isNaN(a)) continue;
    const end = b && !Number.isNaN(b) ? b : a;
    for (let i = a; i <= end; i++) out.add(i);
  }
  return out;
}

/** The nearest ancestor that actually scrolls vertically, if there is one. */
function verticalScroller(el: HTMLElement): HTMLElement | null {
  let node = el.parentElement;
  while (node) {
    const overflowY = getComputedStyle(node).overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

/**
 * Brings a line into view by scrolling its own container, never the page.
 *
 * `scrollIntoView` would do both: it scrolls every scrollable ancestor, so
 * clicking an annotation yanks the article as well as the code pane. It also
 * stops as soon as the *first* line is at an edge, leaving the rest of a
 * multi-line range clipped — hence positioning a third of the way down instead.
 */
function revealInScroller(line: HTMLElement): void {
  const scroller = verticalScroller(line);
  if (!scroller) return;
  const delta = line.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
  scroller.scrollTo({
    top: scroller.scrollTop + delta - scroller.clientHeight / 3,
    behavior: 'smooth',
  });
}

interface CodeSurfaceProps {
  code: string;
  lang: string;
  /** e.g. "12-18, 24" — highlighted with the accent gutter. */
  highlightLines?: string;
  showLineNumbers?: boolean;
  className?: string;
  /** Scrolls the first highlighted line into view when it changes. */
  scrollToHighlight?: boolean;
}

/**
 * Syntax-highlighted code with optional line emphasis.
 * Highlighting happens off the main render path; until it resolves we show the
 * raw text at the same metrics so there is no layout shift.
 */
export function CodeSurface({
  code,
  lang,
  highlightLines,
  showLineNumbers = true,
  className,
  scrollToHighlight = false,
}: CodeSurfaceProps) {
  const [html, setHtml] = useState<string | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    void highlight(code, lang).then((out) => {
      if (alive) setHtml(out);
    });
    return () => {
      alive = false;
    };
  }, [code, lang]);

  // Line emphasis is applied post-render so the highlighter cache stays keyed
  // on (code, lang) alone and switching annotations costs nothing.
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !html) return;
    const wanted = parseLineRanges(highlightLines);
    const lines = host.querySelectorAll<HTMLElement>('[data-line]');
    let first: HTMLElement | null = null;
    lines.forEach((el, i) => {
      const on = wanted.has(i + 1);
      el.toggleAttribute('data-highlighted-line', on);
      if (on && !first) first = el;
    });
    if (scrollToHighlight && first) {
      revealInScroller(first);
    }
  }, [html, highlightLines, scrollToHighlight]);

  return (
    <div
      ref={hostRef}
      data-rehype-pretty-code-figure=""
      className={cn(
        'overflow-x-auto text-[0.845rem] leading-[1.66]',
        showLineNumbers && '[&_code]:[counter-reset:line]',
        className,
      )}
    >
      {html ? (
        <div
          className={cn('[&_pre]:m-0 [&_pre]:bg-transparent! [&_pre]:px-0 [&_pre]:py-3.5')}
          dangerouslySetInnerHTML={{
            __html: showLineNumbers
              ? html.replace(/<code(?=[\s>])/, '<code data-line-numbers')
              : html,
          }}
        />
      ) : (
        <pre className="m-0 px-4 py-3.5 font-[family-name:var(--font-mono)] text-[color:var(--sf-text-muted)]">
          <code>{code.replace(/\s+$/, '')}</code>
        </pre>
      )}
    </div>
  );
}
