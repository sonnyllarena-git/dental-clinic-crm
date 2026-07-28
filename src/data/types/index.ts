export * from './clinic';
export * from './user';
export * from './patient';
export * from './insurance';
export * from './scheduling';
export * from './clinical';
export * from './billing';
export * from './inventory';
export * from './auditLog';

import type { Clinic, ClinicSettings } from './clinic';
import type { StaffUser } from './user';
import type { Patient, PatientAddress, PatientMedicalHistory } from './patient';
import type { InsuranceProvider, PatientInsurance } from './insurance';
import type { AppointmentType, Appointment } from './scheduling';
import type { Treatment, ClinicalNote } from './clinical';
import type { Invoice, Payment } from './billing';
import type { InventorySupplier, InventoryItem } from './inventory';
import type { AuditLogEntry } from './auditLog';

/** The full output of buildSeedDataset() — one clinic's worth of mock data. */
export interface SeedDataset {
  clinic: Clinic;
  clinicSettings: ClinicSettings;
  users: StaffUser[];
  appointmentTypes: AppointmentType[];
  patients: Patient[];
  patientAddresses: PatientAddress[];
  medicalHistories: PatientMedicalHistory[];
  insuranceProviders: InsuranceProvider[];
  patientInsurance: PatientInsurance[];
  appointments: Appointment[];
  treatments: Treatment[];
  clinicalNotes: ClinicalNote[];
  invoices: Invoice[];
  payments: Payment[];
  inventorySuppliers: InventorySupplier[];
  inventoryItems: InventoryItem[];
  auditLog: AuditLogEntry[];
}
