/**
 * Mirrors `clinics` / `clinic_settings` in DENTAL_CRM_DATABASE_SCHEMA.sql,
 * with the PH locale corrections flagged in Stage 0:
 * - `address.province` replaces the schema's `address_state VARCHAR(2)`
 *   (PH provinces exceed 2 characters).
 * - `address.barangay` is a new field the original schema doesn't have.
 * - `currency`/`timezone` default to PHP / Asia/Manila, not USD / America/New_York.
 */
export interface ClinicAddress {
  street: string;
  barangay: string;
  city: string;
  province: string;
  zipCode: string;
  country: string;
}

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  address: ClinicAddress;
  phone: string;
  email: string | null;
  timezone: string;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicSettings {
  id: string;
  clinicId: string;
  defaultAppointmentDurationMinutes: number;
  businessHoursStart: string; // "09:00"
  businessHoursEnd: string; // "18:00"
  /** 1 = Monday ... 7 = Sunday. */
  workingDays: number[];
  autoSendAppointmentReminders: boolean;
  reminderBeforeMinutes: number;
  maxAdvanceBookingDays: number;
  requireNewPatientForm: boolean;
  telemedicineEnabled: boolean;
}
