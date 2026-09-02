export function formatMinutes(total: number): string {
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return mins === 0 ? `${hours} hr` : `${hours} hr ${mins} min`;
}

export function pct(fraction: number): number {
  return Math.round(fraction * 100);
}
