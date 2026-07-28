import { useState } from 'react';
import type { Appointment, AppointmentStatus } from '@/data/types';
import { repository } from '@/data';
import { usePatient, useUser, useAppointmentTypes } from '@/data/hooks';
import { formatDate, formatTime } from '@/lib/format';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Badge,
  Label,
} from '@/components/ui';

const STATUS_TONE: Record<AppointmentStatus, 'neutral' | 'accent' | 'success' | 'warning' | 'danger'> = {
  scheduled: 'neutral',
  confirmed: 'accent',
  completed: 'success',
  cancelled: 'danger',
  no_show: 'danger',
  rescheduled: 'warning',
};

interface AppointmentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  onChanged?: (appointment: Appointment) => void;
}

export function AppointmentDetailDialog({ open, onOpenChange, appointment, onChanged }: AppointmentDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {open && appointment ? (
          <AppointmentDetailBody
            key={appointment.id}
            appointment={appointment}
            onClose={() => onOpenChange(false)}
            onChanged={(updated) => {
              onChanged?.(updated);
              onOpenChange(false);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type PendingAction = 'cancel' | 'no_show' | null;

const RESOLVED_STATUSES = new Set<AppointmentStatus>(['cancelled', 'no_show', 'completed']);

function AppointmentDetailBody({
  appointment,
  onClose,
  onChanged,
}: {
  appointment: Appointment;
  onClose: () => void;
  onChanged: (appointment: Appointment) => void;
}) {
  const { data: patient } = usePatient(appointment.patientId);
  const { data: provider } = useUser(appointment.providerId);
  const { data: appointmentTypes } = useAppointmentTypes();
  const appointmentType = appointmentTypes?.find((t) => t.id === appointment.appointmentTypeId);

  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const patientName = patient
    ? [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ')
    : 'this patient';
  const isResolved = RESOLVED_STATUSES.has(appointment.status);

  async function runUpdate(fn: () => Promise<Appointment>): Promise<void> {
    setSaveError(null);
    setIsSaving(true);
    try {
      const updated = await fn();
      onChanged(updated);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not update this appointment.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleConfirmAppointment(): void {
    void runUpdate(() =>
      repository.updateAppointment(
        appointment.id,
        { status: 'confirmed', confirmedAt: new Date().toISOString(), confirmationMethod: 'in_person' },
        appointment.providerId,
      ),
    );
  }

  function handleMarkCompleted(): void {
    void runUpdate(() => repository.updateAppointment(appointment.id, { status: 'completed' }, appointment.providerId));
  }

  function handleConfirmCancel(): void {
    void runUpdate(() => repository.cancelAppointment(appointment.id, reason.trim(), appointment.providerId));
  }

  function handleConfirmNoShow(): void {
    void runUpdate(() =>
      repository.updateAppointment(
        appointment.id,
        { status: 'no_show', noShowReason: reason.trim() || null },
        appointment.providerId,
      ),
    );
  }

  if (pendingAction === 'cancel') {
    return (
      <div>
        <DialogTitle>Cancel appointment</DialogTitle>
        <DialogDescription>
          Cancel <strong>{patientName}</strong>'s {appointmentType?.name.toLowerCase() ?? 'appointment'} on{' '}
          {formatDate(appointment.startTime)} at {formatTime(appointment.startTime)}?
        </DialogDescription>
        <div className="mt-3">
          <Label htmlFor="cancelReason">Reason</Label>
          <input
            id="cancelReason"
            className="mt-1 h-9 w-full rounded-md border border-hairline bg-surface-base px-3 text-sm text-ink-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Patient requested reschedule"
          />
        </div>
        {saveError ? <p className="mt-2 text-xs text-status-danger">{saveError}</p> : null}
        <DialogFooter>
          <Button variant="secondary" onClick={() => setPendingAction(null)} disabled={isSaving}>
            Back
          </Button>
          <Button variant="danger" onClick={handleConfirmCancel} disabled={isSaving || !reason.trim()}>
            {isSaving ? 'Cancelling…' : `Cancel ${patientName}'s appointment`}
          </Button>
        </DialogFooter>
      </div>
    );
  }

  if (pendingAction === 'no_show') {
    return (
      <div>
        <DialogTitle>Mark as no-show</DialogTitle>
        <DialogDescription>
          Mark <strong>{patientName}</strong>'s {formatDate(appointment.startTime)} appointment as a no-show?
        </DialogDescription>
        <div className="mt-3">
          <Label htmlFor="noShowReason">Notes (optional)</Label>
          <input
            id="noShowReason"
            className="mt-1 h-9 w-full rounded-md border border-hairline bg-surface-base px-3 text-sm text-ink-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        {saveError ? <p className="mt-2 text-xs text-status-danger">{saveError}</p> : null}
        <DialogFooter>
          <Button variant="secondary" onClick={() => setPendingAction(null)} disabled={isSaving}>
            Back
          </Button>
          <Button variant="danger" onClick={handleConfirmNoShow} disabled={isSaving}>
            {isSaving ? 'Saving…' : `Mark ${patientName} no-show`}
          </Button>
        </DialogFooter>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <DialogTitle>{patientName}</DialogTitle>
        <Badge tone={STATUS_TONE[appointment.status]}>{appointment.status.replace('_', ' ')}</Badge>
      </div>
      <DialogDescription>
        {appointmentType?.name ?? 'Appointment'} with {provider ? `${provider.firstName} ${provider.lastName}` : '…'}
      </DialogDescription>

      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-secondary">Date</dt>
          <dd className="text-ink-primary">{formatDate(appointment.startTime)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-secondary">Time</dt>
          <dd className="text-ink-primary">
            {formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}
          </dd>
        </div>
        {appointment.notes ? (
          <div className="flex justify-between gap-4">
            <dt className="shrink-0 text-ink-secondary">Notes</dt>
            <dd className="text-right text-ink-primary">{appointment.notes}</dd>
          </div>
        ) : null}
        {appointment.status === 'cancelled' && appointment.cancelReason ? (
          <div className="flex justify-between gap-4">
            <dt className="shrink-0 text-ink-secondary">Cancel reason</dt>
            <dd className="text-right text-ink-primary">{appointment.cancelReason}</dd>
          </div>
        ) : null}
        {appointment.status === 'no_show' && appointment.noShowReason ? (
          <div className="flex justify-between gap-4">
            <dt className="shrink-0 text-ink-secondary">Notes</dt>
            <dd className="text-right text-ink-primary">{appointment.noShowReason}</dd>
          </div>
        ) : null}
      </dl>

      {saveError ? <p className="mt-2 text-xs text-status-danger">{saveError}</p> : null}

      <DialogFooter className="flex-wrap">
        <Button variant="secondary" onClick={onClose} disabled={isSaving}>
          Close
        </Button>
        {!isResolved ? (
          <>
            <Button variant="danger" onClick={() => setPendingAction('no_show')} disabled={isSaving}>
              Mark no-show
            </Button>
            <Button variant="danger" onClick={() => setPendingAction('cancel')} disabled={isSaving}>
              Cancel appointment
            </Button>
            {appointment.status === 'scheduled' ? (
              <Button variant="secondary" onClick={handleConfirmAppointment} disabled={isSaving}>
                Confirm
              </Button>
            ) : null}
            <Button variant="primary" onClick={handleMarkCompleted} disabled={isSaving}>
              Mark completed
            </Button>
          </>
        ) : null}
      </DialogFooter>
    </div>
  );
}
