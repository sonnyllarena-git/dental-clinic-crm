export type TreatmentStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';

/**
 * FDI/Universal tooth numbering as described in the approved schema's own
 * column comment (1-32, quadrant-ordered) — the brief's odontogram spec
 * uses the same 1-32 range, so generators and the future UI agree.
 */
export type ToothSurface = 'M' | 'D' | 'O' | 'I' | 'L' | 'F';

export interface Treatment {
  id: string;
  clinicId: string;
  patientId: string;
  appointmentId: string | null;
  procedureCode: string;
  procedureName: string;
  toothNumber: number | null;
  surface: ToothSurface | null;
  status: TreatmentStatus;
  startedAt: string | null;
  completedAt: string | null;
  diagnosis: string | null;
  treatmentPlan: string | null;
  estimatedCost: number;
  actualCost: number | null;
  dentistId: string;
  hygienistId: string | null;
  followUpRequired: boolean;
  followUpDate: string | null;
  createdAt: string;
}

export interface ClinicalNote {
  id: string;
  clinicId: string;
  treatmentId: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  providerId: string;
  createdAt: string;
}
