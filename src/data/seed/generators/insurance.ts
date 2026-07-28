import type { SeededRandom } from '../prng';
import type { Patient, InsuranceProvider, PatientInsurance, SubscriberRelationship } from '@/data/types';
import { INSURANCE_PROVIDER_DEFS, generateLandlinePhone } from '../locale/ph';
import { dateAtDayOffset, toIsoDate, ageAt } from '../referenceDate';
import { PATIENT_INDEX, UNINSURED_PATIENT_INDICES } from '../coverageIndex';

export interface GeneratedInsurance {
  providers: InsuranceProvider[];
  patientInsurance: PatientInsurance[];
}

function providerEmail(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z ]/g, '')
    .split(' ')[0];
  return `support@${slug}.ph`;
}

function buildPolicy(
  rng: SeededRandom,
  patient: Patient,
  clinicId: string,
  provider: InsuranceProvider,
  isPrimary: boolean,
  index: number,
): PatientInsurance {
  const age = ageAt(patient.dateOfBirth);
  const isMinor = age < 18;

  const subscriberRelationship: SubscriberRelationship = isMinor ? 'child' : 'self';
  const subscriberName = isMinor
    ? (patient.emergencyContactName ?? `${patient.firstName}'s Parent`)
    : `${patient.firstName} ${patient.lastName}`;
  const subscriberDob = isMinor ? toIsoDate(dateAtDayOffset(-rng.int(11_000, 18_000))) : patient.dateOfBirth;

  // Government (PhilHealth) case-rate coverage has no deductible concept;
  // private HMO records populate deductible/annualMax so the brief's
  // required "deductible met" / "annual max exhausted" UI states exist.
  let deductible = provider.isGovernment ? 0 : rng.pick([1500, 2000, 3000, 5000]);
  let deductibleMet = provider.isGovernment ? 0 : rng.int(0, deductible + 1);
  let annualMax = provider.isGovernment ? 50000 : rng.pick([30000, 50000, 75000, 100000]);
  let annualUsed = rng.int(0, Math.floor(annualMax * 0.6));
  let verifiedAt: string | null = rng.bool(0.8) ? toIsoDate(dateAtDayOffset(-rng.int(5, 300))) : null;
  let benefitsLastCheckedAt: string | null = verifiedAt;
  let terminationDate: string | null = null;
  let isActive = true;

  if (index === PATIENT_INDEX.deductibleFullyMet) {
    deductible = 3000;
    deductibleMet = 3000;
  } else if (index === PATIENT_INDEX.deductibleBarelyStarted) {
    deductible = 3000;
    deductibleMet = 200;
  } else if (index === PATIENT_INDEX.annualMaxNearlyExhausted) {
    annualMax = 30000;
    annualUsed = 28500;
  } else if (index === PATIENT_INDEX.expiredInsurancePolicy) {
    terminationDate = toIsoDate(dateAtDayOffset(-rng.int(30, 90)));
    isActive = false;
  } else if (index === PATIENT_INDEX.neverVerifiedInsurancePolicy) {
    verifiedAt = null;
    benefitsLastCheckedAt = null;
  }

  return {
    id: rng.id('pins'),
    patientId: patient.id,
    clinicId,
    insuranceProviderId: provider.id,
    insuranceType: provider.isGovernment ? 'government' : 'hmo',
    policyNumber: `POL-${rng.int(100_000, 999_999)}`,
    groupNumber: provider.isGovernment ? null : `GRP-${rng.int(1000, 9999)}`,
    memberId: `MEM-${rng.int(100_000, 999_999)}`,
    subscriberName,
    subscriberRelationship,
    subscriberDob,
    deductible,
    deductibleMet,
    annualMax,
    annualUsed,
    preventiveCoverage: provider.isGovernment ? 100 : 100,
    basicCoverage: provider.isGovernment ? 50 : 80,
    majorCoverage: provider.isGovernment ? 30 : 50,
    orthoCoverage: provider.isGovernment ? 0 : 20,
    effectiveDate: toIsoDate(dateAtDayOffset(-rng.int(400, 1800))),
    terminationDate,
    isPrimary,
    isActive,
    verifiedAt,
    benefitsLastCheckedAt,
  };
}

export function generateInsurance(
  rng: SeededRandom,
  clinicId: string,
  patients: Patient[],
): GeneratedInsurance {
  const providers: InsuranceProvider[] = INSURANCE_PROVIDER_DEFS.map((def) => ({
    id: rng.id('insprov'),
    clinicId,
    name: def.name,
    contactPhone: generateLandlinePhone(rng),
    contactEmail: providerEmail(def.name),
    website: def.website,
    preAuthRequired: !def.isGovernment,
    isGovernment: def.isGovernment,
  }));

  const philHealth = providers.find((p) => p.isGovernment) ?? providers[0];
  const hmos = providers.filter((p) => !p.isGovernment);

  const patientInsurance: PatientInsurance[] = [];

  patients.forEach((patient, index) => {
    if (UNINSURED_PATIENT_INDICES.includes(index)) return;

    const forcesHmo = (
      [
        PATIENT_INDEX.deductibleFullyMet,
        PATIENT_INDEX.deductibleBarelyStarted,
        PATIENT_INDEX.annualMaxNearlyExhausted,
      ] as number[]
    ).includes(index);

    const primaryProvider = forcesHmo ? hmos[0] : rng.bool(0.5) ? philHealth : rng.pick(hmos);
    patientInsurance.push(buildPolicy(rng, patient, clinicId, primaryProvider, true, index));

    if (index === PATIENT_INDEX.dualInsurance) {
      const secondaryProvider = primaryProvider.id === philHealth.id ? rng.pick(hmos) : philHealth;
      patientInsurance.push(buildPolicy(rng, patient, clinicId, secondaryProvider, false, index));
    }
  });

  return { providers, patientInsurance };
}
