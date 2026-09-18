import type { KeyboardEvent } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  label: string;
  minRows?: number;
}

/**
 * A plain textarea tuned for SQL: Tab indents, Ctrl/⌘+Enter runs, and it grows
 * with its content. No editor library — the chapters' queries are short.
 */
export function SqlEditor({ value, onChange, onRun, label, minRows = 3 }: Props) {
  const rows = Math.min(Math.max(value.split('\n').length, minRows), 24);

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onRun();
      return;
    }
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      const el = e.currentTarget;
      const { selectionStart: start, selectionEnd: end } = el;
      const next = `${value.slice(0, start)}  ${value.slice(end)}`;
      onChange(next);
      setTimeout(() => el.setSelectionRange(start + 2, start + 2), 0);
    }
  }

  return (
    <textarea
      aria-label={label}
      value={value}
      rows={rows}
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      className="block w-full resize-y border-0 bg-[color:var(--sf-code-bg)] px-3.5 py-3 font-[family-name:var(--font-mono)] text-[0.82rem] leading-[1.6] text-[color:var(--sf-text)] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--sf-accent-soft)] focus-visible:ring-inset"
    />
  );
}
