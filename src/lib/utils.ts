import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(dateStr: string, locale = 'id-ID'): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export function formatDateTime(dateStr: string, locale = 'id-ID'): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatMb(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb} MB`;
}

export function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen - 3) + '…' : str;
}

export function getEventStatusBadge(status: string, hasStarted?: boolean): {
  label: string;
  className: string;
} {
  const map: Record<string, { label: string; className: string }> = {
    draft:     { label: 'Draft',    className: 'badge-gray' },
    published: hasStarted === false
      ? { label: 'Scheduled', className: 'badge-warning' }
      : { label: 'Live',      className: 'badge-success' },
    closed:    { label: 'Closed',   className: 'badge-error' },
    archived:  { label: 'Archived', className: 'badge-gray' },
  };
  return map[status] ?? { label: status, className: 'badge-gray' };
}

export function getCategoryLabel(cat: string): string {
  const map: Record<string, string> = {
    wedding:     'Wedding',
    birthday:    'Birthday',
    corporate:   'Corporate',
    graduation:  'Graduation',
    baby_shower: 'Baby Shower',
    anniversary: 'Anniversary',
    conference:  'Conference',
    party:       'Party',
    other:       'Other',
  };
  return map[cat] ?? cat;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
