import { useState } from 'react';
import type { DragEvent } from 'react';
import type { Appointment, StaffUser } from '@/data/types';
import { repository } from '@/data';
import { useAppointments, useAppointmentTypes, usePatients, useUsers } from '@/data/hooks';
import { atTime, addMinutes, toIsoDateTime, phLocalMinutesSinceMidnight } from '@/data/demoClock';
import {
  GRID_HEIGHT,
  HOUR_MARKERS,
  SLOT_MINUTES,
  minutesSinceMidnightToTop,
  pixelsToMinutesSinceMidnight,
  durationToHeight,
  generateSlotOptions,
  formatHourLabel,
  formatSlotLabel,
} from '../utils/schedulingTime';
import { AppointmentBlock } from './AppointmentBlock';
import { NewAppointmentDialog } from './NewAppointmentDialog';
import { AppointmentDetailDialog } from './AppointmentDetailDialog';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, Button } from '@/components/ui';
import { formatDate } from '@/lib/format';

const CLINICAL_ROLES = new Set(['dentist', 'hygienist']);
const RESOLVED_STATUSES = new Set(['cancelled', 'no_show']);

function staffName(user: StaffUser | undefined): string {
  return user ? `${user.firstName} ${user.lastName}` : 'Unknown provider';
}

interface DayViewProps {
  date: Date;
}

interface NewAppointmentPrefill {
  providerId: string;
  startMinutes: number;
}

interface RescheduleCandidate {
  appointment: Appointment;
  newProviderId: string;
  newStart: Date;
  newEnd: Date;
}

export function DayView({ date }: DayViewProps) {
  const dayRange = { start: toIsoDateTime(atTime(date, 8, 0)), end: toIsoDateTime(atTime(date, 19, 0)) };
  const { data: appointments, refetch } = useAppointments(dayRange);
  const { data: users } = useUsers();
  const { data: appointmentTypes } = useAppointmentTypes();
  const { data: patients } = usePatients();

  const providers = (users ?? []).filter((u) => CLINICAL_ROLES.has(u.role));
  const emptySlotStarts = generateSlotOptions(SLOT_MINUTES);

  const [prefill, setPrefill] = useState<NewAppointmentPrefill | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [rescheduleCandidate, setRescheduleCandidate] = useState<RescheduleCandidate | null>(null);
  const [dropError, setDropError] = useState<string | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

  function patientName(patientId: string): string {
    const patient = patients?.find((p) => p.id === patientId);
    return patient ? [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ') : 'Unknown patient';
  }

  function handleDragStart(event: DragEvent<HTMLButtonElement>, appointment: Appointment): void {
    event.dataTransfer.setData('text/plain', appointment.id);
    event.dataTransfer.effectAllowed = 'move';
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, targetProviderId: string): void {
    event.preventDefault();
    setDropError(null);
    const appointmentId = event.dataTransfer.getData('text/plain');
    const appointment = (appointments ?? []).find((a) => a.id === appointmentId);
    if (!appointment) return;

    const durationMinutes = Math.round(
      (new Date(appointment.endTime).getTime() - new Date(appointment.startTime).getTime()) / 60_000,
    );
    const offsetY = event.clientY - event.currentTarget.getBoundingClientRect().top;
    const rawStartMinutes = pixelsToMinutesSinceMidnight(offsetY);
    const closeMinutes = 18 * 60;
    const clampedStartMinutes = Math.min(rawStartMinutes, closeMinutes - durationMinutes);
    const newStart = atTime(date, Math.floor(clampedStartMinutes / 60), clampedStartMinutes % 60);
    const newEnd = addMinutes(newStart, durationMinutes);

    const conflict = (appointments ?? []).find((a) => {
      if (a.id === appointment.id || a.providerId !== targetProviderId) return false;
      if (RESOLVED_STATUSES.has(a.status)) return false;
      return new Date(a.startTime) < newEnd && new Date(a.endTime) > newStart;
    });
    if (conflict) {
      setDropError(
        `Can't reschedule there — it overlaps with ${patientName(conflict.patientId)}'s appointment at ${formatSlotLabel(
          phLocalMinutesSinceMidnight(conflict.startTime),
        )}.`,
      );
      return;
    }

    setRescheduleCandidate({ appointment, newProviderId: targetProviderId, newStart, newEnd });
  }

  async function confirmReschedule(): Promise<void> {
    if (!rescheduleCandidate) return;
    setIsRescheduling(true);
    try {
      await repository.updateAppointment(
        rescheduleCandidate.appointment.id,
        {
          providerId: rescheduleCandidate.newProviderId,
          startTime: toIsoDateTime(rescheduleCandidate.newStart),
          endTime: toIsoDateTime(rescheduleCandidate.newEnd),
        },
        rescheduleCandidate.newProviderId,
      );
      setRescheduleCandidate(null);
      refetch();
    } finally {
      setIsRescheduling(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {dropError ? (
        <div className="flex items-center justify-between gap-2 border-b border-status-danger/30 bg-status-danger/10 px-4 py-2 text-xs text-status-danger">
          <span>{dropError}</span>
          <button type="button" className="font-medium underline" onClick={() => setDropError(null)}>
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="flex flex-1 overflow-auto">
        <div className="relative w-14 shrink-0 border-r border-hairline">
          <div className="h-10 border-b border-hairline" />
          <div className="relative" style={{ height: GRID_HEIGHT }}>
            {HOUR_MARKERS.map((hour) => (
              <div
                key={hour}
                className="absolute right-2 -translate-y-1/2 text-2xs text-ink-secondary"
                style={{ top: minutesSinceMidnightToTop(hour * 60) }}
              >
                {formatHourLabel(hour)}
              </div>
            ))}
          </div>
        </div>

        {providers.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm text-ink-secondary">
            No providers to schedule against.
          </div>
        ) : (
          providers.map((provider) => {
            const providerAppointments = (appointments ?? []).filter((a) => a.providerId === provider.id);
            return (
              <div key={provider.id} className="min-w-[200px] flex-1 border-r border-hairline last:border-r-0">
                <div className="flex h-10 items-center border-b border-hairline px-2 text-sm font-medium text-ink-primary">
                  {staffName(provider)}
                </div>
                <div
                  className="relative"
                  style={{ height: GRID_HEIGHT }}
                  data-testid={`provider-grid-${provider.id}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, provider.id)}
                >
                  {HOUR_MARKERS.map((hour) => (
                    <div
                      key={hour}
                      className="pointer-events-none absolute left-0 right-0 border-t border-hairline/60"
                      style={{ top: minutesSinceMidnightToTop(hour * 60) }}
                    />
                  ))}
                  {emptySlotStarts.map((startMinutes) => (
                    <button
                      key={startMinutes}
                      type="button"
                      onClick={() => setPrefill({ providerId: provider.id, startMinutes })}
                      aria-label={`New appointment at ${formatSlotLabel(startMinutes)} with ${staffName(provider)}`}
                      className="absolute left-0 right-0 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
                      style={{ top: minutesSinceMidnightToTop(startMinutes), height: durationToHeight(SLOT_MINUTES) }}
                    />
                  ))}
                  {providerAppointments.map((appointment) => (
                    <AppointmentBlock
                      key={appointment.id}
                      appointment={appointment}
                      appointmentType={appointmentTypes?.find((t) => t.id === appointment.appointmentTypeId)}
                      patientName={patientName(appointment.patientId)}
                      onOpen={() => setSelectedAppointment(appointment)}
                      onDragStart={(e) => handleDragStart(e, appointment)}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      <NewAppointmentDialog
        open={prefill !== null}
        onOpenChange={(next) => {
          if (!next) setPrefill(null);
        }}
        initialDate={date}
        initialProviderId={prefill?.providerId}
        initialStartMinutes={prefill?.startMinutes}
        onCreated={() => refetch()}
      />

      <AppointmentDetailDialog
        open={selectedAppointment !== null}
        onOpenChange={(next) => {
          if (!next) setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onChanged={() => refetch()}
      />

      <Dialog open={rescheduleCandidate !== null} onOpenChange={(next) => !next && setRescheduleCandidate(null)}>
        <DialogContent className="max-w-sm">
          {rescheduleCandidate ? (
            <>
              <DialogTitle>Reschedule appointment</DialogTitle>
              <DialogDescription>
                Move <strong>{patientName(rescheduleCandidate.appointment.patientId)}</strong>'s appointment to{' '}
                {formatDate(toIsoDateTime(rescheduleCandidate.newStart))} at{' '}
                {formatSlotLabel(phLocalMinutesSinceMidnight(toIsoDateTime(rescheduleCandidate.newStart)))} with{' '}
                {staffName(providers.find((p) => p.id === rescheduleCandidate.newProviderId))}?
              </DialogDescription>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setRescheduleCandidate(null)} disabled={isRescheduling}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => void confirmReschedule()} disabled={isRescheduling}>
                  {isRescheduling ? 'Rescheduling…' : 'Confirm reschedule'}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
