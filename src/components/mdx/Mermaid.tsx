import { useEffect, useId, useRef, useState } from 'react';
import { Maximize2, X } from 'lucide-react';
import { useProgress } from '@/store/progress';
import { resolveTheme } from '@/lib/theme';

/** Read the live token values so diagrams inherit the site palette exactly. */
function themeVariables(dark: boolean) {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;

  const surface = v('--sf-surface', dark ? '#12181f' : '#ffffff');
  const line = v('--sf-border-strong', dark ? '#33404e' : '#cfd2cb');
  const ink = v('--sf-text', dark ? '#e6edf3' : '#14171a');
  const muted = v('--sf-text-muted', dark ? '#93a1b1' : '#5b6470');
  const accent = v('--sf-accent', dark ? '#7ec74a' : '#4f8f28');

  return {
    background: 'transparent',
    primaryColor: surface,
    primaryTextColor: ink,
    primaryBorderColor: line,
    secondaryColor: v('--sf-surface-2', dark ? '#171e26' : '#f7f8f6'),
    tertiaryColor: v('--sf-bg-subtle', dark ? '#0f1419' : '#f3f4f2'),
    lineColor: muted,
    textColor: ink,
    mainBkg: surface,
    nodeBorder: line,
    clusterBkg: dark ? '#0f1419' : '#f7f8f6',
    clusterBorder: line,
    edgeLabelBackground: surface,
    titleColor: ink,
    // Sequence diagrams
    actorBkg: surface,
    actorBorder: accent,
    actorTextColor: ink,
    actorLineColor: muted,
    signalColor: ink,
    signalTextColor: ink,
    labelBoxBkgColor: surface,
    labelBoxBorderColor: line,
    labelTextColor: ink,
    loopTextColor: muted,
    noteBkgColor: dark ? '#221331' : '#f2ebfe',
    noteTextColor: ink,
    noteBorderColor: v('--sf-prod', '#7c3aed'),
    activationBkgColor: dark ? '#16240f' : '#eaf5e1',
    activationBorderColor: accent,
    // State / flow
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    fontSize: '14px',
  };
}

export function Mermaid({ chart, caption, alt }: { chart: string; caption?: string; alt?: string }) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [svg, setSvg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const themePref = useProgress((s) => s.theme);
  const seq = useRef(0);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const run = seq.current + 1;
    seq.current = run;

    (async () => {
      try {
        const dark = resolveTheme(themePref) === 'dark';
        const { default: mermaid } = await import('mermaid');
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'base',
          darkMode: dark,
          themeVariables: themeVariables(dark),
          flowchart: { curve: 'basis', htmlLabels: true, padding: 14, useMaxWidth: true },
          sequence: { useMaxWidth: true, actorMargin: 52, mirrorActors: false, noteMargin: 12 },
          state: { useMaxWidth: true },
          er: { useMaxWidth: true },
        });
        const { svg: out } = await mermaid.render(`sf-${rawId}-${run}`, chart.trim());
        if (!cancelled && seq.current === run) {
          setSvg(out);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Diagram failed to render');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chart, themePref, rawId]);

  /**
   * Mermaid always emits `width="100%"` with the natural size as an inline
   * max-width, so a wide diagram is scaled down until the labels are unreadable.
   * Past a legibility threshold we pin the natural width instead and let the
   * figure scroll — the caller can still open the zoom view for the whole thing.
   */
  useEffect(() => {
    const el = hostRef.current?.querySelector('svg');
    if (!el) return;
    const viewBox = el.getAttribute('viewBox')?.split(/\s+/).map(Number);
    const natural = viewBox?.[2] ?? 0;
    const available = hostRef.current?.clientWidth ?? 0;
    // Below ~0.75 scale, 14px labels stop being comfortably readable.
    const wouldShrinkTooFar = available > 0 && natural > available / 0.75;
    if (wouldShrinkTooFar) {
      el.style.maxWidth = 'none';
      el.style.width = `${natural}px`;
    }
  }, [svg]);

  if (error) {
    return (
      <figure className="sf-block rounded-[var(--radius-token)] border border-[color:var(--sf-danger)] p-4 text-sm text-[color:var(--sf-danger)]">
        Diagram failed to render: {error}
      </figure>
    );
  }

  return (
    <>
      <figure className="sf-block group relative overflow-hidden rounded-[var(--radius-token)] border bg-[color:var(--sf-surface)] shadow-[var(--sf-shadow)]">
        <button
          type="button"
          onClick={() => setZoomed(true)}
          aria-label="Enlarge diagram"
          className="absolute top-2.5 right-2.5 z-10 rounded-md border bg-[color:var(--sf-surface-2)] p-1.5 text-[color:var(--sf-text-muted)] opacity-0 transition group-hover:opacity-100 hover:text-[color:var(--sf-text)] focus-visible:opacity-100"
        >
          <Maximize2 size={14} />
        </button>
        <div
          ref={hostRef}
          className="sf-mermaid overflow-x-auto px-4 py-6"
          role="img"
          aria-label={alt ?? caption ?? 'Diagram'}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        {caption && (
          <figcaption className="border-t bg-[color:var(--sf-surface-2)] px-4 py-2.5 text-center text-[0.8rem] text-[color:var(--sf-text-muted)]">
            {caption}
          </figcaption>
        )}
      </figure>

      {zoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={caption ?? 'Diagram'}
          onClick={() => setZoomed(false)}
          onKeyDown={(e) => e.key === 'Escape' && setZoomed(false)}
        >
          <div
            className="max-h-full w-full max-w-6xl overflow-auto rounded-[var(--radius-token)] border bg-[color:var(--sf-surface)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="m-0 text-sm font-medium text-[color:var(--sf-text-muted)]">
                {caption ?? 'Diagram'}
              </p>
              <button
                type="button"
                onClick={() => setZoomed(false)}
                aria-label="Close"
                className="rounded-md border p-1.5 text-[color:var(--sf-text-muted)] hover:text-[color:var(--sf-text)]"
                autoFocus
              >
                <X size={16} />
              </button>
            </div>
            <div
              className="sf-mermaid"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
        </div>
      )}
    </>
  );
}
