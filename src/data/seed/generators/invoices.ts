import type { SeededRandom } from '../prng';
import type { Patient, Treatment, Invoice, InvoiceLineItem, InvoiceStatus } from '@/data/types';
import {
  REFERENCE_DATE,
  addMinutes,
  dateAtDayOffset,
  toIsoDate,
  toIsoDateTime,
  ageAt,
  wholeDaysBetween,
} from '../referenceDate';
import { PATIENT_INDEX, APPOINTMENT_DAY } from '../coverageIndex';

export interface BillingHints {
  /** A 'paid' invoice settled by two payments: insurance, then a card top-up. */
  mixedPaymentInvoiceId: string;
  /** A 'partially_paid' invoice settled by exactly 2 payments (also the 8+ line item one). */
  twoPaymentPartialInvoiceId: string;
  /** A fully-paid invoice whose single payment later receives a partial refund. */
  refundInvoiceId: string;
}

export interface GeneratedInvoices {
  invoices: Invoice[];
  hints: BillingHints;
}

interface VisitGroup {
  patientId: string;
  completedAt: string;
  treatments: Treatment[];
}

const ALL_STATUSES: InvoiceStatus[] = [
  'draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'cancelled',
];

// 7 fee lines + the visit's own treatment line(s) clears "8+ line items"
// with margin, rather than landing exactly on 7 and falling short.
const EXTRA_FEE_LINES = [
  { description: 'Digital X-ray fee', amount: 350 },
  { description: 'Sedation / nitrous oxide fee', amount: 800 },
  { description: 'Disposable supplies fee', amount: 150 },
  { description: 'Take-home fluoride kit', amount: 450 },
  { description: 'Follow-up consultation', amount: 300 },
  { description: 'Late-arrival scheduling fee', amount: 200 },
  { description: 'Local anesthesia fee', amount: 250 },
];

function groupCompletedTreatmentsByVisit(treatments: Treatment[]): VisitGroup[] {
  const map = new Map<string, VisitGroup>();
  treatments
    .filter((t): t is Treatment & { completedAt: string } => t.status === 'completed' && t.completedAt !== null)
    .forEach((t) => {
      const key = `${t.patientId}::${t.completedAt}`;
      const existing = map.get(key);
      if (existing) existing.treatments.push(t);
      else map.set(key, { patientId: t.patientId, completedAt: t.completedAt, treatments: [t] });
    });
  return Array.from(map.values()).sort((a, b) => a.completedAt.localeCompare(b.completedAt));
}

function buildLineItems(rng: SeededRandom, invoiceId: string, group: VisitGroup): InvoiceLineItem[] {
  return group.treatments.map((t) => {
    const unitPrice = t.actualCost ?? t.estimatedCost;
    return {
      id: rng.id('li'),
      invoiceId,
      treatmentId: t.id,
      description: t.toothNumber ? `${t.procedureName} — Tooth #${t.toothNumber}` : t.procedureName,
      cdtCode: t.procedureCode,
      quantity: 1,
      unitPrice,
      amount: unitPrice,
    };
  });
}

export function generateInvoices(
  rng: SeededRandom,
  clinicId: string,
  patients: Patient[],
  treatments: Treatment[],
): GeneratedInvoices {
  const patientById = new Map(patients.map((p) => [p.id, p]));
  const groups = groupCompletedTreatmentsByVisit(treatments);

  const invoices: Invoice[] = [];
  let sequence = 1;

  /** invoiceDate is computed once per group by the caller and passed in, so the
   * date used to decide the aging bucket is the same date that ends up on the
   * invoice — no independent re-roll inside finalize(). */
  const finalize = (
    group: VisitGroup,
    invoiceDate: string,
    status: InvoiceStatus,
    amountPaidTarget: number,
    extraLineItems: { description: string; amount: number }[] = [],
  ): Invoice => {
    const invoiceId = rng.id('inv');
    const lineItems = [
      ...buildLineItems(rng, invoiceId, group),
      ...extraLineItems.map((fee) => ({
        id: rng.id('li'),
        invoiceId,
        treatmentId: null,
        description: fee.description,
        cdtCode: null,
        quantity: 1,
        unitPrice: fee.amount,
        amount: fee.amount,
      })),
    ];

    const subtotal = lineItems.reduce((sum, li) => sum + li.amount, 0);
    const patient = patientById.get(group.patientId);
    const isSenior = patient ? ageAt(patient.dateOfBirth) >= 60 : false;
    const discountAmount = isSenior && rng.bool(0.5) ? Math.round(subtotal * 0.2) : 0;
    const taxAmount = 0; // dental professional fees are VAT-exempt at this clinic's scale
    const totalAmount = subtotal + taxAmount - discountAmount;

    const dueDate = toIsoDate(addMinutes(new Date(`${invoiceDate}T00:00:00Z`), 30 * 24 * 60));

    const amountPaid = status === 'cancelled' ? 0 : Math.min(amountPaidTarget, totalAmount);
    const amountDue = totalAmount - amountPaid;

    const sentAt =
      status === 'draft'
        ? null
        : toIsoDateTime(addMinutes(new Date(`${invoiceDate}T00:00:00Z`), rng.int(60, 600)));
    const viewedAt =
      status === 'viewed' || status === 'partially_paid' || status === 'paid' || status === 'overdue'
        ? toIsoDateTime(addMinutes(new Date(sentAt ?? `${invoiceDate}T00:00:00Z`), rng.int(60, 2000)))
        : null;

    const invoice: Invoice = {
      id: invoiceId,
      clinicId,
      patientId: group.patientId,
      invoiceNumber: `INV-2026-${String(sequence).padStart(4, '0')}`,
      invoiceDate,
      dueDate,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      status,
      amountPaid,
      amountDue,
      notes: null,
      sentAt,
      viewedAt,
      lineItems,
    };
    sequence += 1;
    invoices.push(invoice);
    return invoice;
  };

  /** invoiceDate is always >= the visit's completedAt, per the integrity rule. */
  const invoiceDateFor = (group: VisitGroup): string =>
    toIsoDate(addMinutes(new Date(`${group.completedAt.slice(0, 10)}T00:00:00Z`), rng.int(0, 4) * 24 * 60));

  const handledPatientIds = new Set<string>();

  // --- Three-open-invoices patient: three separate, still-open invoices ---
  const threeOpenPatientId = patients[PATIENT_INDEX.threeOpenInvoices].id;
  const threeOpenGroups = groups.filter((g) => g.patientId === threeOpenPatientId);
  const openStatuses: InvoiceStatus[] = ['sent', 'partially_paid', 'overdue'];
  threeOpenGroups.forEach((group, i) => {
    const status = openStatuses[i] ?? 'sent';
    const partial = status === 'partially_paid' ? 0.4 : 0;
    const subtotalGuess = group.treatments.reduce((s, t) => s + (t.actualCost ?? 0), 0);
    finalize(group, invoiceDateFor(group), status, Math.round(subtotalGuess * partial));
  });
  handledPatientIds.add(threeOpenPatientId);

  // --- Eight-line-item patient: padded with fee lines, partially paid via 2 payments ---
  const eightLineItemPatientId = patients[PATIENT_INDEX.eightLineItemInvoice].id;
  const eightLineItemGroups = groups.filter((g) => g.patientId === eightLineItemPatientId);
  let twoPaymentPartialInvoiceId = '';
  eightLineItemGroups.forEach((group, i) => {
    const subtotalGuess = group.treatments.reduce((s, t) => s + (t.actualCost ?? 0), 0);
    if (i === 0) {
      const invoice = finalize(group, invoiceDateFor(group), 'partially_paid', Math.round(subtotalGuess * 0.5), EXTRA_FEE_LINES);
      twoPaymentPartialInvoiceId = invoice.id;
    } else {
      finalize(group, invoiceDateFor(group), 'paid', subtotalGuess);
    }
  });
  handledPatientIds.add(eightLineItemPatientId);

  // --- Aging-bucket guarantees: force these two historical visits to stay
  // unpaid/overdue so a random 'paid' roll can't remove them from the aging
  // view. Matched by completedAt date, not patientId, since those two
  // patients may also appear in ordinary filler visits elsewhere. ---
  const agingBucketDates = new Set([
    toIsoDate(dateAtDayOffset(APPOINTMENT_DAY.agingBucket61to90VisitDay)),
    toIsoDate(dateAtDayOffset(APPOINTMENT_DAY.agingBucket90PlusVisitDay)),
  ]);
  const agingBucketGroups = groups.filter((g) => agingBucketDates.has(g.completedAt.slice(0, 10)));
  agingBucketGroups.forEach((group) => {
    finalize(group, invoiceDateFor(group), 'overdue', 0);
  });
  const agingBucketGroupKeys = new Set(agingBucketGroups.map((g) => `${g.patientId}::${g.completedAt}`));

  // --- Remaining groups: status driven by how overdue the due date is ---
  const remainingGroups = groups.filter(
    (g) => !handledPatientIds.has(g.patientId) && !agingBucketGroupKeys.has(`${g.patientId}::${g.completedAt}`),
  );
  const seenStatuses = new Set<InvoiceStatus>(['overdue']);
  let mixedPaymentInvoiceId = '';
  let refundInvoiceId = '';

  remainingGroups.forEach((group) => {
    const subtotalGuess = group.treatments.reduce((s, t) => s + (t.actualCost ?? 0), 0);
    const invoiceDate = invoiceDateFor(group);
    const dueDate = toIsoDate(addMinutes(new Date(`${invoiceDate}T00:00:00Z`), 30 * 24 * 60));
    const daysOverdue = -wholeDaysBetween(REFERENCE_DATE, new Date(`${dueDate}T09:00:00+08:00`));

    if (rng.bool(0.03)) {
      finalize(group, invoiceDate, 'cancelled', 0);
      seenStatuses.add('cancelled');
      return;
    }

    let status: InvoiceStatus;
    let paidFraction = 0;
    if (daysOverdue < 0) {
      const roll = rng.next();
      if (roll < 0.15) status = 'draft';
      else if (roll < 0.35) status = 'sent';
      else if (roll < 0.5) status = 'viewed';
      else if (roll < 0.65) {
        status = 'partially_paid';
        paidFraction = rng.float(0.2, 0.7);
      } else {
        status = 'paid';
        paidFraction = 1;
      }
    } else {
      const roll = rng.next();
      if (roll < 0.55) {
        status = 'paid';
        paidFraction = 1;
      } else if (roll < 0.9) {
        status = 'overdue';
        paidFraction = rng.bool(0.3) ? rng.float(0.1, 0.6) : 0;
      } else {
        status = 'partially_paid';
        paidFraction = rng.float(0.3, 0.8);
      }
    }
    seenStatuses.add(status);

    const invoice = finalize(group, invoiceDate, status, Math.round(subtotalGuess * paidFraction));

    if (status === 'paid' && !mixedPaymentInvoiceId && subtotalGuess > 1000) {
      mixedPaymentInvoiceId = invoice.id;
    } else if (status === 'paid' && mixedPaymentInvoiceId && !refundInvoiceId && invoice.id !== mixedPaymentInvoiceId) {
      refundInvoiceId = invoice.id;
    }
  });

  // Top up any status the random pass happened not to produce, converting
  // the most recently generated invoice and recomputing amountPaid/amountDue
  // to stay coherent with the new status (not just relabeling it).
  ALL_STATUSES.forEach((status) => {
    if (seenStatuses.has(status)) return;
    const candidate = invoices[invoices.length - 1];
    if (!candidate) return;
    candidate.status = status;
    if (status === 'paid') {
      candidate.amountPaid = candidate.totalAmount;
    } else if (status === 'partially_paid') {
      candidate.amountPaid = Math.round(candidate.totalAmount * 0.5);
    } else {
      candidate.amountPaid = 0;
    }
    candidate.amountDue = candidate.totalAmount - candidate.amountPaid;
    seenStatuses.add(status);
  });

  return {
    invoices,
    hints: {
      mixedPaymentInvoiceId: mixedPaymentInvoiceId || invoices[0].id,
      twoPaymentPartialInvoiceId: twoPaymentPartialInvoiceId || invoices[0].id,
      refundInvoiceId: refundInvoiceId || invoices[invoices.length - 1].id,
    },
  };
}
