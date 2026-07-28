export interface InsuranceProvider {
  id: string;
  clinicId: string;
  name: string;
  contactPhone: string | null;
  contactEmail: string | null;
  website: string | null;
  preAuthRequired: boolean;
  /** True for PhilHealth, false for private HMOs — drives the approval-based coverage model. */
  isGovernment: boolean;
}

export type InsuranceType = 'government' | 'hmo';
export type SubscriberRelationship = 'self' | 'spouse' | 'child' | 'parent';

export interface PatientInsurance {
  id: string;
  patientId: string;
  clinicId: string;
  insuranceProviderId: string;
  insuranceType: InsuranceType;
  policyNumber: string;
  groupNumber: string | null;
  memberId: string | null;
  subscriberName: string;
  subscriberRelationship: SubscriberRelationship;
  subscriberDob: string | null;
  /**
   * HMO coverage in PH is approval-based rather than US-style
   * deductible/coinsurance. These fields are kept for schema fidelity;
   * HMO records set deductible to 0 and use annualMax as the approval
   * ceiling rather than a true insurance deductible.
   */
  deductible: number;
  deductibleMet: number;
  annualMax: number;
  annualUsed: number;
  preventiveCoverage: number;
  basicCoverage: number;
  majorCoverage: number;
  orthoCoverage: number;
  effectiveDate: string;
  terminationDate: string | null;
  isPrimary: boolean;
  isActive: boolean;
  verifiedAt: string | null;
  benefitsLastCheckedAt: string | null;
}
