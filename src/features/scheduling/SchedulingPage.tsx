import { useState } from 'react';
import { dateAtDayOffset, isoWeekday } from '@/data/demoClock';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { DayView } from './components/DayView';
import { WeekView } from './components/WeekView';
import { MonthView } from './components/MonthView';
import { NewAppointmentDialog } from './components/NewAppointmentDialog';

type CalendarView = 'day' | 'week' | 'month';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const VIEW_OPTIONS: { value: CalendarView; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

const dayLabelFormatter = new Intl.DateTimeFormat('en-PH', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

const weekRangeFormatter = new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', timeZone: 'UTC' });

const monthLabelFormatter = new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric', timeZone: 'UTC' });

function weekStartFor(date: Date): Date {
  const weekday = isoWeekday(date); // 1 = Monday ... 7 = Sunday
  return new Date(date.getTime() - (weekday - 1) * MS_PER_DAY);
}

export function SchedulingPage() {
  const [view, setView] = useState<CalendarView>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(() => dateAtDayOffset(0));
  const [isBooking, setIsBooking] = useState(false);
  // Bumped after a toolbar-level booking to force the active view (which
  // owns its own useAppointments fetch) to remount and refetch — the views
  // have no other way to learn about a mutation made outside their own
  // dialogs.
  const [refreshKey, setRefreshKey] = useState(0);

  function goToToday(): void {
    setSelectedDate(dateAtDayOffset(0));
  }

  function step(direction: 1 | -1): void {
    setSelectedDate((current) => {
      if (view === 'day') return new Date(current.getTime() + direction * MS_PER_DAY);
      if (view === 'week') return new Date(current.getTime() + direction * 7 * MS_PER_DAY);
      return new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + direction, current.getUTCDate()));
    });
  }

  function handleSelectDate(date: Date): void {
    setSelectedDate(date);
    setView('day');
  }

  const weekStart = weekStartFor(selectedDate);
  const weekEnd = new Date(weekStart.getTime() + 5 * MS_PER_DAY);
  const rangeLabel =
    view === 'day'
      ? dayLabelFormatter.format(selectedDate)
      : view === 'week'
        ? `${weekRangeFormatter.format(weekStart)} – ${weekRangeFormatter.format(weekEnd)}, ${selectedDate.getUTCFullYear()}`
        : monthLabelFormatter.format(selectedDate);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline p-4">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-xl font-semibold text-ink-primary">Schedule</h1>
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="sm" onClick={() => step(-1)} aria-label="Previous">
              ‹
            </Button>
            <Button variant="secondary" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="secondary" size="sm" onClick={() => step(1)} aria-label="Next">
              ›
            </Button>
          </div>
          <span className="text-sm text-ink-secondary">{rangeLabel}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-md border border-hairline p-0.5">
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setView(option.value)}
                className={cn(
                  'rounded px-3 py-1 text-sm font-medium text-ink-secondary',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  view === option.value && 'bg-surface-sunken text-ink-primary',
                )}
                aria-pressed={view === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Button onClick={() => setIsBooking(true)}>New appointment</Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {view === 'day' ? <DayView key={`day-${refreshKey}`} date={selectedDate} /> : null}
        {view === 'week' ? (
          <WeekView key={`week-${refreshKey}`} weekStart={weekStart} onSelectDate={handleSelectDate} />
        ) : null}
        {view === 'month' ? (
          <MonthView key={`month-${refreshKey}`} monthAnchor={selectedDate} onSelectDate={handleSelectDate} />
        ) : null}
      </div>

      <NewAppointmentDialog
        open={isBooking}
        onOpenChange={setIsBooking}
        initialDate={selectedDate}
        onCreated={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
