import { beforeEach, describe, it, expect } from 'vitest';
import { render, screen, waitFor, within, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DayView } from './DayView';
import { repository } from '@/data';
import { useScenarioStore } from '@/store/scenario.store';
import { atTime, dateAtDayOffset, phLocalMinutesSinceMidnight } from '@/data/demoClock';
import { APPOINTMENT_DAY } from '@/data/seed/coverageIndex';
import { BUSINESS_OPEN_MINUTES, BUSINESS_CLOSE_MINUTES } from '../utils/schedulingTime';
import type { Appointment, Patient, StaffUser } from '@/data/types';

const CLINICAL_ROLES = new Set(['dentist', 'hygienist']);
const RESOLVED_STATUSES = new Set(['cancelled', 'no_show']);

function fullName(patient: Patient): string {
  return [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ');
}

/** The first 15-minute slot for `providerId` on `date` that doesn't collide with anything already booked. */
function findFreeSlot(dayAppointments: Appointment[], providerId: string, durationMinutes: number): number {
  const providerAppointments = dayAppointments.filter(
    (a) => a.providerId === providerId && !RESOLVED_STATUSES.has(a.status),
  );
  for (let start = BUSINESS_OPEN_MINUTES; start + durationMinutes <= BUSINESS_CLOSE_MINUTES; start += 15) {
    const end = start + durationMinutes;
    const overlaps = providerAppointments.some((a) => {
      const aStart = phLocalMinutesSinceMidnight(a.startTime);
      const aEnd = phLocalMinutesSinceMidnight(a.endTime);
      return start < aEnd && aStart < end;
    });
    if (!overlaps) return start;
  }
  throw new Error(`No free slot found for provider ${providerId}`);
}

function makeDataTransfer(appointmentId: string) {
  return { setData: () => {}, getData: () => appointmentId, effectAllowed: '' } as unknown as DataTransfer;
}

beforeEach(async () => {
  await repository.resetAndReseed();
  useScenarioStore.setState({ scenario: 'full', dataVersion: 0 });
});

describe('DayView — cancel flow', () => {
  it('cancels a real appointment with a named confirmation and a reason', async () => {
    const user = userEvent.setup();
    const today = dateAtDayOffset(APPOINTMENT_DAY.today);
    const dayAppointments = await repository.listAppointments({
      start: atTime(today, 0, 0).toISOString(),
      end: atTime(today, 24, 0).toISOString(),
    });
    const target = dayAppointments.find((a) => !RESOLVED_STATUSES.has(a.status)) as Appointment;
    expect(target).toBeDefined();
    const patient = (await repository.getPatient(target.patientId)) as Patient;
    const patientName = fullName(patient);

    render(<DayView date={today} />);

    const appointmentButton = await screen.findByTitle((title) => title.startsWith(patientName));
    await user.click(appointmentButton);

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel appointment' }));

    await user.type(screen.getByLabelText('Reason'), 'Patient requested reschedule');
    await user.click(screen.getByRole('button', { name: `Cancel ${patientName}'s appointment` }));

    await waitFor(async () => {
      const updated = await repository.getAppointment(target.id);
      expect(updated?.status).toBe('cancelled');
    });
    const updated = await repository.getAppointment(target.id);
    expect(updated?.cancelReason).toBe('Patient requested reschedule');
  });

  it('marks a real appointment as a no-show', async () => {
    const user = userEvent.setup();
    const today = dateAtDayOffset(APPOINTMENT_DAY.today);
    const dayAppointments = await repository.listAppointments({
      start: atTime(today, 0, 0).toISOString(),
      end: atTime(today, 24, 0).toISOString(),
    });
    const target = dayAppointments.find((a) => !RESOLVED_STATUSES.has(a.status)) as Appointment;
    const patient = (await repository.getPatient(target.patientId)) as Patient;
    const patientName = fullName(patient);

    render(<DayView date={today} />);

    const appointmentButton = await screen.findByTitle((title) => title.startsWith(patientName));
    await user.click(appointmentButton);

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Mark no-show' }));
    await user.click(screen.getByRole('button', { name: `Mark ${patientName} no-show` }));

    await waitFor(async () => {
      const updated = await repository.getAppointment(target.id);
      expect(updated?.status).toBe('no_show');
    });
  });
});

describe('DayView — drag-to-reschedule', () => {
  it('moves a real appointment to a new provider and time after the user confirms', async () => {
    const user = userEvent.setup();
    const today = dateAtDayOffset(APPOINTMENT_DAY.today);
    const dayAppointments = await repository.listAppointments({
      start: atTime(today, 0, 0).toISOString(),
      end: atTime(today, 24, 0).toISOString(),
    });
    const users = (await repository.listUsers()) as StaffUser[];
    const providers = users.filter((u) => CLINICAL_ROLES.has(u.role));
    expect(providers.length).toBeGreaterThanOrEqual(2);

    const source = dayAppointments.find((a) => !RESOLVED_STATUSES.has(a.status)) as Appointment;
    const targetProvider = providers.find((p) => p.id !== source.providerId) as StaffUser;
    const durationMinutes = Math.round(
      (new Date(source.endTime).getTime() - new Date(source.startTime).getTime()) / 60_000,
    );
    const freeSlotMinutes = findFreeSlot(dayAppointments, targetProvider.id, durationMinutes);
    const patient = (await repository.getPatient(source.patientId)) as Patient;
    const patientName = fullName(patient);

    render(<DayView date={today} />);

    const appointmentButton = await screen.findByTitle((title) => title.startsWith(patientName));
    const targetGrid = screen.getByTestId(`provider-grid-${targetProvider.id}`);

    const dataTransfer = makeDataTransfer(source.id);
    fireEvent.dragStart(appointmentButton, { dataTransfer });
    fireEvent.dragOver(targetGrid, { dataTransfer });
    // jsdom's DragEvent constructor doesn't propagate clientX/clientY from
    // the init dict (verified empirically — fireEvent.drop(el, {clientY})
    // arrives as `undefined`), so the drop event is built and patched by
    // hand instead of going through fireEvent's usual sugar.
    const dropEvent = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(dropEvent, 'clientY', { value: freeSlotMinutes - BUSINESS_OPEN_MINUTES, configurable: true });
    Object.defineProperty(dropEvent, 'dataTransfer', { value: dataTransfer, configurable: true });
    act(() => {
      fireEvent(targetGrid, dropEvent);
    });

    expect(await screen.findByRole('heading', { name: 'Reschedule appointment' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirm reschedule' }));

    await waitFor(async () => {
      const updated = await repository.getAppointment(source.id);
      expect(updated?.providerId).toBe(targetProvider.id);
    });
    const updated = await repository.getAppointment(source.id);
    expect(phLocalMinutesSinceMidnight(updated!.startTime)).toBe(freeSlotMinutes);
    expect(updated!.status).not.toBe('cancelled');
  });
});
