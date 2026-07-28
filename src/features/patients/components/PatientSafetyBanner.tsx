import { AlertTriangle } from 'lucide-react';
import type { Patient, PatientMedicalHistory } from '@/data/types';
import { ageAt } from '@/data/demoClock';
import { accentColorFromId } from '@/lib/colorFromId';
import { Badge } from '@/components/ui';

interface PatientSafetyBannerProps {
  patient: Patient;
  medicalHistory: PatientMedicalHistory | null;
}

/**
 * Pinned to the top of the chart at all times (sticky within the app
 * shell's scrolling content area, never inside a further-nested scroll
 * container) — identity and allergy status must never require scrolling
 * to see. The accent rail matches the same patient-id-derived color as
 * this patient's workspace tab, so a tab switch is visible peripherally.
 */
export function PatientSafetyBanner({ patient, medicalHistory }: PatientSafetyBannerProps) {
  const age = ageAt(patient.dateOfBirth);
  const allergies = medicalHistory?.allergies ?? [];
  const hasAllergies = allergies.length > 0;
  const accentColor = accentColorFromId(patient.id);
  const fullName = [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ');
  const shortId = patient.id.replace(/^patient_/, '').slice(0, 8);

  return (
    <div
      className="sticky top-0 z-20 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-hairline bg-surface-base py-3 pl-4 pr-4"
      style={{ borderLeftWidth: 3, borderLeftColor: accentColor, borderLeftStyle: 'solid' }}
    >
      <div>
        <h1 className="font-heading text-lg font-semibold text-ink-primary">{fullName}</h1>
        <p className="font-mono text-xs text-ink-secondary">
          DOB {patient.dateOfBirth} · Age {age} · ID {shortId}
        </p>
      </div>

      {hasAllergies ? (
        <Badge tone="danger" className="gap-1.5 py-1">
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
          <span>Allergies: {allergies.join(', ')}</span>
        </Badge>
      ) : (
        <Badge tone="neutral">No known allergies</Badge>
      )}

      {medicalHistory?.isAnxious ? <Badge tone="warning">Anxious patient</Badge> : null}
    </div>
  );
}
