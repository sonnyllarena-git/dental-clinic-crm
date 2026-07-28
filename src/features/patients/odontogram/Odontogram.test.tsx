import { describe, it, expect, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Odontogram } from './Odontogram';
import type { Treatment } from '@/data/types';

function makeTreatment(overrides: Partial<Treatment>): Treatment {
  return {
    id: 'tx-1',
    clinicId: 'clinic-1',
    patientId: 'patient-1',
    appointmentId: null,
    procedureCode: 'D2140',
    procedureName: 'Amalgam Filling',
    toothNumber: 14,
    surface: 'O',
    status: 'completed',
    startedAt: null,
    completedAt: null,
    diagnosis: null,
    treatmentPlan: null,
    estimatedCost: 1800,
    actualCost: 1800,
    dentistId: 'user-1',
    hygienistId: null,
    followUpRequired: false,
    followUpDate: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('Odontogram', () => {
  it('renders all 32 teeth with an accessible label each', () => {
    render(<Odontogram treatments={[]} onSelectTooth={() => {}} onSelectSurface={() => {}} />);
    expect(screen.getAllByRole('button', { name: /^Tooth \d+/ })).toHaveLength(32);
  });

  it('moves the roving-tabindex focus tooth-to-tooth with the arrow keys', async () => {
    const user = userEvent.setup();
    render(<Odontogram treatments={[]} onSelectTooth={() => {}} onSelectSurface={() => {}} />);

    const tooth1 = screen.getByRole('button', { name: 'Tooth 1, no treatment history' });
    act(() => {
      tooth1.focus();
    });
    expect(tooth1).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Tooth 2, no treatment history' })).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(tooth1).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Tooth 32, no treatment history' })).toHaveFocus();
  });

  it('calls onSelectTooth when Enter is pressed on the focused tooth', async () => {
    const user = userEvent.setup();
    const onSelectTooth = vi.fn();
    render(<Odontogram treatments={[]} onSelectTooth={onSelectTooth} onSelectSurface={() => {}} />);

    act(() => {
      screen.getByRole('button', { name: 'Tooth 5, no treatment history' }).focus();
    });
    await user.keyboard('{Enter}');

    expect(onSelectTooth).toHaveBeenCalledWith(5);
  });

  it('reports a treated tooth and lists it in the accessible fallback table', () => {
    render(
      <Odontogram
        treatments={[makeTreatment({ toothNumber: 14, surface: 'O' })]}
        onSelectTooth={() => {}}
        onSelectSurface={() => {}}
      />,
    );

    expect(screen.getByText(/1 tooth with recorded treatment/i)).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: /Amalgam Filling \(D2140\)/ })).toBeInTheDocument();
    // Tooth 14 (upper arch) is now known to have treatment; an untouched tooth still isn't.
    expect(screen.getByRole('button', { name: 'Tooth 14, has treatment history' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tooth 15, no treatment history' })).toBeInTheDocument();
  });
});
