/**
 * Single source of truth for which patient array index satisfies which row
 * of the coverage matrix in the brief. Every generator that needs to bake
 * in a specific edge case (patients, medicalHistory, insurance, treatments,
 * appointments, invoices) imports from here instead of scattering magic
 * numbers — and Stage 5's coverage audit cites these same indices back to
 * specific record IDs.
 */
export const PATIENT_INDEX = {
  longName: 0,
  singleName: 1,
  nameWithTilde: 2,
  hyphenatedName: 3,
  sameLastNameTrio: [4, 5, 6] as const,
  identicalNameDifferentDob: [7, 8] as const,
  nullEmailAndPhone: 9,
  manyTags: 10,
  noTags: 11,
  pediatric: 12,
  youngestBoundary: 13,
  oldestBoundary: 14,
  fourNoShows: 15,
  anxious: 16,
  sixAllergies: 17,
  noAllergies: 18,
  zeroTreatments: 19,
  fifteenPlusTeeth: 20,
  threeOpenInvoices: 21,
  eightLineItemInvoice: 22,
  inactiveStatus: 23,
  transferredStatus: 24,
  dualInsurance: 30,
  deductibleFullyMet: 31,
  deductibleBarelyStarted: 32,
  annualMaxNearlyExhausted: 33,
  expiredInsurancePolicy: 34,
  neverVerifiedInsurancePolicy: 35,
} as const;

/** Last 12 patients by index are deliberately uninsured / self-pay. */
export const UNINSURED_PATIENT_INDICES: number[] = Array.from({ length: 12 }, (_, i) => 48 + i);

export const PATIENT_COUNT = 60;

/**
 * Day offsets from REFERENCE_DATE reserved for the Scheduling coverage-
 * matrix rows. Kept alongside PATIENT_INDEX so both generators and the
 * Stage 5 audit have one place to look up "which day/patient satisfies
 * this row."
 */
export const APPOINTMENT_DAY = {
  today: 0,
  emptyFutureDay: 15,
  fullyBookedDay: -5,
  cancelledAndNoShowDay: -20,
  longRootCanalDay: -3,
  unconfirmedUpcoming: 2,
  // -50, -15, and -85 originally fell on a Sunday (REFERENCE_DATE is a
  // Monday, so any offset that's 6 mod 7 back from it lands on Sunday) —
  // caught by `pnpm validate:seed`'s working-day check and shifted by one
  // day to -49/-14/-84.
  fifteenTeethVisits: [-80, -65, -49, -35, -20, -10] as const,
  threeOpenInvoiceVisits: [-70, -45, -14] as const,
  eightLineItemVisits: [-60, -55] as const,
  fourNoShowDays: [-84, -60, -40, -25] as const,
  /**
   * Outside the -90..+30 appointment window on purpose — the invoice aging
   * spread needs 61-90 and 90+ day overdue buckets, which nothing inside
   * that window can reach. Forced to 'overdue' status in invoices.ts so a
   * random 'paid' roll can't silently remove them from the aging view.
   */
  agingBucket61to90VisitDay: -95,
  agingBucket90PlusVisitDay: -200,
} as const;
