import { describe, it, expect } from 'vitest';
import {
  BUSINESS_OPEN_MINUTES,
  BUSINESS_CLOSE_MINUTES,
  minutesSinceMidnightToTop,
  durationToHeight,
  pixelsToMinutesSinceMidnight,
  formatHourLabel,
  formatSlotLabel,
  generateSlotOptions,
  minutesToHourMinute,
} from './schedulingTime';

describe('minutesSinceMidnightToTop', () => {
  it('places business open (9:00) at the very top of the grid', () => {
    expect(minutesSinceMidnightToTop(BUSINESS_OPEN_MINUTES)).toBe(0);
  });

  it('places 10:00 sixty pixels down at 1px/minute', () => {
    expect(minutesSinceMidnightToTop(10 * 60)).toBe(60);
  });
});

describe('durationToHeight', () => {
  it('matches the duration in pixels for anything at or above one slot', () => {
    expect(durationToHeight(30)).toBe(30);
    expect(durationToHeight(90)).toBe(90);
  });

  it('floors short durations to one slot height so tiny blocks stay clickable', () => {
    expect(durationToHeight(5)).toBe(15);
  });
});

describe('pixelsToMinutesSinceMidnight', () => {
  it('round-trips a clean hour boundary', () => {
    expect(pixelsToMinutesSinceMidnight(60)).toBe(BUSINESS_OPEN_MINUTES + 60);
  });

  it('snaps to the nearest 15-minute slot', () => {
    expect(pixelsToMinutesSinceMidnight(65)).toBe(BUSINESS_OPEN_MINUTES + 60);
    expect(pixelsToMinutesSinceMidnight(68)).toBe(BUSINESS_OPEN_MINUTES + 75);
  });

  it('clamps below business open and above business close', () => {
    expect(pixelsToMinutesSinceMidnight(-500)).toBe(BUSINESS_OPEN_MINUTES);
    expect(pixelsToMinutesSinceMidnight(100_000)).toBe(BUSINESS_CLOSE_MINUTES);
  });
});

describe('formatHourLabel', () => {
  it('formats morning, noon, and evening hours with the right AM/PM boundary', () => {
    expect(formatHourLabel(9)).toBe('9 AM');
    expect(formatHourLabel(12)).toBe('12 PM');
    expect(formatHourLabel(18)).toBe('6 PM');
    expect(formatHourLabel(0)).toBe('12 AM');
  });
});

describe('formatSlotLabel', () => {
  it('formats a half-hour morning and afternoon slot', () => {
    expect(formatSlotLabel(9 * 60 + 30)).toBe('9:30 AM');
    expect(formatSlotLabel(12 * 60 + 30)).toBe('12:30 PM');
  });

  it('pads single-digit minutes', () => {
    expect(formatSlotLabel(9 * 60 + 5)).toBe('9:05 AM');
  });
});

describe('minutesToHourMinute', () => {
  it('splits minutes-since-midnight into hour and minute', () => {
    expect(minutesToHourMinute(9 * 60 + 45)).toEqual({ hour: 9, minute: 45 });
  });
});

describe('generateSlotOptions', () => {
  it('produces every 15-minute slot that leaves room for the given duration', () => {
    const slots = generateSlotOptions(30);
    expect(slots[0]).toBe(BUSINESS_OPEN_MINUTES);
    expect(slots[slots.length - 1]).toBe(BUSINESS_CLOSE_MINUTES - 30);
    expect(slots.every((s) => (s - BUSINESS_OPEN_MINUTES) % 15 === 0)).toBe(true);
  });

  it('shrinks the option set for a longer duration', () => {
    const short = generateSlotOptions(30);
    const long = generateSlotOptions(120);
    expect(long.length).toBeLessThan(short.length);
    expect(long[long.length - 1]).toBe(BUSINESS_CLOSE_MINUTES - 120);
  });
});
