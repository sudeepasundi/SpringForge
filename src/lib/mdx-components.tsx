import { useEffect, useRef, useState, type ComponentPropsWithoutRef } from 'react';
import type { MDXComponents } from 'mdx/types';
import { Check, Copy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Callout } from '@/components/mdx/Callout';
import { Mermaid } from '@/components/mdx/Mermaid';
import { Quiz } from '@/components/mdx/Quiz';
import { CodeExplorer } from '@/components/mdx/CodeExplorer';
import { CodeSurface } from '@/components/mdx/CodeSurface';
import {
  Bad,
  Compare,
  Good,
  DecisionTable,
  Figure,
  KeyTakeaways,
  Step,
  Steps,
  Terminal,
} from '@/components/mdx/Blocks';

/**
 * Fenced code blocks are highlighted at build time, so all this adds is the
 * copy affordance. Reading the text straight off the rendered node keeps the
 * source out of the bundle a second time.
 */
function Pre(props: ComponentPropsWithoutRef<'pre'>) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div className="group relative">
      <button
        type="button"
        aria-label={copied ? 'Copied' : 'Copy code'}
        onClick={() => {
          const text = ref.current?.innerText ?? '';
          void navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => setCopied(false), 1600);
          });
        }}
        className="absolute top-2 right-2 z-10 rounded-md border bg-[color:var(--sf-surface-2)] p-1.5 text-[color:var(--sf-text-muted)] opacity-0 transition group-hover:opacity-100 hover:text-[color:var(--sf-text)] focus-visible:opacity-100"
      >
        {copied ? <Check size={13} strokeWidth={2.6} /> : <Copy size={13} />}
      </button>
      <pre ref={ref} {...props} />
    </div>
  );
}

/**
 * External links open safely in a new tab; in-page anchors scroll without
 * touching `location` (the app uses hash routing, so the hash is the route);
 * everything else goes through the router.
 */
function Anchor({ href = '', ...rest }: ComponentPropsWithoutRef<'a'>) {
  if (/^https?:\/\//.test(href)) {
    return <a href={href} target="_blank" rel="noreferrer noopener" {...rest} />;
  }
  if (href.startsWith('#')) {
    return (
      <a
        href={href}
        onClick={(e) => {
          e.preventDefault();
          document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth' });
        }}
        {...rest}
      />
    );
  }
  return <Link to={href} {...rest} />;
}

export const mdxComponents: MDXComponents = {
  a: Anchor,
  pre: Pre,
  Callout,
  Mermaid,
  Quiz,
  CodeExplorer,
  CodeSurface,
  Bad,
  Compare,
  Good,
  DecisionTable,
  Figure,
  KeyTakeaways,
  Step,
  Steps,
  Terminal,
};
