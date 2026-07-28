import { repository } from '@/data';
import { useRepositoryQuery } from './useRepositoryQuery';
import type { PatientFilters } from '@/data/repository';
import type { Patient, PatientAddress, PatientMedicalHistory, PatientInsurance, InsuranceProvider } from '@/data/types';

export function usePatients(filters: PatientFilters = {}) {
  return useRepositoryQuery<Patient[]>(
    () => repository.listPatients(filters),
    [filters.search ?? '', filters.status ?? '', filters.tag ?? ''],
    [],
  );
}

export function usePatient(id: string | undefined) {
  return useRepositoryQuery<Patient | null>(
    () => (id ? repository.getPatient(id) : Promise.resolve(null)),
    [id],
    null,
  );
}

export function usePatientAddress(patientId: string | undefined) {
  return useRepositoryQuery<PatientAddress | null>(
    () => (patientId ? repository.getPatientAddress(patientId) : Promise.resolve(null)),
    [patientId],
    null,
  );
}

export function usePatientMedicalHistory(patientId: string | undefined) {
  return useRepositoryQuery<PatientMedicalHistory | null>(
    () => (patientId ? repository.getPatientMedicalHistory(patientId) : Promise.resolve(null)),
    [patientId],
    null,
  );
}

export function usePatientInsurance(patientId: string | undefined) {
  return useRepositoryQuery<PatientInsurance[]>(
    () => (patientId ? repository.listPatientInsurance(patientId) : Promise.resolve([])),
    [patientId],
    [],
  );
}

export function useInsuranceProviders() {
  return useRepositoryQuery<InsuranceProvider[]>(() => repository.listInsuranceProviders(), [], []);
}
