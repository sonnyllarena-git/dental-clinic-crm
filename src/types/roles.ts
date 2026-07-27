/**
 * Mirrors the `user_role` enum in DENTAL_CRM_DATABASE_SCHEMA.sql (minus the
 * Phase 2 `patient` role, which has no staff-facing UI in this build).
 */
export const ROLES = ['admin', 'clinic_manager', 'dentist', 'hygienist', 'receptionist'] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  clinic_manager: 'Clinic Manager',
  dentist: 'Dentist',
  hygienist: 'Hygienist',
  receptionist: 'Receptionist',
};
