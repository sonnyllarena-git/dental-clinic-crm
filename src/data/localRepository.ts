import { db } from './db';
import { buildSeedDataset, SEED } from './seed';
import type {
  Repository,
  PatientFilters,
  AppointmentRange,
  AppointmentFilters,
  InvoiceFilters,
  InventoryFilters,
  ReportRange,
  ReportMetrics,
  NewPatientInput,
  NewAppointmentInput,
  NewTreatmentInput,
  NewClinicalNoteInput,
  NewInvoiceInput,
  NewPaymentInput,
} from './repository';
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
  AuditAction,
} from './types';

const SEED_VERSION_KEY = 'seedVersion';

/** Real randomness/real clock — correct here, unlike inside src/data/seed/,
 * because this path only runs for live user actions after the app is
 * running, never for building the reproducible initial dataset. */
function newId(): string {
  return crypto.randomUUID();
}
function nowIso(): string {
  return new Date().toISOString();
}

const ALL_TABLES = [
  db.clinics,
  db.clinicSettings,
  db.users,
  db.patients,
  db.patientAddresses,
  db.medicalHistories,
  db.insuranceProviders,
  db.patientInsurance,
  db.appointmentTypes,
  db.appointments,
  db.treatments,
  db.clinicalNotes,
  db.invoices,
  db.payments,
  db.inventorySuppliers,
  db.inventoryItems,
  db.auditLog,
  db.meta,
];

export class LocalRepository implements Repository {
  private seedingPromise: Promise<void> | null = null;

  private async ensureSeeded(): Promise<void> {
    if (!this.seedingPromise) {
      this.seedingPromise = this.seed(false);
    }
    await this.seedingPromise;
  }

  private async seed(force: boolean): Promise<void> {
    if (!force) {
      const meta = await db.meta.get(SEED_VERSION_KEY);
      const patientCount = await db.patients.count();
      // Reseeds automatically if the seed generator's SEED constant ever
      // changes, so a code update doesn't leave existing browsers stuck
      // with a stale dataset.
      if (meta?.value === SEED && patientCount > 0) return;
    }

    const dataset = buildSeedDataset();
    await db.transaction('rw', ALL_TABLES, async () => {
      await Promise.all(ALL_TABLES.map((table) => table.clear()));
      await Promise.all([
        db.clinics.add(dataset.clinic),
        db.clinicSettings.add(dataset.clinicSettings),
        db.users.bulkAdd(dataset.users),
        db.patients.bulkAdd(dataset.patients),
        db.patientAddresses.bulkAdd(dataset.patientAddresses),
        db.medicalHistories.bulkAdd(dataset.medicalHistories),
        db.insuranceProviders.bulkAdd(dataset.insuranceProviders),
        db.patientInsurance.bulkAdd(dataset.patientInsurance),
        db.appointmentTypes.bulkAdd(dataset.appointmentTypes),
        db.appointments.bulkAdd(dataset.appointments),
        db.treatments.bulkAdd(dataset.treatments),
        db.clinicalNotes.bulkAdd(dataset.clinicalNotes),
        db.invoices.bulkAdd(dataset.invoices),
        db.payments.bulkAdd(dataset.payments),
        db.inventorySuppliers.bulkAdd(dataset.inventorySuppliers),
        db.inventoryItems.bulkAdd(dataset.inventoryItems),
        db.auditLog.bulkAdd(dataset.auditLog),
      ]);
      await db.meta.put({ key: SEED_VERSION_KEY, value: SEED });
    });
  }

  private async recordAudit(
    action: AuditAction,
    resourceType: string,
    resourceId: string,
    actingUserId: string | undefined,
    isSensitiveData: boolean,
    changes?: string,
  ): Promise<void> {
    const clinic = await this.getClinic();
    const entry: AuditLogEntry = {
      id: newId(),
      clinicId: clinic.id,
      userId: actingUserId ?? null,
      action,
      resourceType,
      resourceId,
      changes: changes ?? null,
      isSensitiveData,
      createdAt: nowIso(),
    };
    await db.auditLog.add(entry);
  }

  async getClinic(): Promise<Clinic> {
    await this.ensureSeeded();
    const clinic = await db.clinics.toCollection().first();
    if (!clinic) throw new Error('Clinic not seeded');
    return clinic;
  }

  async getClinicSettings(): Promise<ClinicSettings> {
    await this.ensureSeeded();
    const settings = await db.clinicSettings.toCollection().first();
    if (!settings) throw new Error('Clinic settings not seeded');
    return settings;
  }

  async listUsers(): Promise<StaffUser[]> {
    await this.ensureSeeded();
    return db.users.toArray();
  }

  async getUser(id: string): Promise<StaffUser | null> {
    await this.ensureSeeded();
    return (await db.users.get(id)) ?? null;
  }

  async listPatients(filters: PatientFilters = {}): Promise<Patient[]> {
    await this.ensureSeeded();
    let patients = await db.patients.toArray();
    if (filters.status) patients = patients.filter((p) => p.status === filters.status);
    if (filters.tag) {
      const tag = filters.tag;
      patients = patients.filter((p) => p.tags.includes(tag));
    }
    if (filters.search) {
      const term = filters.search.toLowerCase();
      patients = patients.filter(
        (p) =>
          `${p.firstName} ${p.middleName ?? ''} ${p.lastName}`.toLowerCase().includes(term) ||
          (p.email?.toLowerCase().includes(term) ?? false) ||
          (p.phone?.includes(term) ?? false),
      );
    }
    return patients.sort((a, b) => a.lastName.localeCompare(b.lastName));
  }

  async getPatient(id: string): Promise<Patient | null> {
    await this.ensureSeeded();
    return (await db.patients.get(id)) ?? null;
  }

  async createPatient(input: NewPatientInput, actingUserId?: string): Promise<Patient> {
    await this.ensureSeeded();
    const clinic = await this.getClinic();
    const timestamp = nowIso();
    const patient: Patient = { ...input, id: newId(), clinicId: clinic.id, createdAt: timestamp, updatedAt: timestamp };
    await db.patients.add(patient);
    await this.recordAudit('created', 'patients', patient.id, actingUserId, true);
    return patient;
  }

  async updatePatient(id: string, patch: Partial<Patient>, actingUserId?: string): Promise<Patient> {
    await this.ensureSeeded();
    const existing = await db.patients.get(id);
    if (!existing) throw new Error(`Patient ${id} not found`);
    const updated: Patient = { ...existing, ...patch, id: existing.id, updatedAt: nowIso() };
    await db.patients.put(updated);
    await this.recordAudit('updated', 'patients', id, actingUserId, true);
    return updated;
  }

  async getPatientAddress(patientId: string): Promise<PatientAddress | null> {
    await this.ensureSeeded();
    const address = await db.patientAddresses.where('patientId').equals(patientId).first();
    return address ?? null;
  }

  async getPatientMedicalHistory(patientId: string): Promise<PatientMedicalHistory | null> {
    await this.ensureSeeded();
    return (await db.medicalHistories.get(patientId)) ?? null;
  }

  async updateMedicalHistory(
    patientId: string,
    patch: Partial<PatientMedicalHistory>,
    actingUserId?: string,
  ): Promise<PatientMedicalHistory> {
    await this.ensureSeeded();
    const existing = await db.medicalHistories.get(patientId);
    if (!existing) throw new Error(`Medical history for patient ${patientId} not found`);
    const updated: PatientMedicalHistory = { ...existing, ...patch, patientId };
    await db.medicalHistories.put(updated);
    await this.recordAudit('updated', 'patient_medical_history', patientId, actingUserId, true);
    return updated;
  }

  async listInsuranceProviders(): Promise<InsuranceProvider[]> {
    await this.ensureSeeded();
    return db.insuranceProviders.toArray();
  }

  async listPatientInsurance(patientId: string): Promise<PatientInsurance[]> {
    await this.ensureSeeded();
    return db.patientInsurance.where('patientId').equals(patientId).toArray();
  }

  async listAppointmentTypes(): Promise<AppointmentType[]> {
    await this.ensureSeeded();
    return db.appointmentTypes.toArray();
  }

  async listAppointments(range: AppointmentRange, filters: AppointmentFilters = {}): Promise<Appointment[]> {
    await this.ensureSeeded();
    let appointments = await db.appointments.where('startTime').between(range.start, range.end, true, false).toArray();
    if (filters.patientId) appointments = appointments.filter((a) => a.patientId === filters.patientId);
    if (filters.providerId) appointments = appointments.filter((a) => a.providerId === filters.providerId);
    if (filters.status) appointments = appointments.filter((a) => a.status === filters.status);
    return appointments.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  async listAppointmentsForPatient(patientId: string): Promise<Appointment[]> {
    await this.ensureSeeded();
    const appointments = await db.appointments.where('patientId').equals(patientId).toArray();
    return appointments.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  async getAppointment(id: string): Promise<Appointment | null> {
    await this.ensureSeeded();
    return (await db.appointments.get(id)) ?? null;
  }

  async createAppointment(input: NewAppointmentInput, actingUserId?: string): Promise<Appointment> {
    await this.ensureSeeded();
    const clinic = await this.getClinic();
    const appointment: Appointment = {
      ...input,
      id: newId(),
      clinicId: clinic.id,
      confirmedAt: null,
      cancelledAt: null,
      cancelReason: null,
      noShowReason: null,
      rescheduledToAppointmentId: null,
      createdAt: nowIso(),
    };
    await db.appointments.add(appointment);
    await this.recordAudit('created', 'appointments', appointment.id, actingUserId, true);
    return appointment;
  }

  async updateAppointment(id: string, patch: Partial<Appointment>, actingUserId?: string): Promise<Appointment> {
    await this.ensureSeeded();
    const existing = await db.appointments.get(id);
    if (!existing) throw new Error(`Appointment ${id} not found`);
    const updated: Appointment = { ...existing, ...patch, id: existing.id };
    await db.appointments.put(updated);
    await this.recordAudit('updated', 'appointments', id, actingUserId, true);
    return updated;
  }

  async cancelAppointment(id: string, reason: string, actingUserId?: string): Promise<Appointment> {
    return this.updateAppointment(
      id,
      { status: 'cancelled', cancelledAt: nowIso(), cancelReason: reason },
      actingUserId,
    );
  }

  async listTreatmentsForPatient(patientId: string): Promise<Treatment[]> {
    await this.ensureSeeded();
    return db.treatments.where('patientId').equals(patientId).toArray();
  }

  async getTreatment(id: string): Promise<Treatment | null> {
    await this.ensureSeeded();
    return (await db.treatments.get(id)) ?? null;
  }

  async createTreatment(input: NewTreatmentInput, actingUserId?: string): Promise<Treatment> {
    await this.ensureSeeded();
    const clinic = await this.getClinic();
    const treatment: Treatment = { ...input, id: newId(), clinicId: clinic.id, createdAt: nowIso() };
    await db.treatments.add(treatment);
    await this.recordAudit('created', 'treatments', treatment.id, actingUserId, true);
    return treatment;
  }

  async updateTreatment(id: string, patch: Partial<Treatment>, actingUserId?: string): Promise<Treatment> {
    await this.ensureSeeded();
    const existing = await db.treatments.get(id);
    if (!existing) throw new Error(`Treatment ${id} not found`);
    const updated: Treatment = { ...existing, ...patch, id: existing.id };
    await db.treatments.put(updated);
    await this.recordAudit('updated', 'treatments', id, actingUserId, true);
    return updated;
  }

  async listClinicalNotesForTreatment(treatmentId: string): Promise<ClinicalNote[]> {
    await this.ensureSeeded();
    return db.clinicalNotes.where('treatmentId').equals(treatmentId).toArray();
  }

  async createClinicalNote(input: NewClinicalNoteInput, actingUserId?: string): Promise<ClinicalNote> {
    await this.ensureSeeded();
    const clinic = await this.getClinic();
    const note: ClinicalNote = { ...input, id: newId(), clinicId: clinic.id, createdAt: nowIso() };
    await db.clinicalNotes.add(note);
    await this.recordAudit('created', 'clinical_notes', note.id, actingUserId, true);
    return note;
  }

  async listInvoices(filters: InvoiceFilters = {}): Promise<Invoice[]> {
    await this.ensureSeeded();
    let invoices = await db.invoices.toArray();
    if (filters.patientId) invoices = invoices.filter((i) => i.patientId === filters.patientId);
    if (filters.status) invoices = invoices.filter((i) => i.status === filters.status);
    return invoices.sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate));
  }

  async listInvoicesForPatient(patientId: string): Promise<Invoice[]> {
    return this.listInvoices({ patientId });
  }

  async getInvoice(id: string): Promise<Invoice | null> {
    await this.ensureSeeded();
    return (await db.invoices.get(id)) ?? null;
  }

  async createInvoice(input: NewInvoiceInput, actingUserId?: string): Promise<Invoice> {
    await this.ensureSeeded();
    const clinic = await this.getClinic();
    const invoiceId = newId();
    const invoice: Invoice = {
      ...input,
      id: invoiceId,
      clinicId: clinic.id,
      sentAt: null,
      viewedAt: null,
      lineItems: input.lineItems.map((li) => ({ ...li, id: newId(), invoiceId })),
    };
    await db.invoices.add(invoice);
    await this.recordAudit('created', 'invoices', invoice.id, actingUserId, true);
    return invoice;
  }

  async updateInvoice(id: string, patch: Partial<Invoice>, actingUserId?: string): Promise<Invoice> {
    await this.ensureSeeded();
    const existing = await db.invoices.get(id);
    if (!existing) throw new Error(`Invoice ${id} not found`);
    const updated: Invoice = { ...existing, ...patch, id: existing.id };
    await db.invoices.put(updated);
    await this.recordAudit('updated', 'invoices', id, actingUserId, true);
    return updated;
  }

  async listPaymentsForInvoice(invoiceId: string): Promise<Payment[]> {
    await this.ensureSeeded();
    return db.payments.where('invoiceId').equals(invoiceId).toArray();
  }

  async recordPayment(input: NewPaymentInput, actingUserId?: string): Promise<Payment> {
    await this.ensureSeeded();
    const clinic = await this.getClinic();
    const payment: Payment = { ...input, id: newId(), clinicId: clinic.id, createdAt: nowIso(), refund: null };
    await db.payments.add(payment);

    const invoice = await db.invoices.get(input.invoiceId);
    if (invoice) {
      const amountPaid = invoice.amountPaid + input.amount;
      const amountDue = invoice.totalAmount - amountPaid;
      await db.invoices.put({
        ...invoice,
        amountPaid,
        amountDue,
        status: amountDue <= 0 ? 'paid' : 'partially_paid',
      });
    }

    await this.recordAudit('created', 'payments', payment.id, actingUserId, true);
    return payment;
  }

  async listInventorySuppliers(): Promise<InventorySupplier[]> {
    await this.ensureSeeded();
    return db.inventorySuppliers.toArray();
  }

  async listInventoryItems(filters: InventoryFilters = {}): Promise<InventoryItem[]> {
    await this.ensureSeeded();
    let items = await db.inventoryItems.toArray();
    if (filters.category) items = items.filter((i) => i.category === filters.category);
    if (filters.belowReorderOnly) items = items.filter((i) => i.currentQuantity <= i.reorderLevel);
    return items.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getInventoryItem(id: string): Promise<InventoryItem | null> {
    await this.ensureSeeded();
    return (await db.inventoryItems.get(id)) ?? null;
  }

  async updateInventoryItem(id: string, patch: Partial<InventoryItem>, actingUserId?: string): Promise<InventoryItem> {
    await this.ensureSeeded();
    const existing = await db.inventoryItems.get(id);
    if (!existing) throw new Error(`Inventory item ${id} not found`);
    const updated: InventoryItem = { ...existing, ...patch, id: existing.id };
    await db.inventoryItems.put(updated);
    await this.recordAudit('updated', 'inventory_items', id, actingUserId, false);
    return updated;
  }

  async adjustInventoryQuantity(id: string, delta: number, actingUserId?: string): Promise<InventoryItem> {
    await this.ensureSeeded();
    const existing = await db.inventoryItems.get(id);
    if (!existing) throw new Error(`Inventory item ${id} not found`);
    const updated: InventoryItem = { ...existing, currentQuantity: Math.max(0, existing.currentQuantity + delta) };
    await db.inventoryItems.put(updated);
    await this.recordAudit('updated', 'inventory_items', id, actingUserId, false, `Quantity adjusted by ${delta}`);
    return updated;
  }

  async getReportMetrics(range: ReportRange): Promise<ReportMetrics> {
    await this.ensureSeeded();
    const [invoices, appointments] = await Promise.all([db.invoices.toArray(), db.appointments.toArray()]);

    const invoicesInRange = invoices.filter((i) => i.invoiceDate >= range.start && i.invoiceDate <= range.end);
    const appointmentsInRange = appointments.filter(
      (a) => a.startTime.slice(0, 10) >= range.start && a.startTime.slice(0, 10) <= range.end,
    );

    const totalRevenue = invoicesInRange.reduce((sum, i) => sum + i.amountPaid, 0);
    const completedAppointmentCount = appointmentsInRange.filter((a) => a.status === 'completed').length;
    const noShowCount = appointmentsInRange.filter((a) => a.status === 'no_show').length;
    const cancelledCount = appointmentsInRange.filter((a) => a.status === 'cancelled').length;
    const resolvedCount = completedAppointmentCount + noShowCount;

    const revenueByMonthMap = new Map<string, number>();
    invoicesInRange.forEach((i) => {
      const month = i.invoiceDate.slice(0, 7);
      revenueByMonthMap.set(month, (revenueByMonthMap.get(month) ?? 0) + i.amountPaid);
    });

    const appointmentsByProviderMap = new Map<string, number>();
    appointmentsInRange.forEach((a) => {
      appointmentsByProviderMap.set(a.providerId, (appointmentsByProviderMap.get(a.providerId) ?? 0) + 1);
    });

    return {
      totalRevenue,
      invoiceCount: invoicesInRange.length,
      paidInvoiceCount: invoicesInRange.filter((i) => i.status === 'paid').length,
      overdueInvoiceCount: invoicesInRange.filter((i) => i.status === 'overdue').length,
      appointmentCount: appointmentsInRange.length,
      completedAppointmentCount,
      noShowCount,
      cancelledCount,
      showRatePercent: resolvedCount === 0 ? 0 : Math.round((completedAppointmentCount / resolvedCount) * 100),
      revenueByMonth: Array.from(revenueByMonthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, revenue]) => ({ month, revenue })),
      appointmentsByProvider: Array.from(appointmentsByProviderMap.entries()).map(([providerId, count]) => ({
        providerId,
        count,
      })),
    };
  }

  async listAuditLog(filters: { resourceType?: string; resourceId?: string } = {}): Promise<AuditLogEntry[]> {
    await this.ensureSeeded();
    let entries = await db.auditLog.toArray();
    if (filters.resourceType) entries = entries.filter((e) => e.resourceType === filters.resourceType);
    if (filters.resourceId) entries = entries.filter((e) => e.resourceId === filters.resourceId);
    return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async resetAndReseed(): Promise<void> {
    this.seedingPromise = this.seed(true);
    await this.seedingPromise;
  }
}

export const localRepository = new LocalRepository();
