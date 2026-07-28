/**
 * `pnpm audit:coverage` — walks the brief's coverage matrix and prints the
 * specific record (patient/appointment/invoice/insurance/inventory) that
 * satisfies each row, by name and id, straight from the live generator
 * output. Re-run this after any generator change to confirm every
 * coverage-matrix guarantee still holds with real IDs, not just by
 * re-reading coverageIndex.ts and hoping.
 */
import { buildSeedDataset } from '../src/data/seed';
import { PATIENT_INDEX, UNINSURED_PATIENT_INDICES } from '../src/data/seed/coverageIndex';
import { REFERENCE_DATE } from '../src/data/demoClock';

const dataset = buildSeedDataset();
const patientAt = (idx: number) => dataset.patients[idx];
const nameOf = (idx: number) => `${patientAt(idx).firstName} ${patientAt(idx).lastName}`;

function section(title: string): void {
  console.log(`\n=== ${title} ===`);
}

section('PATIENT LIST');
console.log('Total patients:', dataset.patients.length);
const longNamePatient = patientAt(PATIENT_INDEX.longName);
const longNameChars = `${longNamePatient.firstName} ${longNamePatient.middleName ?? ''} ${longNamePatient.lastName}`.length;
console.log('Long name:', longNamePatient.id, `"${nameOf(PATIENT_INDEX.longName)}" (${longNameChars} chars)`);
console.log('Single name (no middle):', patientAt(PATIENT_INDEX.singleName).id, nameOf(PATIENT_INDEX.singleName));
console.log('Name with ñ:', patientAt(PATIENT_INDEX.nameWithTilde).id, nameOf(PATIENT_INDEX.nameWithTilde));
console.log('Hyphenated name:', patientAt(PATIENT_INDEX.hyphenatedName).id, nameOf(PATIENT_INDEX.hyphenatedName));
console.log('Inactive status:', patientAt(PATIENT_INDEX.inactiveStatus).id, nameOf(PATIENT_INDEX.inactiveStatus));
console.log('Transferred status:', patientAt(PATIENT_INDEX.transferredStatus).id, nameOf(PATIENT_INDEX.transferredStatus));
console.log('Null email+phone:', patientAt(PATIENT_INDEX.nullEmailAndPhone).id, nameOf(PATIENT_INDEX.nullEmailAndPhone));
console.log('5+ tags:', patientAt(PATIENT_INDEX.manyTags).id, patientAt(PATIENT_INDEX.manyTags).tags);
console.log('0 tags:', patientAt(PATIENT_INDEX.noTags).id, patientAt(PATIENT_INDEX.noTags).tags);
console.log('Same last name trio:', PATIENT_INDEX.sameLastNameTrio.map((i) => `${patientAt(i).id} (${nameOf(i)})`));
console.log(
  'Identical name, diff DOB:',
  PATIENT_INDEX.identicalNameDifferentDob.map((i) => `${patientAt(i).id} (${nameOf(i)}, DOB ${patientAt(i).dateOfBirth})`),
);

section('PATIENT CHART + ODONTOGRAM');
const zeroTreatmentsPatient = patientAt(PATIENT_INDEX.zeroTreatments);
console.log(
  'Zero treatments:',
  zeroTreatmentsPatient.id,
  '-> count:',
  dataset.treatments.filter((t) => t.patientId === zeroTreatmentsPatient.id).length,
);
const fifteenTeethPatient = patientAt(PATIENT_INDEX.fifteenPlusTeeth);
const fifteenTeethTreatments = dataset.treatments.filter((t) => t.patientId === fifteenTeethPatient.id);
const distinctTeeth = new Set(fifteenTeethTreatments.map((t) => t.toothNumber).filter((n): n is number => n !== null));
console.log('15+ teeth patient:', fifteenTeethPatient.id, '-> distinct teeth:', distinctTeeth.size);
const tooth14 = fifteenTeethTreatments.filter((t) => t.toothNumber === 14);
console.log('Tooth with 3 surfaces:', tooth14.map((t) => `${t.id} surface=${t.surface}`));
const treatmentStatusCounts: Record<string, number> = {};
dataset.treatments.forEach((t) => {
  treatmentStatusCounts[t.status] = (treatmentStatusCounts[t.status] ?? 0) + 1;
});
console.log('All treatment statuses present:', treatmentStatusCounts);
console.log(
  '6-allergy patient:',
  patientAt(PATIENT_INDEX.sixAllergies).id,
  dataset.medicalHistories.find((h) => h.patientId === patientAt(PATIENT_INDEX.sixAllergies).id)?.allergies,
);
console.log(
  '0-allergy patient:',
  patientAt(PATIENT_INDEX.noAllergies).id,
  dataset.medicalHistories.find((h) => h.patientId === patientAt(PATIENT_INDEX.noAllergies).id)?.allergies,
);
console.log('Anxious patient:', patientAt(PATIENT_INDEX.anxious).id, nameOf(PATIENT_INDEX.anxious));
console.log('Pediatric patient:', patientAt(PATIENT_INDEX.pediatric).id, 'DOB', patientAt(PATIENT_INDEX.pediatric).dateOfBirth);
const followUp = dataset.treatments.find((t) => t.followUpRequired);
console.log('followUpRequired + overdue:', followUp?.id, 'followUpDate=', followUp?.followUpDate);

section('SCHEDULING');
const todayIso = REFERENCE_DATE.toISOString().slice(0, 10);
const todaysAppointments = dataset.appointments.filter((a) => a.startTime.startsWith(todayIso));
console.log(`Today (${todayIso}) appointment count:`, todaysAppointments.length);
const fullyBookedDay = dataset.appointments.filter((a) => a.startTime.startsWith('2026-07-22'));
console.log('Fully-booked day (2026-07-22) count:', fullyBookedDay.length);
const cancelledNoShowDay = dataset.appointments.filter((a) => a.startTime.startsWith('2026-07-07'));
console.log('Cancelled+no-show day (2026-07-07):', cancelledNoShowDay.map((a) => `${a.id} ${a.status}`));
const rootCanalAppt = dataset.appointments.find(
  (a) => a.startTime.startsWith('2026-07-24') && dataset.treatments.some((t) => t.appointmentId === a.id && t.procedureCode === 'D3310'),
);
console.log('Root canal appointment:', rootCanalAppt?.id, rootCanalAppt?.startTime, '-', rootCanalAppt?.endTime);
const emergencyAppt = todaysAppointments.find((a) => a.status === 'scheduled');
console.log('Same-day emergency:', emergencyAppt?.id);
const fourNoShowsPatient = patientAt(PATIENT_INDEX.fourNoShows);
console.log(
  '4-no-shows patient:',
  fourNoShowsPatient.id,
  '-> count:',
  dataset.appointments.filter((a) => a.patientId === fourNoShowsPatient.id && a.status === 'no_show').length,
);
const unconfirmedAppt = dataset.appointments.find((a) => a.startTime.startsWith('2026-07-29'));
console.log('Unconfirmed +2 days:', unconfirmedAppt?.id, 'status=', unconfirmedAppt?.status);

section('BILLING');
const invoiceStatusCounts: Record<string, number> = {};
dataset.invoices.forEach((inv) => {
  invoiceStatusCounts[inv.status] = (invoiceStatusCounts[inv.status] ?? 0) + 1;
});
console.log('Invoice status distribution:', invoiceStatusCounts);

const referenceTime = REFERENCE_DATE.getTime();
const agingBuckets = { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
dataset.invoices.forEach((inv) => {
  if (inv.amountDue <= 0) return;
  const dueTime = new Date(`${inv.dueDate}T00:00:00Z`).getTime();
  const overdueDays = Math.round((referenceTime - dueTime) / 86_400_000);
  if (overdueDays < 0) agingBuckets.current += 1;
  else if (overdueDays <= 30) agingBuckets['1-30'] += 1;
  else if (overdueDays <= 60) agingBuckets['31-60'] += 1;
  else if (overdueDays <= 90) agingBuckets['61-90'] += 1;
  else agingBuckets['90+'] += 1;
});
console.log('Aging buckets:', agingBuckets);

const eightLineItemPatient = patientAt(PATIENT_INDEX.eightLineItemInvoice);
const eightLineInvoice = dataset.invoices.find((inv) => inv.patientId === eightLineItemPatient.id && inv.lineItems.length >= 8);
console.log('8+ line item invoice:', eightLineInvoice?.id, 'lineItems=', eightLineInvoice?.lineItems.length);
console.log(
  '  -> payments:',
  dataset.payments.filter((pay) => pay.invoiceId === eightLineInvoice?.id).map((pay) => `${pay.id} ${pay.amount} ${pay.paymentMethod}`),
);

const threeOpenPatient = patientAt(PATIENT_INDEX.threeOpenInvoices);
console.log(
  '3 open invoices patient:',
  threeOpenPatient.id,
  '->',
  dataset.invoices.filter((inv) => inv.patientId === threeOpenPatient.id).map((inv) => `${inv.id} status=${inv.status}`),
);

const mixedPaymentInvoice = dataset.invoices.find((inv) => {
  const payments = dataset.payments.filter((pay) => pay.invoiceId === inv.id);
  return payments.some((pay) => pay.paymentMethod === 'insurance') && payments.some((pay) => pay.paymentMethod === 'credit_card');
});
console.log('Mixed insurance+card invoice:', mixedPaymentInvoice?.id);

const refundedPayment = dataset.payments.find((pay) => pay.refund);
console.log('Refunded payment:', refundedPayment?.id, 'refundAmount=', refundedPayment?.refund?.refundAmount);

const zeroBalancePaid = dataset.invoices.find((inv) => inv.status === 'paid' && inv.amountDue === 0);
console.log('Zero-balance paid invoice:', zeroBalancePaid?.id);

section('INSURANCE');
const dualInsurancePatient = patientAt(PATIENT_INDEX.dualInsurance);
console.log(
  'Dual insurance patient:',
  dualInsurancePatient.id,
  '->',
  dataset.patientInsurance.filter((pi) => pi.patientId === dualInsurancePatient.id).map((pi) => `${pi.id} primary=${pi.isPrimary}`),
);
const expiredPolicy = dataset.patientInsurance.find((pi) => pi.patientId === patientAt(PATIENT_INDEX.expiredInsurancePolicy).id);
console.log('Expired policy:', expiredPolicy?.id, 'terminationDate=', expiredPolicy?.terminationDate);
const fullyMetPolicy = dataset.patientInsurance.find((pi) => pi.patientId === patientAt(PATIENT_INDEX.deductibleFullyMet).id);
console.log('Deductible fully met:', fullyMetPolicy?.id, `${fullyMetPolicy?.deductibleMet}/${fullyMetPolicy?.deductible}`);
const barelyStartedPolicy = dataset.patientInsurance.find((pi) => pi.patientId === patientAt(PATIENT_INDEX.deductibleBarelyStarted).id);
console.log('Deductible barely started:', barelyStartedPolicy?.id, `${barelyStartedPolicy?.deductibleMet}/${barelyStartedPolicy?.deductible}`);
const nearlyExhaustedPolicy = dataset.patientInsurance.find((pi) => pi.patientId === patientAt(PATIENT_INDEX.annualMaxNearlyExhausted).id);
console.log(
  'Annual max nearly exhausted:',
  nearlyExhaustedPolicy?.id,
  `${nearlyExhaustedPolicy?.annualUsed}/${nearlyExhaustedPolicy?.annualMax}`,
);
const neverVerifiedPolicy = dataset.patientInsurance.find((pi) => pi.patientId === patientAt(PATIENT_INDEX.neverVerifiedInsurancePolicy).id);
console.log('Never verified:', neverVerifiedPolicy?.id, 'verifiedAt=', neverVerifiedPolicy?.verifiedAt);
console.log('Uninsured patients:', UNINSURED_PATIENT_INDICES.length, UNINSURED_PATIENT_INDICES.map((i) => patientAt(i).id));

section('INVENTORY');
dataset.inventoryItems.forEach((item, idx) => {
  if ([5, 10, 15, 20, 25].includes(idx)) {
    console.log(`  [${idx}] ${item.id} ${item.name}: qty=${item.currentQuantity} reorder=${item.reorderLevel} exp=${item.expirationDate}`);
  }
});
const noExpiryItem = dataset.inventoryItems.find((i) => i.itemType === 'equipment' && i.expirationDate === null);
console.log('Equipment with no expiration:', noExpiryItem?.id, noExpiryItem?.name);

section('REPORTS');
const activeMonths = new Set(
  [...dataset.treatments.map((t) => t.completedAt), ...dataset.invoices.map((i) => i.invoiceDate)]
    .filter((d): d is string => Boolean(d))
    .map((d) => d.slice(0, 7)),
);
console.log('Distinct months with activity:', [...activeMonths].sort());
const revenueByMonth = new Map<string, number>();
dataset.invoices.forEach((inv) => {
  const month = inv.invoiceDate.slice(0, 7);
  revenueByMonth.set(month, (revenueByMonth.get(month) ?? 0) + inv.amountPaid);
});
console.log('Revenue by month:', [...revenueByMonth.entries()].sort());
dataset.users
  .filter((u) => u.role === 'dentist')
  .forEach((dentist) => {
    const apptCount = dataset.appointments.filter((a) => a.providerId === dentist.id).length;
    const completedCount = dataset.appointments.filter((a) => a.providerId === dentist.id && a.status === 'completed').length;
    console.log(`Dentist ${dentist.firstName} ${dentist.lastName} (${dentist.id}): ${apptCount} appointments, ${completedCount} completed`);
  });
