import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges CSS classes using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string for HTML date input
 */
export function toDateInputValue(dateString?: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

/**
 * Get initials from a full name (up to 2 characters)
 */
export function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .slice(-2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

/**
 * Calculate percentage
 */
export function percentOf(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}
