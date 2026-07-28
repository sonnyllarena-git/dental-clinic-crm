/**
 * The demo's frozen clock. Every generated seed date is computed relative
 * to REFERENCE_DATE, never to `new Date()` with no arguments — that's what
 * keeps "12 days overdue" actually 12 days overdue in every screenshot and
 * every CI run, regardless of when the seed happens to execute. A Monday,
 * so weekly scheduling patterns (and the `busy-monday` scenario) land
 * naturally.
 *
 * This same REFERENCE_DATE is also what the hooks layer treats as "today"
 * (see data/hooks/useAppointments.ts's busy-monday handling) — the seed
 * carefully places its day-0-relative special cases (today's 7
 * appointments, the empty day at +15, ...) around this exact point, so the
 * demo's notion of "now" stays pinned here rather than drifting with the
 * real wall clock every time someone opens the app on a different day.
 *
 * Every helper below uses UTC-based Date methods exclusively (setUTCDate,
 * getUTCHours, ...), never their local-timezone counterparts. PH local time
 * (Asia/Manila, UTC+8, no DST) is expressed as a fixed arithmetic offset —
 * "PH hour H" is "UTC hour H-8" — instead of relying on the executing
 * machine's system timezone. Using local Date methods here would make the
 * dataset depend on where it happens to run, which directly breaks the
 * brief's "byte-identical on every machine" requirement: a dev laptop set
 * to Asia/Manila and a CI runner set to UTC would silently generate
 * different appointment times from the exact same seed.
 */
export const CLINIC_TIMEZONE = 'Asia/Manila';
const PH_UTC_OFFSET_HOURS = 8;

export const REFERENCE_DATE = new Date(Date.UTC(2026, 6, 27, 9 - PH_UTC_OFFSET_HOURS, 0, 0));

/** Returns a Date offset from REFERENCE_DATE by whole days (may be negative). */
export function dateAtDayOffset(offsetDays: number): Date {
  const result = new Date(REFERENCE_DATE);
  result.setUTCDate(result.getUTCDate() + offsetDays);
  return result;
}

/** Same calendar day as `date`, but at the given PH-local hour/minute. */
export function atTime(date: Date, hourPH: number, minutePH: number): Date {
  const result = new Date(date);
  result.setUTCHours(hourPH - PH_UTC_OFFSET_HOURS, minutePH, 0, 0);
  return result;
}

/** Adds whole minutes to a Date, returning a new Date. */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

/** A UTC calendar date (no PH-offset conversion) — used for plain YYYY-MM-DD arithmetic. */
export function utcDateYMD(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day));
}

export function toIsoDateTime(date: Date): string {
  return date.toISOString();
}

/** YYYY-MM-DD, for date-only fields like dateOfBirth or invoiceDate. */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** 1 = Monday ... 7 = Sunday, matching the clinic_settings.working_days convention. */
export function isoWeekday(date: Date): number {
  const day = date.getUTCDay();
  return day === 0 ? 7 : day;
}

export function wholeDaysBetween(from: Date, to: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((to.getTime() - from.getTime()) / msPerDay);
}

/**
 * Recovers the PH-local wall-clock minutes-since-midnight from a stored
 * UTC instant (an appointment's startTime/endTime) — the inverse of
 * `atTime`'s `hourPH - 8` encoding. Used anywhere that needs to answer
 * "what time does this appointment display at," not just "what UTC
 * instant is it": the scheduling calendar's grid position, and the seed
 * validator's business-hours rule.
 */
export function phLocalMinutesSinceMidnight(iso: string): number {
  const shifted = new Date(new Date(iso).getTime() + PH_UTC_OFFSET_HOURS * 60 * 60 * 1000);
  return shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
}

/** 1 = Monday ... 7 = Sunday, PH-local, recovered from a stored UTC instant. */
export function phLocalWeekday(iso: string): number {
  const shifted = new Date(new Date(iso).getTime() + PH_UTC_OFFSET_HOURS * 60 * 60 * 1000);
  const day = shifted.getUTCDay();
  return day === 0 ? 7 : day;
}

/** Age in whole years as of REFERENCE_DATE, given an ISO date-of-birth string. */
export function ageAt(dateOfBirthIso: string): number {
  const dob = new Date(dateOfBirthIso);
  let age = REFERENCE_DATE.getUTCFullYear() - dob.getUTCFullYear();
  const monthDiff = REFERENCE_DATE.getUTCMonth() - dob.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && REFERENCE_DATE.getUTCDate() < dob.getUTCDate())) {
    age -= 1;
  }
  return age;
}
