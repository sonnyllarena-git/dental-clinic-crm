/**
 * Pixel <-> time-of-day math for the day-view grid. Matches the clinic's
 * seeded business hours (09:00-18:00 PH) exactly, at 1px per minute, so an
 * hour is 60px and the whole grid is 540px tall.
 */
export const BUSINESS_START_HOUR = 9;
export const BUSINESS_END_HOUR = 18;
export const BUSINESS_OPEN_MINUTES = BUSINESS_START_HOUR * 60;
export const BUSINESS_CLOSE_MINUTES = BUSINESS_END_HOUR * 60;
export const BUSINESS_DURATION_MINUTES = BUSINESS_CLOSE_MINUTES - BUSINESS_OPEN_MINUTES;

export const PIXELS_PER_MINUTE = 1;
export const GRID_HEIGHT = BUSINESS_DURATION_MINUTES * PIXELS_PER_MINUTE;

/** Drag-and-drop and new-appointment time pickers snap to this granularity. */
export const SLOT_MINUTES = 15;

export const HOUR_MARKERS: number[] = Array.from(
  { length: BUSINESS_END_HOUR - BUSINESS_START_HOUR + 1 },
  (_, i) => BUSINESS_START_HOUR + i,
);

export function minutesSinceMidnightToTop(minutesSinceMidnight: number): number {
  return (minutesSinceMidnight - BUSINESS_OPEN_MINUTES) * PIXELS_PER_MINUTE;
}

export function durationToHeight(durationMinutes: number): number {
  return Math.max(durationMinutes, SLOT_MINUTES) * PIXELS_PER_MINUTE;
}

/** Snaps a pixel offset within the grid to the nearest slot, clamped to business hours. */
export function pixelsToMinutesSinceMidnight(pixels: number): number {
  const raw = BUSINESS_OPEN_MINUTES + pixels / PIXELS_PER_MINUTE;
  const snapped = Math.round(raw / SLOT_MINUTES) * SLOT_MINUTES;
  return Math.min(Math.max(snapped, BUSINESS_OPEN_MINUTES), BUSINESS_CLOSE_MINUTES);
}

export function formatHourLabel(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour} ${period}`;
}

export function minutesToHourMinute(minutesSinceMidnight: number): { hour: number; minute: number } {
  return { hour: Math.floor(minutesSinceMidnight / 60), minute: minutesSinceMidnight % 60 };
}

/** e.g. 570 -> "9:30 AM" — for time-slot pickers, where formatHourLabel's whole-hour label isn't precise enough. */
export function formatSlotLabel(minutesSinceMidnight: number): string {
  const { hour, minute } = minutesToHourMinute(minutesSinceMidnight);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}

/** All valid slot start times, in minutes since midnight, for an appointment of the given duration. */
export function generateSlotOptions(durationMinutes: number): number[] {
  const slots: number[] = [];
  for (let m = BUSINESS_OPEN_MINUTES; m + durationMinutes <= BUSINESS_CLOSE_MINUTES; m += SLOT_MINUTES) {
    slots.push(m);
  }
  return slots;
}
