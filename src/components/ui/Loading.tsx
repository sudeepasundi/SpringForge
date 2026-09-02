export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <div
      className="flex min-h-[40vh] items-center justify-center text-[color:var(--sf-text-faint)]"
      role="status"
      aria-live="polite"
    >
      <span className="flex items-center gap-2.5 text-sm">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[color:var(--sf-border-strong)] border-t-[color:var(--sf-accent)]" />
        {label}…
      </span>
    </div>
  );
}

/** Placeholder for lesson prose while its chunk streams in. */
export function ProseSkeleton() {
  const widths = ['92%', '78%', '85%', '60%', '88%', '72%'];
  return (
    <div className="animate-pulse space-y-3.5" aria-hidden>
      <div className="h-7 w-2/5 rounded bg-[color:var(--sf-surface-2)]" />
      {widths.map((w, i) => (
        <div
          key={`${w}-${i}`}
          className="h-4 rounded bg-[color:var(--sf-surface-2)]"
          style={{ width: w }}
        />
      ))}
      <div className="h-40 rounded-[var(--radius-token)] bg-[color:var(--sf-surface-2)]" />
    </div>
  );
}
