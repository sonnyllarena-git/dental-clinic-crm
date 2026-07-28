import { repository } from '@/data';
import { useRepositoryQuery } from './useRepositoryQuery';
import type { Treatment, ClinicalNote } from '@/data/types';

export function useTreatmentsForPatient(patientId: string | undefined) {
  return useRepositoryQuery<Treatment[]>(
    () => (patientId ? repository.listTreatmentsForPatient(patientId) : Promise.resolve([])),
    [patientId],
    [],
  );
}

export function useTreatment(id: string | undefined) {
  return useRepositoryQuery<Treatment | null>(
    () => (id ? repository.getTreatment(id) : Promise.resolve(null)),
    [id],
    null,
  );
}

export function useClinicalNotesForTreatment(treatmentId: string | undefined) {
  return useRepositoryQuery<ClinicalNote[]>(
    () => (treatmentId ? repository.listClinicalNotesForTreatment(treatmentId) : Promise.resolve([])),
    [treatmentId],
    [],
  );
}

/**
 * Composed at the hook level rather than adding a repository method — the
 * fetcher can freely chain calls (patient's treatments, then each
 * treatment's notes) without the interface needing a "notes for patient"
 * join it wouldn't otherwise have a use for.
 */
export function useClinicalNotesForPatient(patientId: string | undefined) {
  return useRepositoryQuery<ClinicalNote[]>(
    async () => {
      if (!patientId) return [];
      const treatments = await repository.listTreatmentsForPatient(patientId);
      const notesPerTreatment = await Promise.all(
        treatments.map((t) => repository.listClinicalNotesForTreatment(t.id)),
      );
      return notesPerTreatment.flat();
    },
    [patientId],
    [],
  );
}
