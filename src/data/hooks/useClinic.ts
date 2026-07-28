import { repository } from '@/data';
import { useRepositoryQuery } from './useRepositoryQuery';
import type { Clinic, ClinicSettings, StaffUser } from '@/data/types';

export function useClinic() {
  return useRepositoryQuery<Clinic | undefined>(() => repository.getClinic(), [], undefined);
}

export function useClinicSettings() {
  return useRepositoryQuery<ClinicSettings | undefined>(() => repository.getClinicSettings(), [], undefined);
}

export function useUsers() {
  return useRepositoryQuery<StaffUser[]>(() => repository.listUsers(), [], []);
}

export function useUser(id: string | undefined) {
  return useRepositoryQuery<StaffUser | null>(
    () => (id ? repository.getUser(id) : Promise.resolve(null)),
    [id],
    null,
  );
}
