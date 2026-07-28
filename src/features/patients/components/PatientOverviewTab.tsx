import { useState } from 'react';
import type { Patient, PatientMedicalHistory, ToothSurface } from '@/data/types';
import { useTreatmentsForPatient } from '@/data/hooks';
import { Odontogram } from '../odontogram/Odontogram';
import { ToothDetailDialog } from './ToothDetailDialog';
import { QueryState } from './QueryState';
import { Badge } from '@/components/ui';

interface PatientOverviewTabProps {
  patient: Patient;
  medicalHistory: PatientMedicalHistory | null;
}

export function PatientOverviewTab({ patient, medicalHistory }: PatientOverviewTabProps) {
  const { data: treatments, isLoading, error, refetch } = useTreatmentsForPatient(patient.id);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedSurface, setSelectedSurface] = useState<ToothSurface | null>(null);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-heading text-base font-semibold text-ink-primary">Dental chart</h2>
        <div className="mt-3">
          <QueryState isLoading={isLoading} error={error} isEmpty={false} emptyMessage="">
            <Odontogram
              treatments={treatments ?? []}
              onSelectTooth={(tooth) => {
                setSelectedTooth(tooth);
                setSelectedSurface(null);
              }}
              onSelectSurface={(tooth, surface) => {
                setSelectedTooth(tooth);
                setSelectedSurface(surface);
              }}
            />
          </QueryState>
        </div>
      </section>

      <section>
        <h2 className="font-heading text-base font-semibold text-ink-primary">Medical history</h2>
        {medicalHistory ? (
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-ink-secondary">Current medications</dt>
              <dd className="font-medium text-ink-primary">
                {medicalHistory.currentMedications.length > 0 ? medicalHistory.currentMedications.join(', ') : 'None reported'}
              </dd>
            </div>
            <div>
              <dt className="text-ink-secondary">Medical conditions</dt>
              <dd className="font-medium text-ink-primary">
                {medicalHistory.medicalConditions.length > 0 ? medicalHistory.medicalConditions.join(', ') : 'None reported'}
              </dd>
            </div>
            <div>
              <dt className="text-ink-secondary">Tobacco / alcohol use</dt>
              <dd className="font-medium text-ink-primary">
                {medicalHistory.tobaccoUse ? 'Tobacco user' : 'No tobacco use'} ·{' '}
                {medicalHistory.alcoholUse ? 'Alcohol use' : 'No alcohol use'}
              </dd>
            </div>
            <div>
              <dt className="text-ink-secondary">Last exam / cleaning</dt>
              <dd className="font-medium text-ink-primary">
                {medicalHistory.lastExamDate ?? '—'} / {medicalHistory.lastCleaningDate ?? '—'}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-sm text-ink-secondary">No medical history on file.</p>
        )}
        {medicalHistory?.isPregnant ? (
          <Badge tone="warning" className="mt-3">
            Pregnant — trimester {medicalHistory.pregnancyTrimester}
          </Badge>
        ) : null}
      </section>

      <ToothDetailDialog
        patient={patient}
        toothNumber={selectedTooth}
        initialSurface={selectedSurface}
        treatments={treatments ?? []}
        onClose={() => setSelectedTooth(null)}
        onTreatmentCreated={refetch}
      />
    </div>
  );
}
