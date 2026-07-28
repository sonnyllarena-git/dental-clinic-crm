import type {
  Clinic,
  ClinicSettings,
  StaffUser,
  Patient,
  PatientAddress,
  PatientMedicalHistory,
  PatientStatus,
  InsuranceProvider,
  PatientInsurance,
  AppointmentType,
  Appointment,
  AppointmentStatus,
  Treatment,
  ClinicalNote,
  Invoice,
  InvoiceLineItem,
  InvoiceStatus,
  Payment,
  InventorySupplier,
  InventoryItem,
  AuditLogEntry,
} from './types';

export interface PatientFilters {
  search?: string;
  status?: PatientStatus;
  tag?: string;
}

/** ISO datetime bounds — start inclusive, end exclusive. */
export interface AppointmentRange {
  start: string;
  end: string;
}

export interface AppointmentFilters {
  patientId?: string;
  providerId?: string;
  status?: AppointmentStatus;
}

export interface InvoiceFilters {
  patientId?: string;
  status?: InvoiceStatus;
}

export interface InventoryFilters {
  category?: string;
  belowReorderOnly?: boolean;
}

/** YYYY-MM-DD bounds, inclusive. */
export interface ReportRange {
  start: string;
  end: string;
}

export interface ReportMetrics {
  totalRevenue: number;
  invoiceCount: number;
  paidInvoiceCount: number;
  overdueInvoiceCount: number;
  appointmentCount: number;
  completedAppointmentCount: number;
  noShowCount: number;
  cancelledCount: number;
  showRatePercent: number;
  revenueByMonth: { month: string; revenue: number }[];
  appointmentsByProvider: { providerId: string; count: number }[];
}

export type NewPatientInput = Omit<Patient, 'id' | 'clinicId' | 'createdAt' | 'updatedAt'>;

export type NewAppointmentInput = Omit<
  Appointment,
  'id' | 'clinicId' | 'createdAt' | 'confirmedAt' | 'cancelledAt' | 'cancelReason' | 'noShowReason' | 'rescheduledToAppointmentId'
>;

export type NewTreatmentInput = Omit<Treatment, 'id' | 'clinicId' | 'createdAt'>;

export type NewClinicalNoteInput = Omit<ClinicalNote, 'id' | 'clinicId' | 'createdAt'>;

export type NewInvoiceInput = Omit<Invoice, 'id' | 'clinicId' | 'sentAt' | 'viewedAt' | 'lineItems'> & {
  lineItems: Omit<InvoiceLineItem, 'id' | 'invoiceId'>[];
};

export type NewPaymentInput = Omit<Payment, 'id' | 'clinicId' | 'createdAt' | 'refund'>;

/**
 * The one boundary between every component and "where data comes from."
 * `LocalRepository` (Dexie/IndexedDB) is the only implementation today; a
 * future `ApiRepository` implements this exact interface against a real
 * backend with no changes required anywhere else. See src/data/README.md.
 *
 * `actingUserId` on mutating methods is who to attribute the resulting
 * audit-log entry to. It's optional and caller-supplied here because this
 * build stubs auth; a real API infers the actor from the authenticated
 * request instead and the parameter disappears entirely.
 */
export interface Repository {
  getClinic(): Promise<Clinic>;
  getClinicSettings(): Promise<ClinicSettings>;

  listUsers(): Promise<StaffUser[]>;
  getUser(id: string): Promise<StaffUser | null>;

  listPatients(filters?: PatientFilters): Promise<Patient[]>;
  getPatient(id: string): Promise<Patient | null>;
  createPatient(input: NewPatientInput, actingUserId?: string): Promise<Patient>;
  updatePatient(id: string, patch: Partial<Patient>, actingUserId?: string): Promise<Patient>;
  getPatientAddress(patientId: string): Promise<PatientAddress | null>;
  getPatientMedicalHistory(patientId: string): Promise<PatientMedicalHistory | null>;
  updateMedicalHistory(
    patientId: string,
    patch: Partial<PatientMedicalHistory>,
    actingUserId?: string,
  ): Promise<PatientMedicalHistory>;

  listInsuranceProviders(): Promise<InsuranceProvider[]>;
  listPatientInsurance(patientId: string): Promise<PatientInsurance[]>;

  listAppointmentTypes(): Promise<AppointmentType[]>;
  listAppointments(range: AppointmentRange, filters?: AppointmentFilters): Promise<Appointment[]>;
  listAppointmentsForPatient(patientId: string): Promise<Appointment[]>;
  getAppointment(id: string): Promise<Appointment | null>;
  createAppointment(input: NewAppointmentInput, actingUserId?: string): Promise<Appointment>;
  updateAppointment(id: string, patch: Partial<Appointment>, actingUserId?: string): Promise<Appointment>;
  cancelAppointment(id: string, reason: string, actingUserId?: string): Promise<Appointment>;

  listTreatmentsForPatient(patientId: string): Promise<Treatment[]>;
  getTreatment(id: string): Promise<Treatment | null>;
  createTreatment(input: NewTreatmentInput, actingUserId?: string): Promise<Treatment>;
  updateTreatment(id: string, patch: Partial<Treatment>, actingUserId?: string): Promise<Treatment>;
  listClinicalNotesForTreatment(treatmentId: string): Promise<ClinicalNote[]>;
  createClinicalNote(input: NewClinicalNoteInput, actingUserId?: string): Promise<ClinicalNote>;

  listInvoices(filters?: InvoiceFilters): Promise<Invoice[]>;
  listInvoicesForPatient(patientId: string): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | null>;
  createInvoice(input: NewInvoiceInput, actingUserId?: string): Promise<Invoice>;
  updateInvoice(id: string, patch: Partial<Invoice>, actingUserId?: string): Promise<Invoice>;
  listPaymentsForInvoice(invoiceId: string): Promise<Payment[]>;
  recordPayment(input: NewPaymentInput, actingUserId?: string): Promise<Payment>;

  listInventorySuppliers(): Promise<InventorySupplier[]>;
  listInventoryItems(filters?: InventoryFilters): Promise<InventoryItem[]>;
  getInventoryItem(id: string): Promise<InventoryItem | null>;
  updateInventoryItem(id: string, patch: Partial<InventoryItem>, actingUserId?: string): Promise<InventoryItem>;
  adjustInventoryQuantity(id: string, delta: number, actingUserId?: string): Promise<InventoryItem>;

  getReportMetrics(range: ReportRange): Promise<ReportMetrics>;

  listAuditLog(filters?: { resourceType?: string; resourceId?: string }): Promise<AuditLogEntry[]>;

  /** Wipes local persistence and rebuilds it from the seed generator. No equivalent once a real API lands. */
  resetAndReseed(): Promise<void>;
}
