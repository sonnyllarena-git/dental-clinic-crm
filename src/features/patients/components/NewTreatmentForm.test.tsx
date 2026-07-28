import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewTreatmentForm } from './NewTreatmentForm';
import { repository } from '@/data';
import type { Patient } from '@/data/types';

beforeEach(async () => {
  await repository.resetAndReseed();
});

describe('NewTreatmentForm — full flow', () => {
  it('fills in, reviews with the patient named explicitly, confirms, and creates a real treatment', async () => {
    const user = userEvent.setup();
    const [patient] = (await repository.listPatients()) as Patient[];
    const onSaved = vi.fn();

    render(
      <NewTreatmentForm patient={patient} toothNumber={19} initialSurface={null} onCancel={() => {}} onSaved={onSaved} />,
    );

    // The dentist select fills itself in once useUsers() resolves (see the
    // effect in NewTreatmentForm) — wait for that before submitting.
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Dentist' }).textContent).not.toBe('');
    });

    await user.type(screen.getByLabelText('CDT code'), 'D2140');
    await user.type(screen.getByLabelText('Procedure name'), 'Test Filling');
    const costInput = screen.getByLabelText('Estimated cost (₱)');
    await user.clear(costInput);
    await user.type(costInput, '1500');

    await user.click(screen.getByRole('button', { name: 'Review and save' }));

    const fullName = [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ');
    expect(await screen.findByText(/Save this treatment to/)).toBeInTheDocument();
    expect(screen.getByText(fullName)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`DOB ${patient.dateOfBirth}`))).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: `Save to ${fullName}` }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));

    const treatments = await repository.listTreatmentsForPatient(patient.id);
    const created = treatments.find((t) => t.procedureName === 'Test Filling');
    expect(created).toBeDefined();
    expect(created?.toothNumber).toBe(19);
    expect(created?.procedureCode).toBe('D2140');
    expect(created?.estimatedCost).toBe(1500);
    expect(created?.status).toBe('planned');
  });

  it('lets the user go back from the review step without saving anything', async () => {
    const user = userEvent.setup();
    const [patient] = (await repository.listPatients()) as Patient[];

    render(
      <NewTreatmentForm patient={patient} toothNumber={8} initialSurface="M" onCancel={() => {}} onSaved={() => {}} />,
    );

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Dentist' }).textContent).not.toBe('');
    });

    await user.type(screen.getByLabelText('CDT code'), 'D2391');
    await user.type(screen.getByLabelText('Procedure name'), 'Should Not Save');
    await user.click(screen.getByRole('button', { name: 'Review and save' }));

    expect(await screen.findByText(/Save this treatment to/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to form' }));

    expect(screen.getByLabelText('Procedure name')).toHaveValue('Should Not Save');

    const treatments = await repository.listTreatmentsForPatient(patient.id);
    expect(treatments.find((t) => t.procedureName === 'Should Not Save')).toBeUndefined();
  });
});
