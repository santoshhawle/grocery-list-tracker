import { AlertTriangle, Clock, X } from 'lucide-react';
import { createElement } from 'react';

export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(dateStr + 'T00:00:00');
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function expiryStatus(dateStr: string): 'expired' | 'soon' | 'ok' {
  const d = daysUntil(dateStr);
  if (d < 0) return 'expired';
  if (d <= 3) return 'soon';
  return 'ok';
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export const rowBg: Record<'expired' | 'soon' | 'ok', string> = {
  expired: 'bg-red-50 border-l-4 border-red-400',
  soon:    'bg-amber-50 border-l-4 border-amber-400',
  ok:      'bg-white border-l-4 border-transparent',
};

export function StatusBadge({ dateStr }: { dateStr: string }) {
  const d = daysUntil(dateStr);
  if (d < 0) {
    return createElement('span', { className: 'inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full' },
      createElement(X, { className: 'w-3 h-3' }),
      'Expired',
    );
  }
  if (d === 0) {
    return createElement('span', { className: 'inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full' },
      createElement(AlertTriangle, { className: 'w-3 h-3' }),
      'Expires today',
    );
  }
  if (d <= 3) {
    return createElement('span', { className: 'inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full' },
      createElement(Clock, { className: 'w-3 h-3' }),
      `${d}d left`,
    );
  }
  return null;
}
