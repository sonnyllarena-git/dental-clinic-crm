import type { DragEvent } from 'react';
import type { Appointment, AppointmentType } from '@/data/types';
import { minutesSinceMidnightToTop, durationToHeight } from '../utils/schedulingTime';
import { phLocalMinutesSinceMidnight } from '@/data/demoClock';
import { cn } from '@/lib/cn';

interface AppointmentBlockProps {
  appointment: Appointment;
  appointmentType: AppointmentType | undefined;
  patientName: string;
  onOpen: () => void;
  onDragStart?: (event: DragEvent<HTMLButtonElement>) => void;
}

const RESOLVED_STATUSES = new Set(['cancelled', 'no_show']);

export function AppointmentBlock({ appointment, appointmentType, patientName, onOpen, onDragStart }: AppointmentBlockProps) {
  const startMinutes = phLocalMinutesSinceMidnight(appointment.startTime);
  const durationMinutes = Math.round(
    (new Date(appointment.endTime).getTime() - new Date(appointment.startTime).getTime()) / 60_000,
  );
  const top = minutesSinceMidnightToTop(startMinutes);
  const height = durationToHeight(durationMinutes);
  const color = appointmentType?.colorHex ?? '#94A3B8';
  const isResolved = RESOLVED_STATUSES.has(appointment.status);
  const isDraggable = !isResolved && Boolean(onDragStart);

  return (
    <button
      type="button"
      draggable={isDraggable}
      onDragStart={onDragStart}
      onClick={onOpen}
      style={{ top, height, backgroundColor: `${color}22`, borderLeftColor: color }}
      className={cn(
        'absolute left-1 right-1 overflow-hidden rounded-md border-l-4 px-2 py-1 text-left text-xs',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        isResolved ? 'opacity-50' : isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
      )}
      title={`${patientName} — ${appointmentType?.name ?? 'Appointment'} (${appointment.status.replace('_', ' ')})`}
    >
      <p className={cn('truncate font-medium text-ink-primary', appointment.status === 'cancelled' && 'line-through')}>
        {patientName}
      </p>
      <p className="truncate font-mono text-2xs text-ink-secondary">{appointmentType?.name ?? 'Appointment'}</p>
    </button>
  );
}
