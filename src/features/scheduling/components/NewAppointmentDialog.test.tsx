import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewAppointmentDialog } from './NewAppointmentDialog';
import { repository } from '@/data';
import { atTime, dateAtDayOffset, phLocalMinutesSinceMidnight } from '@/data/demoClock';
import { APPOINTMENT_DAY } from '@/data/seed/coverageIndex';
import type { Patient, StaffUser, AppointmentType } from '@/data/types';

beforeEach(async () => {
  await repository.resetAndReseed();
});

describe('NewAppointmentDialog — booking flow', () => {
  it('books a real appointment for a selected patient, provider, and type', async () => {
    const user = userEvent.setup();
    const patients = (await repository.listPatients()) as Patient[];
    const users = (await repository.listUsers()) as StaffUser[];
    const types = (await repository.listAppointmentTypes()) as AppointmentType[];
    const patient = patients[0];
    const provider = users.find((u) => u.role === 'dentist') as StaffUser;
    const type = types[0];
    const patientFullName = [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ');
    const onCreated = vi.fn();

    render(<NewAppointmentDialog open onOpenChange={() => {}} onCreated={onCreated} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Provider' })).toBeInTheDocument();
    });

    await user.type(screen.getByRole('combobox', { name: 'Patient' }), patientFullName);
    await user.click(await screen.findByRole('option', { name: patientFullName }));

    await user.click(screen.getByRole('combobox', { name: 'Provider' }));
    await user.click(await screen.findByRole('option', { name: `${provider.firstName} ${provider.lastName}` }));

    await user.click(screen.getByRole('combobox', { name: 'Type' }));
    await user.click(await screen.findByRole('option', { name: new RegExp(type.name) }));

    await user.click(screen.getByRole('button', { name: new RegExp(`^Book`) }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));

    const created = onCreated.mock.calls[0][0];
    expect(created.patientId).toBe(patient.id);
    expect(created.providerId).toBe(provider.id);
    expect(created.appointmentTypeId).toBe(type.id);
    expect(created.status).toBe('scheduled');

    const stored = await repository.getAppointment(created.id);
    expect(stored).not.toBeNull();
    expect(stored?.patientId).toBe(patient.id);
  });

  it('warns, but does not block, when the chosen slot overlaps another appointment for the same provider', async () => {
    const user = userEvent.setup();
    const patients = (await repository.listPatients()) as Patient[];
    const types = (await repository.listAppointmentTypes()) as AppointmentType[];
    const type = types[0];

    // APPOINTMENT_DAY.fullyBookedDay is coverage-matrix-guaranteed to have a
    // packed schedule — grab its first appointment and prefill the dialog to
    // start at exactly the same provider/time, so an overlap is certain
    // regardless of which record the seed happened to put there.
    const fullyBookedDate = dateAtDayOffset(APPOINTMENT_DAY.fullyBookedDay);
    const dayAppointments = await repository.listAppointments({
      start: atTime(fullyBookedDate, 0, 0).toISOString(),
      end: atTime(fullyBookedDate, 24, 0).toISOString(),
    });
    const existing = dayAppointments.find((a) => a.status !== 'cancelled' && a.status !== 'no_show');
    expect(existing).toBeDefined();
    if (!existing) return;

    const conflictPatient = patients.find((p) => p.id !== existing.patientId) as Patient;
    const conflictName = [conflictPatient.firstName, conflictPatient.middleName, conflictPatient.lastName]
      .filter(Boolean)
      .join(' ');

    render(
      <NewAppointmentDialog
        open
        onOpenChange={() => {}}
        initialDate={fullyBookedDate}
        initialProviderId={existing.providerId}
        initialStartMinutes={phLocalMinutesSinceMidnight(existing.startTime)}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Provider' })).toBeInTheDocument();
    });

    await user.type(screen.getByRole('combobox', { name: 'Patient' }), conflictName);
    await user.click(await screen.findByRole('option', { name: conflictName }));

    await user.click(screen.getByRole('combobox', { name: 'Type' }));
    await user.click(await screen.findByRole('option', { name: new RegExp(type.name) }));

    expect(await screen.findByText(/overlaps with another appointment/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Book/ })).toBeEnabled();
  });
});
