const currencyFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

const dateFormatter = new Intl.DateTimeFormat('en-PH', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

/**
 * Accepts either a YYYY-MM-DD date or a full ISO datetime string, reads only
 * its date portion, and formats it as a calendar date. `timeZone: 'UTC'` is
 * required, not cosmetic — without it Intl falls back to the host machine's
 * local timezone, which would silently roll a UTC-midnight instant back to
 * the previous day on any machine west of UTC (this sandbox included).
 */
export function formatDate(isoDateOrDateTime: string): string {
  return dateFormatter.format(new Date(`${isoDateOrDateTime.slice(0, 10)}T00:00:00Z`));
}

const timeFormatter = new Intl.DateTimeFormat('en-PH', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Manila',
});

/** Formats an ISO datetime as PH-local wall-clock time, e.g. "10:30 AM". */
export function formatTime(isoDateTime: string): string {
  return timeFormatter.format(new Date(isoDateTime));
}

const dateTimeFormatter = new Intl.DateTimeFormat('en-PH', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Manila',
});

/** Formats an ISO datetime as a PH-local date + time, e.g. "Jul 27, 2026, 10:30 AM". */
export function formatDateTime(isoDateTime: string): string {
  return dateTimeFormatter.format(new Date(isoDateTime));
}
