import Dexie, { type Table } from 'dexie';
import type {
  Clinic,
  ClinicSettings,
  StaffUser,
  Patient,
  PatientAddress,
  PatientMedicalHistory,
  InsuranceProvider,
  PatientInsurance,
  AppointmentType,
  Appointment,
  Treatment,
  ClinicalNote,
  Invoice,
  Payment,
  InventorySupplier,
  InventoryItem,
  AuditLogEntry,
} from './types';

interface MetaRow {
  key: string;
  value: string;
}

/**
 * One table per entity, indexed on whatever LocalRepository actually
 * queries by (see repository.ts). This is the only file that changes if
 * an index needs adding later — the schema is Dexie-specific and has no
 * equivalent once a real API lands (see src/data/README.md).
 */
export class DentalCrmDatabase extends Dexie {
  clinics!: Table<Clinic, string>;
  clinicSettings!: Table<ClinicSettings, string>;
  users!: Table<StaffUser, string>;
  patients!: Table<Patient, string>;
  patientAddresses!: Table<PatientAddress, string>;
  medicalHistories!: Table<PatientMedicalHistory, string>;
  insuranceProviders!: Table<InsuranceProvider, string>;
  patientInsurance!: Table<PatientInsurance, string>;
  appointmentTypes!: Table<AppointmentType, string>;
  appointments!: Table<Appointment, string>;
  treatments!: Table<Treatment, string>;
  clinicalNotes!: Table<ClinicalNote, string>;
  invoices!: Table<Invoice, string>;
  payments!: Table<Payment, string>;
  inventorySuppliers!: Table<InventorySupplier, string>;
  inventoryItems!: Table<InventoryItem, string>;
  auditLog!: Table<AuditLogEntry, string>;
  meta!: Table<MetaRow, string>;

  constructor() {
    super('dental-clinic-crm');
    this.version(1).stores({
      clinics: 'id',
      clinicSettings: 'id, clinicId',
      users: 'id, clinicId, role',
      patients: 'id, clinicId, lastName, status',
      patientAddresses: 'id, patientId',
      medicalHistories: 'patientId',
      insuranceProviders: 'id, clinicId',
      patientInsurance: 'id, patientId, insuranceProviderId',
      appointmentTypes: 'id, clinicId',
      appointments: 'id, clinicId, patientId, providerId, startTime, status',
      treatments: 'id, clinicId, patientId, appointmentId, status',
      clinicalNotes: 'id, treatmentId',
      invoices: 'id, clinicId, patientId, status, dueDate',
      payments: 'id, invoiceId, patientId',
      inventorySuppliers: 'id, clinicId',
      inventoryItems: 'id, clinicId, category',
      auditLog: 'id, clinicId, resourceType, createdAt',
      meta: 'key',
    });
  }
}

export const db = new DentalCrmDatabase();
