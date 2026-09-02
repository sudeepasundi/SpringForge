import { useEffect, useState, type RefObject } from 'react';
import { cn } from '@/lib/cn';

interface Heading {
  id: string;
  text: string;
  level: number;
}

/**
 * Built from the rendered DOM rather than parsed from MDX, so it stays correct
 * no matter which components a lesson uses to emit headings.
 */
export function TableOfContents({
  containerRef,
  contentKey,
}: {
  containerRef: RefObject<HTMLElement | null>;
  /** Changing this re-scans — pass the lesson path. */
  contentKey: string;
}) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [active, setActive] = useState<string>('');

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    // MDX chunks stream in, so wait for the subtree to settle before scanning.
    const scan = () => {
      const found = [...root.querySelectorAll<HTMLElement>('h2[id], h3[id]')].map((el) => ({
        id: el.id,
        text: el.textContent?.replace(/#$/, '').trim() ?? '',
        level: Number(el.tagName[1]),
      }));
      setHeadings((prev) =>
        prev.length === found.length && prev.every((h, i) => h.id === found[i]?.id) ? prev : found,
      );
    };

    scan();
    const observer = new MutationObserver(scan);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [containerRef, contentKey]);

  useEffect(() => {
    if (headings.length === 0) return;
    const spy = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-90px 0px -70% 0px', threshold: 0 },
    );
    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) spy.observe(el);
    }
    return () => spy.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <nav aria-label="On this page" className="text-[0.8rem]">
      <p className="mb-2.5 text-[0.64rem] font-semibold tracking-[0.12em] text-[color:var(--sf-text-faint)] uppercase">
        On this page
      </p>
      <ul className="m-0 list-none space-y-0.5 border-l p-0">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              onClick={(e) => {
                e.preventDefault();
                // Never touch location here: the router owns the hash.
                document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={cn(
                '-ml-px block border-l-2 py-1 leading-snug transition',
                h.level === 3 ? 'pl-6' : 'pl-3',
                active === h.id
                  ? 'border-l-[color:var(--sf-accent)] font-medium text-[color:var(--sf-accent-text)]'
                  : 'border-l-transparent text-[color:var(--sf-text-muted)] hover:text-[color:var(--sf-text)]',
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
