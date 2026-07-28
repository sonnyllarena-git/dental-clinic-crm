export type PatientStatus = 'active' | 'inactive' | 'transferred' | 'deceased';
export type Gender = 'M' | 'F' | 'O' | 'Prefer not to say';
export type PreferredContactMethod = 'phone' | 'email' | 'sms';

/** Mirrors `patient_addresses`, with `province`/`barangay` per the PH correction in clinic.ts. */
export interface PatientAddress {
  id: string;
  patientId: string;
  addressType: 'home' | 'work' | 'billing';
  street: string;
  barangay: string;
  city: string;
  province: string;
  zipCode: string;
  country: string;
  isPrimary: boolean;
}

export interface Patient {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  dateOfBirth: string; // YYYY-MM-DD
  gender: Gender | null;
  phone: string | null;
  email: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  status: PatientStatus;
  preferredContactMethod: PreferredContactMethod;
  prefersSmsReminders: boolean;
  prefersEmailReminders: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Mirrors `patient_medical_history`. `allergies`/`currentMedications`/
 * `medicalConditions` are modeled as string arrays — the schema comment
 * explicitly allows "Comma-separated or JSONB array", and an array is what
 * every consuming component actually wants.
 */
export interface PatientMedicalHistory {
  patientId: string;
  allergies: string[];
  currentMedications: string[];
  medicalConditions: string[];
  surgeries: string | null;
  brushFrequency: string | null;
  flossFrequency: string | null;
  mouthwashFrequency: string | null;
  tobaccoUse: boolean;
  alcoholUse: boolean;
  isPregnant: boolean;
  pregnancyTrimester: number | null;
  lastExamDate: string | null;
  lastCleaningDate: string | null;
  isAnxious: boolean;
  dentalAnxietyNotes: string | null;
  prefersNitrousOxide: boolean;
}
