import type { ReactNode } from 'react';
import { Info, TriangleAlert, Bug, ServerCog, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/cn';

export type CalloutType = 'note' | 'tip' | 'warn' | 'pitfall' | 'prod';

const styles: Record<
  CalloutType,
  { icon: typeof Info; label: string; border: string; bg: string; fg: string }
> = {
  note: {
    icon: Info,
    label: 'Note',
    border: 'var(--sf-info)',
    bg: 'var(--sf-info-soft)',
    fg: 'var(--sf-info)',
  },
  tip: {
    icon: Lightbulb,
    label: 'Tip',
    border: 'var(--sf-accent)',
    bg: 'var(--sf-accent-soft)',
    fg: 'var(--sf-accent-text)',
  },
  warn: {
    icon: TriangleAlert,
    label: 'Careful',
    border: 'var(--sf-warn)',
    bg: 'var(--sf-warn-soft)',
    fg: 'var(--sf-warn)',
  },
  pitfall: {
    icon: Bug,
    label: 'Common pitfall',
    border: 'var(--sf-danger)',
    bg: 'var(--sf-danger-soft)',
    fg: 'var(--sf-danger)',
  },
  prod: {
    icon: ServerCog,
    label: 'In production',
    border: 'var(--sf-prod)',
    bg: 'var(--sf-prod-soft)',
    fg: 'var(--sf-prod)',
  },
};

export function Callout({
  type = 'note',
  title,
  children,
}: {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}) {
  const s = styles[type] ?? styles.note;
  const Icon = s.icon;
  return (
    <aside
      className={cn('sf-block rounded-[var(--radius-token)] border border-l-[3px] px-4 py-3.5')}
      style={{ borderLeftColor: s.border, background: s.bg }}
    >
      <p
        className="m-0 flex items-center gap-2 text-[0.72rem] font-semibold tracking-[0.09em] uppercase"
        style={{ color: s.fg }}
      >
        <Icon size={14} strokeWidth={2.4} aria-hidden />
        {title ?? s.label}
      </p>
      <div className="mt-2 [&>*+*]:mt-3 [&>*]:m-0 [&>p]:text-[0.96rem] [&>p]:leading-[1.7]">
        {children}
      </div>
    </aside>
  );
}
