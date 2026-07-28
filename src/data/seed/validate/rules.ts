import type { SeedDataset } from '@/data/types';
import { REFERENCE_DATE, ageAt, phLocalMinutesSinceMidnight, phLocalWeekday } from '../../demoClock';

export interface Violation {
  /** Short, stable, grep-able rule identifier. */
  rule: string;
  message: string;
  recordId: string;
}

type RuleCheck = (dataset: SeedDataset) => Violation[];

function checkForeignKey<T>(
  records: T[],
  getId: (record: T) => string | null | undefined,
  targetIds: Set<string>,
  rule: string,
  getRecordId: (record: T) => string,
): Violation[] {
  const violations: Violation[] = [];
  records.forEach((record) => {
    const id = getId(record);
    if (id != null && !targetIds.has(id)) {
      violations.push({ rule, message: `References missing id "${id}"`, recordId: getRecordId(record) });
    }
  });
  return violations;
}

const checkNoOrphanForeignKeys: RuleCheck = (dataset) => {
  const clinicIds = new Set([dataset.clinic.id]);
  const userIds = new Set(dataset.users.map((u) => u.id));
  const patientIds = new Set(dataset.patients.map((p) => p.id));
  const insuranceProviderIds = new Set(dataset.insuranceProviders.map((p) => p.id));
  const appointmentTypeIds = new Set(dataset.appointmentTypes.map((t) => t.id));
  const appointmentIds = new Set(dataset.appointments.map((a) => a.id));
  const treatmentIds = new Set(dataset.treatments.map((t) => t.id));
  const invoiceIds = new Set(dataset.invoices.map((i) => i.id));
  const supplierIds = new Set(dataset.inventorySuppliers.map((s) => s.id));

  return [
    ...checkForeignKey(dataset.users, (u) => u.clinicId, clinicIds, 'fk-users-clinic', (u) => u.id),
    ...checkForeignKey(dataset.patients, (p) => p.clinicId, clinicIds, 'fk-patients-clinic', (p) => p.id),
    ...checkForeignKey(dataset.patientAddresses, (a) => a.patientId, patientIds, 'fk-address-patient', (a) => a.id),
    ...checkForeignKey(dataset.medicalHistories, (h) => h.patientId, patientIds, 'fk-history-patient', (h) => h.patientId),
    ...checkForeignKey(dataset.insuranceProviders, (p) => p.clinicId, clinicIds, 'fk-insprovider-clinic', (p) => p.id),
    ...checkForeignKey(dataset.patientInsurance, (pi) => pi.patientId, patientIds, 'fk-patientinsurance-patient', (pi) => pi.id),
    ...checkForeignKey(dataset.patientInsurance, (pi) => pi.insuranceProviderId, insuranceProviderIds, 'fk-patientinsurance-provider', (pi) => pi.id),
    ...checkForeignKey(dataset.appointmentTypes, (t) => t.clinicId, clinicIds, 'fk-appttype-clinic', (t) => t.id),
    ...checkForeignKey(dataset.appointments, (a) => a.patientId, patientIds, 'fk-appointment-patient', (a) => a.id),
    ...checkForeignKey(dataset.appointments, (a) => a.providerId, userIds, 'fk-appointment-provider', (a) => a.id),
    ...checkForeignKey(dataset.appointments, (a) => a.appointmentTypeId, appointmentTypeIds, 'fk-appointment-type', (a) => a.id),
    ...checkForeignKey(dataset.treatments, (t) => t.patientId, patientIds, 'fk-treatment-patient', (t) => t.id),
    ...checkForeignKey(dataset.treatments, (t) => t.appointmentId, appointmentIds, 'fk-treatment-appointment', (t) => t.id),
    ...checkForeignKey(dataset.treatments, (t) => t.dentistId, userIds, 'fk-treatment-dentist', (t) => t.id),
    ...checkForeignKey(dataset.treatments, (t) => t.hygienistId, userIds, 'fk-treatment-hygienist', (t) => t.id),
    ...checkForeignKey(dataset.clinicalNotes, (n) => n.treatmentId, treatmentIds, 'fk-note-treatment', (n) => n.id),
    ...checkForeignKey(dataset.clinicalNotes, (n) => n.providerId, userIds, 'fk-note-provider', (n) => n.id),
    ...checkForeignKey(dataset.invoices, (i) => i.patientId, patientIds, 'fk-invoice-patient', (i) => i.id),
    ...dataset.invoices.flatMap((invoice) =>
      checkForeignKey(invoice.lineItems, (li) => li.treatmentId, treatmentIds, 'fk-lineitem-treatment', (li) => li.id),
    ),
    ...checkForeignKey(dataset.payments, (p) => p.invoiceId, invoiceIds, 'fk-payment-invoice', (p) => p.id),
    ...checkForeignKey(dataset.payments, (p) => p.patientId, patientIds, 'fk-payment-patient', (p) => p.id),
    ...checkForeignKey(dataset.inventoryItems, (i) => i.supplierId, supplierIds, 'fk-inventoryitem-supplier', (i) => i.id),
    ...checkForeignKey(dataset.auditLog, (e) => e.userId, userIds, 'fk-auditlog-user', (e) => e.id),
  ];
};

const checkAppointmentTimes: RuleCheck = (dataset) => {
  const typeById = new Map(dataset.appointmentTypes.map((t) => [t.id, t]));
  const violations: Violation[] = [];

  dataset.appointments.forEach((a) => {
    const start = new Date(a.startTime).getTime();
    const end = new Date(a.endTime).getTime();
    if (end <= start) {
      violations.push({ rule: 'appointment-end-after-start', message: `endTime does not follow startTime`, recordId: a.id });
    }

    const type = typeById.get(a.appointmentTypeId);
    if (type) {
      const actualMinutes = Math.round((end - start) / 60_000);
      if (actualMinutes !== type.durationMinutes) {
        violations.push({
          rule: 'appointment-duration-matches-type',
          message: `duration ${actualMinutes}min !== ${type.name}'s ${type.durationMinutes}min`,
          recordId: a.id,
        });
      }
    }
  });

  return violations;
};

const checkBusinessHoursAndWorkingDays: RuleCheck = (dataset) => {
  const settings = dataset.clinicSettings;
  const [startHour, startMinute] = settings.businessHoursStart.split(':').map(Number);
  const [endHour, endMinute] = settings.businessHoursEnd.split(':').map(Number);
  const openMinutes = startHour * 60 + startMinute;
  const closeMinutes = endHour * 60 + endMinute;

  const violations: Violation[] = [];
  dataset.appointments.forEach((a) => {
    const startMinutes = phLocalMinutesSinceMidnight(a.startTime);
    const endMinutes = phLocalMinutesSinceMidnight(a.endTime);
    if (startMinutes < openMinutes || endMinutes > closeMinutes) {
      violations.push({
        rule: 'appointment-within-business-hours',
        message: `${startMinutes}-${endMinutes}min falls outside ${openMinutes}-${closeMinutes}min business hours`,
        recordId: a.id,
      });
    }
    if (!settings.workingDays.includes(phLocalWeekday(a.startTime))) {
      violations.push({
        rule: 'appointment-on-working-day',
        message: `Falls on non-working ISO weekday ${phLocalWeekday(a.startTime)}`,
        recordId: a.id,
      });
    }
  });
  return violations;
};

const checkNoDoubleBooking: RuleCheck = (dataset) => {
  const violations: Violation[] = [];
  const byProvider = new Map<string, typeof dataset.appointments>();
  dataset.appointments.forEach((a) => {
    const list = byProvider.get(a.providerId) ?? [];
    list.push(a);
    byProvider.set(a.providerId, list);
  });

  byProvider.forEach((list) => {
    const sorted = [...list].sort((a, b) => a.startTime.localeCompare(b.startTime));
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (new Date(curr.startTime).getTime() < new Date(prev.endTime).getTime()) {
        violations.push({
          rule: 'no-double-booking',
          message: `Overlaps with appointment ${prev.id} for the same provider`,
          recordId: curr.id,
        });
      }
    }
  });
  return violations;
};

const checkCompletedTreatmentTiming: RuleCheck = (dataset) => {
  const apptById = new Map(dataset.appointments.map((a) => [a.id, a]));
  const violations: Violation[] = [];

  dataset.treatments
    .filter((t) => t.status === 'completed')
    .forEach((t) => {
      if (!t.appointmentId) {
        violations.push({ rule: 'completed-treatment-has-appointment', message: 'No appointmentId', recordId: t.id });
        return;
      }
      const appt = apptById.get(t.appointmentId);
      if (!appt) return; // caught by the FK check

      if (new Date(appt.startTime).getTime() >= REFERENCE_DATE.getTime()) {
        violations.push({
          rule: 'completed-treatment-appointment-in-past',
          message: `Appointment ${appt.id} startTime is not in the past`,
          recordId: t.id,
        });
      }
      if (!t.completedAt || new Date(t.completedAt).getTime() < new Date(appt.startTime).getTime()) {
        violations.push({
          rule: 'treatment-completedAt-after-appointment-start',
          message: `completedAt(${t.completedAt}) precedes appointment startTime(${appt.startTime})`,
          recordId: t.id,
        });
      }
    });

  return violations;
};

const checkInvoiceDateAfterTreatments: RuleCheck = (dataset) => {
  const treatmentById = new Map(dataset.treatments.map((t) => [t.id, t]));
  const violations: Violation[] = [];

  dataset.invoices.forEach((invoice) => {
    const completedDates = invoice.lineItems
      .map((li) => (li.treatmentId ? treatmentById.get(li.treatmentId)?.completedAt : null))
      .filter((d): d is string => Boolean(d));
    if (completedDates.length === 0) return;

    const latest = completedDates.reduce((a, b) => (a > b ? a : b));
    if (invoice.invoiceDate < latest.slice(0, 10)) {
      violations.push({
        rule: 'invoice-date-after-treatments',
        message: `invoiceDate(${invoice.invoiceDate}) precedes latest completedAt(${latest})`,
        recordId: invoice.id,
      });
    }
  });

  return violations;
};

const checkInvoiceDates: RuleCheck = (dataset) =>
  dataset.invoices
    .filter((invoice) => invoice.dueDate <= invoice.invoiceDate)
    .map((invoice) => ({
      rule: 'due-date-after-invoice-date',
      message: `dueDate(${invoice.dueDate}) not after invoiceDate(${invoice.invoiceDate})`,
      recordId: invoice.id,
    }));

const checkPaymentDates: RuleCheck = (dataset) => {
  const invoiceById = new Map(dataset.invoices.map((i) => [i.id, i]));
  const violations: Violation[] = [];
  dataset.payments.forEach((payment) => {
    const invoice = invoiceById.get(payment.invoiceId);
    if (!invoice) return; // caught by the FK check
    if (payment.paymentDate < invoice.invoiceDate) {
      violations.push({
        rule: 'payment-date-after-invoice-date',
        message: `paymentDate(${payment.paymentDate}) precedes invoiceDate(${invoice.invoiceDate})`,
        recordId: payment.id,
      });
    }
  });
  return violations;
};

const checkPaymentsSumToAmountPaid: RuleCheck = (dataset) => {
  const paidByInvoice = new Map<string, number>();
  dataset.payments.forEach((p) => paidByInvoice.set(p.invoiceId, (paidByInvoice.get(p.invoiceId) ?? 0) + p.amount));

  return dataset.invoices
    .filter((invoice) => (paidByInvoice.get(invoice.id) ?? 0) !== invoice.amountPaid)
    .map((invoice) => ({
      rule: 'payments-sum-to-amount-paid',
      message: `sum(payments)=${paidByInvoice.get(invoice.id) ?? 0} !== amountPaid=${invoice.amountPaid}`,
      recordId: invoice.id,
    }));
};

const checkInvoiceArithmetic: RuleCheck = (dataset) => {
  const violations: Violation[] = [];
  dataset.invoices.forEach((invoice) => {
    if (invoice.amountPaid + invoice.amountDue !== invoice.totalAmount) {
      violations.push({
        rule: 'invoice-balance-arithmetic',
        message: `amountPaid(${invoice.amountPaid})+amountDue(${invoice.amountDue}) !== totalAmount(${invoice.totalAmount})`,
        recordId: invoice.id,
      });
    }
    if (invoice.subtotal + invoice.taxAmount - invoice.discountAmount !== invoice.totalAmount) {
      violations.push({
        rule: 'invoice-total-arithmetic',
        message: `subtotal+tax-discount !== totalAmount`,
        recordId: invoice.id,
      });
    }
  });
  return violations;
};

const checkInsuranceBounds: RuleCheck = (dataset) => {
  const violations: Violation[] = [];
  dataset.patientInsurance.forEach((pi) => {
    if (pi.deductibleMet > pi.deductible) {
      violations.push({
        rule: 'deductible-met-within-deductible',
        message: `deductibleMet(${pi.deductibleMet}) > deductible(${pi.deductible})`,
        recordId: pi.id,
      });
    }
    if (pi.annualUsed > pi.annualMax) {
      violations.push({
        rule: 'annual-used-within-annual-max',
        message: `annualUsed(${pi.annualUsed}) > annualMax(${pi.annualMax})`,
        recordId: pi.id,
      });
    }
    if (pi.terminationDate && pi.effectiveDate >= pi.terminationDate) {
      violations.push({
        rule: 'insurance-effective-before-termination',
        message: `effectiveDate(${pi.effectiveDate}) not before terminationDate(${pi.terminationDate})`,
        recordId: pi.id,
      });
    }
  });
  return violations;
};

const checkSinglePrimaryInsurancePerPatient: RuleCheck = (dataset) => {
  const primaryCountByPatient = new Map<string, number>();
  dataset.patientInsurance.forEach((pi) => {
    if (pi.isPrimary) primaryCountByPatient.set(pi.patientId, (primaryCountByPatient.get(pi.patientId) ?? 0) + 1);
  });

  const violations: Violation[] = [];
  primaryCountByPatient.forEach((count, patientId) => {
    if (count > 1) {
      violations.push({
        rule: 'single-primary-insurance-per-patient',
        message: `${count} primary insurance policies for one patient`,
        recordId: patientId,
      });
    }
  });
  return violations;
};

const checkInventoryNonNegative: RuleCheck = (dataset) =>
  dataset.inventoryItems
    .filter((item) => item.currentQuantity < 0)
    .map((item) => ({
      rule: 'inventory-quantity-non-negative',
      message: `currentQuantity ${item.currentQuantity} < 0`,
      recordId: item.id,
    }));

const checkPatientAgeSpread: RuleCheck = (dataset) => {
  const violations: Violation[] = [];

  dataset.patients.forEach((p) => {
    if (new Date(p.dateOfBirth).getTime() >= REFERENCE_DATE.getTime()) {
      violations.push({ rule: 'dob-in-past', message: `dateOfBirth ${p.dateOfBirth} is not in the past`, recordId: p.id });
    }
  });

  const ages = dataset.patients.map((p) => ageAt(p.dateOfBirth));
  const minAge = Math.min(...ages);
  const maxAge = Math.max(...ages);

  if (minAge > 6) {
    violations.push({ rule: 'age-spread-lower-bound', message: `Youngest patient is ${minAge}, expected <= 6`, recordId: 'population' });
  }
  if (maxAge < 88) {
    violations.push({ rule: 'age-spread-upper-bound', message: `Oldest patient is ${maxAge}, expected >= 88`, recordId: 'population' });
  }
  if (!ages.some((age) => age < 18)) {
    violations.push({ rule: 'age-spread-includes-minors', message: 'No patient under 18 found', recordId: 'population' });
  }

  return violations;
};

const checkAuditLogChronology: RuleCheck = (dataset) => {
  const patientById = new Map(dataset.patients.map((p) => [p.id, p]));
  const appointmentById = new Map(dataset.appointments.map((a) => [a.id, a]));
  const treatmentById = new Map(dataset.treatments.map((t) => [t.id, t]));
  const invoiceById = new Map(dataset.invoices.map((i) => [i.id, i]));

  const referenceTimestampFor = (resourceType: string, resourceId: string): string | undefined => {
    switch (resourceType) {
      case 'patients':
        return patientById.get(resourceId)?.createdAt;
      case 'appointments':
        return appointmentById.get(resourceId)?.createdAt;
      case 'treatments':
        return treatmentById.get(resourceId)?.createdAt;
      case 'invoices':
        return invoiceById.get(resourceId)?.invoiceDate;
      default:
        return undefined;
    }
  };

  const violations: Violation[] = [];
  dataset.auditLog.forEach((entry) => {
    const referenceTimestamp = referenceTimestampFor(entry.resourceType, entry.resourceId);
    if (referenceTimestamp && entry.createdAt < referenceTimestamp) {
      violations.push({
        rule: 'audit-log-chronology',
        message: `createdAt(${entry.createdAt}) precedes referenced ${entry.resourceType} timestamp(${referenceTimestamp})`,
        recordId: entry.id,
      });
    }
  });
  return violations;
};

export const RULE_CHECKS: { name: string; check: RuleCheck }[] = [
  { name: 'No orphan foreign keys', check: checkNoOrphanForeignKeys },
  { name: 'Appointment end > start, duration matches type', check: checkAppointmentTimes },
  { name: 'Appointments within business hours and working days', check: checkBusinessHoursAndWorkingDays },
  { name: 'No double-booking', check: checkNoDoubleBooking },
  { name: 'Completed treatments attach to a past appointment', check: checkCompletedTreatmentTiming },
  { name: 'Invoice date follows its treatments', check: checkInvoiceDateAfterTreatments },
  { name: 'Invoice due date after invoice date', check: checkInvoiceDates },
  { name: 'Payment date after invoice date', check: checkPaymentDates },
  { name: 'Payments sum to invoice.amountPaid', check: checkPaymentsSumToAmountPaid },
  { name: 'Invoice arithmetic (balance and total)', check: checkInvoiceArithmetic },
  { name: 'Insurance deductible/annualMax/dates in bounds', check: checkInsuranceBounds },
  { name: 'Only one primary insurance per patient', check: checkSinglePrimaryInsurancePerPatient },
  { name: 'Inventory quantity never negative', check: checkInventoryNonNegative },
  { name: 'Patient age spread (6-88, includes minors)', check: checkPatientAgeSpread },
  { name: 'Audit log chronology', check: checkAuditLogChronology },
];

export function runAllRules(dataset: SeedDataset): Violation[] {
  return RULE_CHECKS.flatMap(({ check }) => check(dataset));
}
