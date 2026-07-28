import type { Appointment, Invoice } from '../types';
import { REFERENCE_DATE, atTime, addMinutes, toIsoDateTime } from '../demoClock';
import type { Scenario } from '@/store/scenario.store';

const SLOT_MINUTES = 30;
const BUSINESS_START_HOUR = 9;
const BUSINESS_END_HOUR = 18;

/**
 * Packs every open business-hours slot for every provider appearing in
 * `donorPool` on "today," for the `busy-monday` demo scenario. Cloned
 * appointments borrow a real patientId/appointmentTypeId from elsewhere in
 * the dataset (so they're still joinable in the UI) but get a fresh id,
 * provider, and time — they're never persisted, purely an in-memory
 * overlay for this one read.
 *
 * `donorPool` is deliberately a *separate*, wider fetch than the appointments
 * being displayed — a caller viewing just today's narrow range wouldn't
 * otherwise have anything to clone from.
 */
export function applyBusyMondayOverlay(
  baseAppointments: Appointment[],
  donorPool: Appointment[],
  todayIso: string,
  scenario: Scenario,
): Appointment[] {
  if (scenario !== 'busy-monday') return baseAppointments;

  const todaysAppointments = baseAppointments.filter((a) => a.startTime.slice(0, 10) === todayIso);
  const providerIds = Array.from(new Set(donorPool.map((a) => a.providerId)));
  const clonableDonors = donorPool.filter((a) => a.startTime.slice(0, 10) !== todayIso);
  if (clonableDonors.length === 0 || providerIds.length === 0) return baseAppointments;

  const extras: Appointment[] = [];
  let donorIndex = 0;
  const slotCount = Math.floor(((BUSINESS_END_HOUR - BUSINESS_START_HOUR) * 60) / SLOT_MINUTES);

  providerIds.forEach((providerId) => {
    const providerBusy = todaysAppointments
      .filter((a) => a.providerId === providerId)
      .map((a) => ({ start: new Date(a.startTime).getTime(), end: new Date(a.endTime).getTime() }));

    for (let slot = 0; slot < slotCount; slot += 1) {
      const slotStart = addMinutes(atTime(REFERENCE_DATE, BUSINESS_START_HOUR, 0), slot * SLOT_MINUTES);
      const slotEnd = addMinutes(slotStart, SLOT_MINUTES);
      const overlapsExisting = providerBusy.some(
        (busy) => slotStart.getTime() < busy.end && slotEnd.getTime() > busy.start,
      );
      if (overlapsExisting) continue;

      const donor = clonableDonors[donorIndex % clonableDonors.length];
      donorIndex += 1;

      const clone: Appointment = {
        ...donor,
        id: `busy-monday-overlay-${providerId}-${slot}`,
        providerId,
        startTime: toIsoDateTime(slotStart),
        endTime: toIsoDateTime(slotEnd),
        status: 'confirmed',
        confirmedAt: null,
        cancelledAt: null,
        cancelReason: null,
        noShowReason: null,
        notes: 'Demo overlay — busy-monday scenario, not a persisted appointment.',
      };
      extras.push(clone);
      providerBusy.push({ start: slotStart.getTime(), end: slotEnd.getTime() });
    }
  });

  return [...baseAppointments, ...extras];
}

/**
 * "Month-end billing" surfaces the full aging story: every invoice
 * regardless of whatever status filter the caller applied, oldest due
 * date first, so the most overdue accounts lead the list.
 */
export function applyMonthEndOverlay(invoices: Invoice[], scenario: Scenario): Invoice[] {
  if (scenario !== 'month-end') return invoices;
  return [...invoices].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
