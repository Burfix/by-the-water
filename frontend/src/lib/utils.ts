import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function scoreColor(score: number): string {
  if (score >= 85) return 'text-success-dark';
  if (score >= 60) return 'text-warning-dark';
  return 'text-danger-dark';
}

export function scoreBg(score: number): string {
  if (score >= 85) return 'bg-success-light text-success-dark';
  if (score >= 60) return 'bg-warning-light text-warning-dark';
  return 'bg-danger-light text-danger-dark';
}

export function auditStatusColor(status: string): string {
  switch (status) {
    case 'APPROVED':    return 'bg-success-light text-success-dark';
    case 'SUBMITTED':   return 'bg-blue-100 text-blue-800';
    case 'IN_PROGRESS': return 'bg-warning-light text-warning-dark';
    case 'REJECTED':    return 'bg-danger-light text-danger-dark';
    case 'DRAFT':       return 'bg-gray-100 text-gray-600';
    default:            return 'bg-gray-100 text-gray-600';
  }
}

export function truncate(str: string, maxLen = 50): string {
  return str.length > maxLen ? str.slice(0, maxLen - 3) + '...' : str;
}
