import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Layers } from 'lucide-react';
import { completionOf, useProgress } from '@/store/progress';
import { formatMinutes, pct } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Level, Module } from '@/lib/types';

const levelTone: Record<Level, string> = {
  beginner: 'var(--sf-accent)',
  intermediate: 'var(--sf-info)',
  advanced: 'var(--sf-warn)',
  expert: 'var(--sf-prod)',
};

export function LevelBadge({ level }: { level: Level }) {
  return (
    <span
      className="rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold tracking-[0.06em] uppercase"
      style={{ color: levelTone[level], borderColor: levelTone[level] }}
    >
      {level}
    </span>
  );
}

export function ProgressRing({
  value,
  size = 44,
  stroke = 4,
  children,
}: {
  /** 0–1 */
  value: number;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--sf-border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--sf-accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - Math.min(1, Math.max(0, value)))}
          style={{ transition: 'stroke-dashoffset 400ms ease' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[0.7rem] font-semibold tabular-nums">
        {children ?? `${pct(value)}%`}
      </span>
    </div>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div
      className={cn(
        'h-1.5 overflow-hidden rounded-full bg-[color:var(--sf-surface-2)]',
        className,
      )}
      role="progressbar"
      aria-valuenow={pct(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-[color:var(--sf-accent)] transition-[width] duration-500"
        style={{ width: `${value * 100}%` }}
      />
    </div>
  );
}

export function ModuleCard({ module }: { module: Module }) {
  const completed = useProgress((s) => s.completed);
  const paths = module.lessons.map((l) => `${module.slug}/${l.slug}`);
  const done = completionOf(completed, paths);
  const minutes = module.lessons.reduce((n, l) => n + l.minutes, 0);

  return (
    <Link
      to={`/learn/${module.slug}`}
      className="group flex flex-col rounded-[var(--radius-token)] border bg-[color:var(--sf-surface)] p-5 transition hover:border-[color:var(--sf-accent)] hover:shadow-[var(--sf-shadow)]"
    >
      <div className="flex items-start gap-3">
        <span className="font-[family-name:var(--font-mono)] text-[1.5rem] leading-none font-bold text-[color:var(--sf-border-strong)] transition group-hover:text-[color:var(--sf-accent)]">
          {module.id}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="m-0 text-[1.02rem] leading-snug font-semibold">{module.title}</h3>
          <p className="mt-0.5 mb-0 text-[0.8rem] text-[color:var(--sf-text-faint)]">
            {module.tagline}
          </p>
        </div>
        <ProgressRing value={done} size={38} stroke={3.5} />
      </div>

      <p className="mt-3 mb-0 line-clamp-3 text-[0.86rem] leading-relaxed text-[color:var(--sf-text-muted)]">
        {module.description}
      </p>

      <div className="mt-4 flex items-center gap-3.5 border-t pt-3 text-[0.74rem] text-[color:var(--sf-text-faint)]">
        <span className="flex items-center gap-1.5">
          <Layers size={12} /> {module.lessons.length} lessons
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={12} /> {formatMinutes(minutes)}
        </span>
        <ArrowRight
          size={14}
          className="ml-auto text-[color:var(--sf-accent)] opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
        />
      </div>
    </Link>
  );
}
