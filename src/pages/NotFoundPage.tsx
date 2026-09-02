import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[40rem] flex-col items-center justify-center px-5 text-center">
      <Compass size={38} className="text-[color:var(--sf-text-faint)]" />
      <h1 className="mt-5 text-[1.75rem] font-semibold tracking-[-0.02em]">
        That page is not on the path
      </h1>
      <p className="mt-2.5 mb-0 text-[0.95rem] leading-relaxed text-[color:var(--sf-text-muted)]">
        The link may be stale, or the lesson may have been renamed. Press{' '}
        <kbd className="rounded border px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[0.75rem]">
          ⌘K
        </kbd>{' '}
        to search everything.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          to="/path"
          className="rounded-lg bg-[color:var(--sf-accent)] px-4 py-2.5 text-[0.88rem] font-semibold text-white hover:bg-[color:var(--sf-accent-hover)]"
        >
          Browse the path
        </Link>
        <Link to="/" className="rounded-lg border px-4 py-2.5 text-[0.88rem] font-medium">
          Go home
        </Link>
      </div>
    </div>
  );
}
