import { useState } from 'react';
import type { Appointment } from '@/data/types';
import { useAppointments, useAppointmentTypes, useClinicSettings, usePatients } from '@/data/hooks';
import { atTime, dateAtDayOffset, isoWeekday, toIsoDate, toIsoDateTime } from '@/data/demoClock';
import { formatTime } from '@/lib/format';
import { AppointmentDetailDialog } from './AppointmentDetailDialog';
import { cn } from '@/lib/cn';

const DEFAULT_WORKING_DAYS = [1, 2, 3, 4, 5, 6];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const dayHeaderFormatter = new Intl.DateTimeFormat('en-PH', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

interface WeekViewProps {
  /** The Monday (UTC-midnight-anchored, representing a PH calendar date) that starts this week. */
  weekStart: Date;
  onSelectDate: (date: Date) => void;
}

export function WeekView({ weekStart, onSelectDate }: WeekViewProps) {
  const { data: clinicSettings } = useClinicSettings();
  const workingDays = clinicSettings?.workingDays ?? DEFAULT_WORKING_DAYS;

  const weekEnd = new Date(weekStart.getTime() + 7 * MS_PER_DAY);
  const weekRange = { start: toIsoDateTime(atTime(weekStart, 0, 0)), end: toIsoDateTime(atTime(weekEnd, 0, 0)) };
  const { data: appointments, refetch } = useAppointments(weekRange);
  const { data: patients } = usePatients();
  const { data: appointmentTypes } = useAppointmentTypes();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const days = Array.from({ length: 7 }, (_, i) => new Date(weekStart.getTime() + i * MS_PER_DAY)).filter((day) =>
    workingDays.includes(isoWeekday(day)),
  );
  const todayIsoDate = toIsoDate(dateAtDayOffset(0));

  function patientName(patientId: string): string {
    const patient = patients?.find((p) => p.id === patientId);
    return patient ? [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ') : 'Unknown patient';
  }

  return (
    <div className="flex flex-1 overflow-auto">
      {days.map((day) => {
        const dayStart = atTime(day, 0, 0);
        const dayEnd = atTime(day, 24, 0);
        const dayAppointments = (appointments ?? [])
          .filter((a) => {
            const t = new Date(a.startTime).getTime();
            return t >= dayStart.getTime() && t < dayEnd.getTime();
          })
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        const isToday = toIsoDate(day) === todayIsoDate;

        return (
          <div key={day.toISOString()} className="min-w-[160px] flex-1 border-r border-hairline last:border-r-0">
            <button
              type="button"
              onClick={() => onSelectDate(day)}
              className={cn(
                'flex h-10 w-full items-center justify-center border-b border-hairline text-sm font-medium text-ink-primary',
                'hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset',
                isToday && 'bg-accent-wash',
              )}
            >
              {dayHeaderFormatter.format(day)}
            </button>
            <div className="space-y-1.5 p-2">
              {dayAppointments.length === 0 ? (
                <p className="px-1 text-2xs text-ink-secondary">No appointments</p>
              ) : (
                dayAppointments.map((appointment) => {
                  const type = appointmentTypes?.find((t) => t.id === appointment.appointmentTypeId);
                  const isResolved = appointment.status === 'cancelled' || appointment.status === 'no_show';
                  return (
                    <button
                      key={appointment.id}
                      type="button"
                      onClick={() => setSelectedAppointment(appointment)}
                      style={{ borderLeftColor: type?.colorHex ?? '#94A3B8' }}
                      className={cn(
                        'block w-full rounded-md border-l-4 bg-surface-raised px-2 py-1 text-left text-2xs',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                        isResolved && 'opacity-50',
                      )}
                    >
                      <p className={cn('truncate font-medium text-ink-primary', appointment.status === 'cancelled' && 'line-through')}>
                        {formatTime(appointment.startTime)} {patientName(appointment.patientId)}
                      </p>
                      <p className="truncate text-ink-secondary">{type?.name ?? 'Appointment'}</p>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        );
      })}

      <AppointmentDetailDialog
        open={selectedAppointment !== null}
        onOpenChange={(next) => {
          if (!next) setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onChanged={() => refetch()}
      />
    </div>
  );
}
