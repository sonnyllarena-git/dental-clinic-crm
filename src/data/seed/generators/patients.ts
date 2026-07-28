import type { SeededRandom } from '../prng';
import type { Patient, PatientAddress, Gender, PatientStatus, PreferredContactMethod } from '@/data/types';
import {
  GIVEN_NAMES_FEMALE,
  GIVEN_NAMES_MALE,
  FAMILY_NAMES,
  BARANGAYS,
  STREET_NAMES,
  LOCATIONS,
  PATIENT_TAGS,
  generateMobilePhone,
  generateEmail,
} from '../locale/ph';
import { REFERENCE_DATE, dateAtDayOffset, toIsoDateTime, toIsoDate, utcDateYMD } from '../referenceDate';
import { PATIENT_INDEX, PATIENT_COUNT } from '../coverageIndex';

const ALL_GIVEN_NAMES = [...GIVEN_NAMES_FEMALE, ...GIVEN_NAMES_MALE];
const CONTACT_METHODS: PreferredContactMethod[] = ['phone', 'email', 'sms'];
const EMERGENCY_RELATIONSHIPS = ['Spouse', 'Parent', 'Sibling', 'Child', 'Friend'];

export interface GeneratedPatients {
  patients: Patient[];
  addresses: PatientAddress[];
}

function dobForAge(age: number, rng: SeededRandom): string {
  const year = REFERENCE_DATE.getUTCFullYear() - age;
  const month = rng.int(0, 12);
  const day = rng.int(1, 28);
  return toIsoDate(utcDateYMD(year, month, day));
}

function buildAddress(rng: SeededRandom, patientId: string): PatientAddress {
  const location = rng.pick(LOCATIONS);
  return {
    id: rng.id('addr'),
    patientId,
    addressType: 'home',
    street: `${rng.int(1, 999)} ${rng.pick(STREET_NAMES)}`,
    barangay: rng.pick(BARANGAYS),
    city: location.city,
    province: location.province,
    zipCode: location.zipCode,
    country: 'Philippines',
    isPrimary: true,
  };
}

function randomBaseName(rng: SeededRandom): {
  firstName: string;
  lastName: string;
  middleName: string | null;
  gender: Gender;
} {
  const gender: Gender = rng.bool(0.5) ? 'F' : 'M';
  const firstName = gender === 'F' ? rng.pick(GIVEN_NAMES_FEMALE) : rng.pick(GIVEN_NAMES_MALE);
  const lastName = rng.pick(FAMILY_NAMES);
  const middleName = rng.bool(0.75) ? rng.pick(FAMILY_NAMES) : null;
  return { firstName, lastName, middleName, gender };
}

/**
 * 60 patients: the "60 tidy patients" the brief warns against would hide
 * bugs, so every named row in the coverage matrix's Patient List and
 * Patient Chart sections is baked in here at a fixed index (see
 * coverageIndex.ts) rather than left to chance.
 */
export function generatePatients(rng: SeededRandom, clinicId: string): GeneratedPatients {
  const patients: Patient[] = [];
  const addresses: PatientAddress[] = [];

  for (let index = 0; index < PATIENT_COUNT; index += 1) {
    const patientId = rng.id('patient');
    const base = randomBaseName(rng);
    let { firstName, lastName, middleName, gender } = base;
    let age = rng.int(19, 75);
    let status: PatientStatus = 'active';
    let tags: string[] = rng.pickMany(PATIENT_TAGS, rng.int(0, 3));

    // --- Coverage-matrix name/status overrides, by fixed index -----------
    if (index === PATIENT_INDEX.longName) {
      firstName = 'Maria Fatima';
      middleName = 'Guadalupe';
      lastName = 'Villanueva-Bautista';
      gender = 'F';
    } else if (index === PATIENT_INDEX.singleName) {
      firstName = 'Grace';
      lastName = 'Tan';
      middleName = null;
      gender = 'F';
    } else if (index === PATIENT_INDEX.nameWithTilde) {
      firstName = 'Isabel';
      lastName = 'Peña';
      middleName = 'Muñoz';
      gender = 'F';
    } else if (index === PATIENT_INDEX.hyphenatedName) {
      firstName = 'Carlo';
      lastName = 'Reyes-Santos';
      middleName = 'Domingo';
      gender = 'M';
    } else if (index === PATIENT_INDEX.sameLastNameTrio[0]) {
      firstName = 'Andres';
      lastName = 'Cruz';
      gender = 'M';
    } else if (index === PATIENT_INDEX.sameLastNameTrio[1]) {
      firstName = 'Beatriz';
      lastName = 'Cruz';
      gender = 'F';
    } else if (index === PATIENT_INDEX.sameLastNameTrio[2]) {
      firstName = 'Carmelo';
      lastName = 'Cruz';
      gender = 'M';
    } else if (index === PATIENT_INDEX.identicalNameDifferentDob[0]) {
      firstName = 'Juan';
      lastName = 'Dela Cruz';
      gender = 'M';
      age = 52;
    } else if (index === PATIENT_INDEX.identicalNameDifferentDob[1]) {
      firstName = 'Juan';
      lastName = 'Dela Cruz';
      gender = 'M';
      age = 27;
    } else if (index === PATIENT_INDEX.inactiveStatus) {
      status = 'inactive';
    } else if (index === PATIENT_INDEX.transferredStatus) {
      status = 'transferred';
    }

    // A couple of general patients carry a name suffix per the locale note.
    if (index === 26) lastName = `${lastName} Jr.`;
    if (index === 42) lastName = `${lastName} III`;

    if (index === PATIENT_INDEX.manyTags) {
      tags = rng.pickMany(PATIENT_TAGS, 6);
    } else if (index === PATIENT_INDEX.noTags) {
      tags = [];
    }

    if (index === PATIENT_INDEX.pediatric) age = 8;
    if (index === PATIENT_INDEX.youngestBoundary) age = 6;
    if (index === PATIENT_INDEX.oldestBoundary) age = 88;

    let email: string | null;
    let phone: string | null;
    if (index === PATIENT_INDEX.nullEmailAndPhone) {
      email = null;
      phone = null;
    } else {
      email = generateEmail(rng, firstName, lastName);
      phone = generateMobilePhone(rng);
    }

    const dateOfBirth = dobForAge(age, rng);
    const isMinor = age < 18;

    const patient: Patient = {
      id: patientId,
      clinicId,
      firstName,
      lastName,
      middleName,
      dateOfBirth,
      gender,
      phone,
      email,
      emergencyContactName: rng.bool(0.9)
        ? `${rng.pick(ALL_GIVEN_NAMES)} ${rng.pick(FAMILY_NAMES)}`
        : null,
      emergencyContactPhone: rng.bool(0.9) ? generateMobilePhone(rng) : null,
      emergencyContactRelationship: isMinor ? 'Parent' : rng.pick(EMERGENCY_RELATIONSHIPS),
      status,
      preferredContactMethod: rng.pick(CONTACT_METHODS),
      prefersSmsReminders: rng.bool(0.8),
      prefersEmailReminders: rng.bool(0.6),
      tags,
      createdAt: toIsoDateTime(dateAtDayOffset(-rng.int(120, 1200))),
      updatedAt: toIsoDateTime(dateAtDayOffset(-rng.int(0, 100))),
    };

    patients.push(patient);
    addresses.push(buildAddress(rng, patientId));
  }

  return { patients, addresses };
}
