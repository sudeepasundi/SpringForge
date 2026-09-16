import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * A failed dynamic import. The message differs per browser, so match on text
 * rather than on a type — this is the shape a chunk 404 takes after a redeploy,
 * when the browser still holds the previous index.html and asks for hashed
 * filenames that no longer exist.
 */
function isStaleChunkError(error: unknown): boolean {
  const text = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  return /Loading chunk|dynamically imported module|Importing a module script failed|Failed to fetch/i.test(
    text,
  );
}

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Without this, any render-time throw unmounts the whole tree and leaves a blank
 * page: every page, the command palette and all 84 lessons are lazy-loaded, so a
 * single stale chunk after a deploy is enough to do it.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep the component stack — it is the only clue once the tree is gone.
    console.error('[SpringForge] render error', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const stale = isStaleChunkError(error);

    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-sm font-semibold tracking-wide text-[color:var(--sf-text-muted)] uppercase">
          {stale ? 'This page is out of date' : 'Something went wrong'}
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-[color:var(--sf-text)]">
          {stale ? 'A newer version of SpringForge is available' : 'This page failed to render'}
        </h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-[color:var(--sf-text-muted)]">
          {stale
            ? 'Part of the site was updated while this tab was open, so a file it asked for no longer exists. Reloading picks up the new version.'
            : 'Your progress is saved locally and is unaffected. Reloading usually clears this.'}
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex items-center gap-2 rounded-lg border bg-[color:var(--sf-surface-2)] px-4 py-2 text-sm font-medium text-[color:var(--sf-text)] transition hover:border-[color:var(--sf-accent)]"
        >
          <RefreshCw size={14} aria-hidden="true" />
          Reload the page
        </button>

        {!stale && (
          <pre className="mt-6 overflow-x-auto rounded-lg border bg-[color:var(--sf-surface-2)] p-3 text-left text-[0.75rem] text-[color:var(--sf-text-faint)]">
            {error.message}
          </pre>
        )}
      </div>
    );
  }
}
