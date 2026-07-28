import { repository } from '@/data';
import { useRepositoryQuery } from './useRepositoryQuery';
import { useScenarioStore } from '@/store/scenario.store';
import { REFERENCE_DATE, dateAtDayOffset, toIsoDateTime } from '@/data/demoClock';
import { applyBusyMondayOverlay } from '@/data/scenarios/overlays';
import type { AppointmentRange, AppointmentFilters } from '@/data/repository';
import type { Appointment, AppointmentType } from '@/data/types';

export function useAppointmentTypes() {
  return useRepositoryQuery<AppointmentType[]>(() => repository.listAppointmentTypes(), [], []);
}

export function useAppointments(range: AppointmentRange, filters: AppointmentFilters = {}) {
  const scenario = useScenarioStore((s) => s.scenario);

  const fetcher = async (): Promise<Appointment[]> => {
    const appointments = await repository.listAppointments(range, filters);
    if (scenario !== 'busy-monday') return appointments;

    const todayIso = REFERENCE_DATE.toISOString().slice(0, 10);
    if (todayIso < range.start.slice(0, 10) || todayIso > range.end.slice(0, 10)) return appointments;

    // A caller viewing a narrow range (e.g. just today) wouldn't otherwise
    // have anything to clone from, so busy-monday always pulls its own
    // wide donor pool independent of what the caller actually asked for.
    const donorPool = await repository.listAppointments({
      start: toIsoDateTime(dateAtDayOffset(-90)),
      end: toIsoDateTime(dateAtDayOffset(30)),
    });
    return applyBusyMondayOverlay(appointments, donorPool, todayIso, scenario);
  };

  return useRepositoryQuery<Appointment[]>(
    fetcher,
    [range.start, range.end, filters.patientId ?? '', filters.providerId ?? '', filters.status ?? '', scenario],
    [],
  );
}

export function useAppointmentsForPatient(patientId: string | undefined) {
  return useRepositoryQuery<Appointment[]>(
    () => (patientId ? repository.listAppointmentsForPatient(patientId) : Promise.resolve([])),
    [patientId],
    [],
  );
}

export function useAppointment(id: string | undefined) {
  return useRepositoryQuery<Appointment | null>(
    () => (id ? repository.getAppointment(id) : Promise.resolve(null)),
    [id],
    null,
  );
}
