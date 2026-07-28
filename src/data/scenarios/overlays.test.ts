import { describe, it, expect } from 'vitest';
import { applyBusyMondayOverlay, applyMonthEndOverlay } from './overlays';
import { REFERENCE_DATE, toIsoDateTime, addMinutes } from '../demoClock';
import type { Appointment, Invoice } from '../types';

function makeAppointment(overrides: Partial<Appointment>): Appointment {
  return {
    id: 'base',
    clinicId: 'clinic-1',
    patientId: 'patient-1',
    providerId: 'provider-1',
    appointmentTypeId: 'type-1',
    startTime: toIsoDateTime(REFERENCE_DATE),
    endTime: toIsoDateTime(addMinutes(REFERENCE_DATE, 30)),
    status: 'confirmed',
    confirmedAt: null,
    confirmationMethod: null,
    notes: null,
    treatmentPlanned: false,
    reminderSentAt: null,
    reminderType: null,
    noShowReason: null,
    rescheduledToAppointmentId: null,
    cancelledAt: null,
    cancelReason: null,
    createdAt: toIsoDateTime(REFERENCE_DATE),
    ...overrides,
  };
}

describe('applyBusyMondayOverlay', () => {
  const todayIso = REFERENCE_DATE.toISOString().slice(0, 10);

  it('is a no-op outside the busy-monday scenario', () => {
    const base = [makeAppointment({})];
    expect(applyBusyMondayOverlay(base, base, todayIso, 'full')).toBe(base);
  });

  it('packs the day with extra non-overlapping cloned appointments', () => {
    const base = [makeAppointment({ id: 'today-1' })];
    const donorDay = toIsoDateTime(addMinutes(REFERENCE_DATE, -60 * 24 * 10));
    const donorPool = [
      makeAppointment({
        id: 'donor-1',
        patientId: 'patient-donor',
        startTime: donorDay,
        endTime: toIsoDateTime(addMinutes(new Date(donorDay), 30)),
      }),
    ];

    const result = applyBusyMondayOverlay(base, donorPool, todayIso, 'busy-monday');

    expect(result.length).toBeGreaterThan(base.length);
    // Cloned appointments still reference a real, joinable patient.
    expect(result.some((a) => a.patientId === 'patient-donor')).toBe(true);

    // No two appointments for the same provider may overlap.
    const byProvider = new Map<string, Appointment[]>();
    result.forEach((a) => {
      const list = byProvider.get(a.providerId) ?? [];
      list.push(a);
      byProvider.set(a.providerId, list);
    });
    byProvider.forEach((list) => {
      const sorted = [...list].sort((a, b) => a.startTime.localeCompare(b.startTime));
      for (let i = 1; i < sorted.length; i += 1) {
        expect(new Date(sorted[i].startTime).getTime()).toBeGreaterThanOrEqual(
          new Date(sorted[i - 1].endTime).getTime(),
        );
      }
    });
  });
});

describe('applyMonthEndOverlay', () => {
  it('is a no-op outside the month-end scenario', () => {
    const invoices = [{ dueDate: '2026-08-01' } as Invoice];
    expect(applyMonthEndOverlay(invoices, 'full')).toBe(invoices);
  });

  it('sorts by due date ascending under the month-end scenario', () => {
    const invoices = [
      { dueDate: '2026-08-15' } as Invoice,
      { dueDate: '2026-06-01' } as Invoice,
      { dueDate: '2026-07-01' } as Invoice,
    ];

    const sorted = applyMonthEndOverlay(invoices, 'month-end');

    expect(sorted.map((i) => i.dueDate)).toEqual(['2026-06-01', '2026-07-01', '2026-08-15']);
  });
});
