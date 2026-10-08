import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

/** Merge Tailwind classes with conflict resolution. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a number as USD currency, e.g. 15750 -> "$15,750". */
export function formatCurrency(value: number, opts: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    ...opts,
  }).format(value);
}

/** Compact number formatting, e.g. 5_000_000 -> "5M". */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  );
}

/** Format a date with date-fns, default "MMM d, yyyy". */
export function formatDate(date: Date | string | number, pattern = 'MMM d, yyyy'): string {
  return format(new Date(date), pattern);
}

/** Render a signed percentage delta, e.g. 7.5 -> "+7.5%". */
export function formatDelta(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}%`;
}

// Display label for a payment gateway id (razorpay | stripe | paypal).
export function gatewayLabel(provider?: string | null): string {
  return provider === 'stripe' ? 'Stripe' : provider === 'paypal' ? 'PayPal' : 'Razorpay';
}
