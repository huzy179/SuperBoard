export function toDateInputValue(dateString?: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .slice(-2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export function percentOf(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}
