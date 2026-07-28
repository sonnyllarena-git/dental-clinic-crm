import { useAppointments, useAppointmentTypes } from '@/data/hooks';
import { atTime, dateAtDayOffset, isoWeekday, toIsoDate, toIsoDateTime } from '@/data/demoClock';
import { cn } from '@/lib/cn';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_DOTS_PER_DAY = 4;

const weekdayHeaderLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface MonthViewProps {
  /** Any date within the month to display (UTC-date-anchored, representing a PH calendar date). */
  monthAnchor: Date;
  onSelectDate: (date: Date) => void;
}

/** First day of the calendar grid: the Monday on or before the 1st of the month. */
function gridStartFor(monthAnchor: Date): Date {
  const firstOfMonth = new Date(Date.UTC(monthAnchor.getUTCFullYear(), monthAnchor.getUTCMonth(), 1));
  const weekday = isoWeekday(firstOfMonth); // 1 = Monday
  return new Date(firstOfMonth.getTime() - (weekday - 1) * MS_PER_DAY);
}

export function MonthView({ monthAnchor, onSelectDate }: MonthViewProps) {
  const gridStart = gridStartFor(monthAnchor);
  const gridEnd = new Date(gridStart.getTime() + 42 * MS_PER_DAY);
  const monthRange = { start: toIsoDateTime(atTime(gridStart, 0, 0)), end: toIsoDateTime(atTime(gridEnd, 0, 0)) };
  const { data: appointments } = useAppointments(monthRange);
  const { data: appointmentTypes } = useAppointmentTypes();

  const todayIsoDate = toIsoDate(dateAtDayOffset(0));
  const targetMonth = monthAnchor.getUTCMonth();
  const days = Array.from({ length: 42 }, (_, i) => new Date(gridStart.getTime() + i * MS_PER_DAY));

  function appointmentsOnDay(day: Date) {
    const dayStart = atTime(day, 0, 0).getTime();
    const dayEnd = atTime(day, 24, 0).getTime();
    return (appointments ?? []).filter((a) => {
      const t = new Date(a.startTime).getTime();
      return t >= dayStart && t < dayEnd;
    });
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="grid grid-cols-7 border-b border-hairline text-2xs font-medium text-ink-secondary">
        {weekdayHeaderLabels.map((label) => (
          <div key={label} className="px-2 py-1.5 text-center">
            {label}
          </div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7 grid-rows-6">
        {days.map((day) => {
          const inMonth = day.getUTCMonth() === targetMonth;
          const isToday = toIsoDate(day) === todayIsoDate;
          const dayAppointments = appointmentsOnDay(day);
          const visibleTypeColors = Array.from(
            new Set(
              dayAppointments
                .map((a) => appointmentTypes?.find((t) => t.id === a.appointmentTypeId)?.colorHex)
                .filter((c): c is string => Boolean(c)),
            ),
          ).slice(0, MAX_DOTS_PER_DAY);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDate(day)}
              className={cn(
                'flex flex-col items-start gap-1 border-b border-r border-hairline p-2 text-left',
                'hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset',
                !inMonth && 'bg-surface-sunken/50 text-ink-secondary',
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-xs',
                  isToday ? 'bg-accent font-semibold text-white' : 'text-ink-primary',
                  !inMonth && 'text-ink-secondary',
                )}
              >
                {day.getUTCDate()}
              </span>
              {dayAppointments.length > 0 ? (
                <>
                  <span className="text-2xs text-ink-secondary">
                    {dayAppointments.length} appt{dayAppointments.length === 1 ? '' : 's'}
                  </span>
                  <span className="flex gap-1">
                    {visibleTypeColors.map((color) => (
                      <span key={color} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
                    ))}
                  </span>
                </>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
