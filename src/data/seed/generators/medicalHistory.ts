import type { SeededRandom } from '../prng';
import type { Patient, PatientMedicalHistory } from '@/data/types';
import { ALLERGY_POOL, MEDICATION_POOL, MEDICAL_CONDITION_POOL } from '../locale/ph';
import { dateAtDayOffset, toIsoDate, ageAt } from '../referenceDate';
import { PATIENT_INDEX } from '../coverageIndex';
import { DENTAL_ANXIETY_NOTE } from '../pools/clinicalText';

export function generateMedicalHistories(
  rng: SeededRandom,
  patients: Patient[],
): PatientMedicalHistory[] {
  return patients.map((patient, index) => {
    const age = ageAt(patient.dateOfBirth);
    const isMinor = age < 18;

    let allergies = rng.bool(0.4) ? rng.pickMany(ALLERGY_POOL, rng.int(1, 3)) : [];
    let isAnxious = rng.bool(0.12);
    let dentalAnxietyNotes: string | null = isAnxious
      ? 'Patient becomes visibly tense during procedures; prefers advance notice of each step.'
      : null;

    if (index === PATIENT_INDEX.sixAllergies) {
      allergies = rng.pickMany(ALLERGY_POOL, 6);
    } else if (index === PATIENT_INDEX.noAllergies) {
      allergies = [];
    }

    if (index === PATIENT_INDEX.anxious) {
      isAnxious = true;
      dentalAnxietyNotes = DENTAL_ANXIETY_NOTE;
    }

    const canBePregnant = !isMinor && patient.gender === 'F' && age <= 45;
    const isPregnant = canBePregnant && rng.bool(0.06);

    const lastExamDate = rng.bool(0.85) ? toIsoDate(dateAtDayOffset(-rng.int(10, 360))) : null;
    const lastCleaningDate = rng.bool(0.85) ? toIsoDate(dateAtDayOffset(-rng.int(10, 360))) : null;

    const history: PatientMedicalHistory = {
      patientId: patient.id,
      allergies,
      currentMedications: isMinor || rng.bool(0.55) ? [] : rng.pickMany(MEDICATION_POOL, rng.int(1, 2)),
      medicalConditions: isMinor || rng.bool(0.6) ? [] : rng.pickMany(MEDICAL_CONDITION_POOL, rng.int(1, 2)),
      surgeries: rng.bool(0.15) ? 'Wisdom tooth extraction, uncomplicated.' : null,
      brushFrequency: rng.pick(['Daily', '2x daily', 'Occasional']),
      flossFrequency: rng.pick(['Daily', 'A few times a week', 'Rarely', 'Never']),
      mouthwashFrequency: rng.pick(['Daily', 'Occasional', 'Never']),
      tobaccoUse: isMinor ? false : rng.bool(0.15),
      alcoholUse: isMinor ? false : rng.bool(0.25),
      isPregnant,
      pregnancyTrimester: isPregnant ? rng.int(1, 4) : null,
      lastExamDate,
      lastCleaningDate,
      isAnxious,
      dentalAnxietyNotes,
      prefersNitrousOxide: isAnxious && rng.bool(0.5),
    };

    return history;
  });
}
