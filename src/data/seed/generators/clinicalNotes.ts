import type { SeededRandom } from '../prng';
import type { Treatment, ClinicalNote } from '@/data/types';
import { generateSoapNote } from '../pools/clinicalText';

/**
 * Not every treatment gets a formal SOAP note (~120 notes from ~160+
 * treatments) — only completed ones are eligible, and a random subset of
 * those is chosen, same as a real clinic where documentation depth varies.
 */
export function generateClinicalNotes(
  rng: SeededRandom,
  clinicId: string,
  treatments: Treatment[],
  targetCount: number,
): ClinicalNote[] {
  const eligible = treatments.filter((t) => t.status === 'completed');
  const chosen = rng.pickMany(eligible, Math.min(targetCount, eligible.length));

  return chosen.map((treatment) => {
    const soap = generateSoapNote(rng);
    const note: ClinicalNote = {
      id: rng.id('note'),
      clinicId,
      treatmentId: treatment.id,
      subjective: soap.subjective,
      objective: soap.objective,
      assessment: soap.assessment,
      plan: soap.plan,
      providerId: treatment.dentistId,
      createdAt: treatment.completedAt ?? treatment.createdAt,
    };
    return note;
  });
}
