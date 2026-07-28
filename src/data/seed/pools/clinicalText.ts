import type { SeededRandom } from '../prng';

/**
 * Template sentence pools for SOAP clinical notes. Not a language model —
 * a fixed set of clinically-plausible sentences composed 2-4 at a time per
 * field, which is standard practice for seed data and keeps generation
 * pure and deterministic.
 */

const SUBJECTIVE_SENTENCES = [
  'Patient reports mild sensitivity to cold and sweet foods in the affected area for the past two weeks.',
  'Patient presents for a scheduled recall visit with no active complaints.',
  'Patient reports intermittent dull ache, worse when chewing on that side.',
  'Patient noticed a visible chip after biting into hard food.',
  'Patient reports gum bleeding when brushing, ongoing for about a month.',
  'Patient requests evaluation of a longstanding area of discoloration.',
  'Patient reports no pain but is due for routine hygiene maintenance.',
  'Patient reports throbbing pain that started suddenly, rated 7 out of 10.',
  'Patient denies any recent trauma or new symptoms since the last visit.',
  'Patient reports difficulty flossing around the area due to tightness of contact.',
];

const OBJECTIVE_SENTENCES = [
  'Extraoral exam unremarkable.',
  'Intraoral exam reveals localized gingival inflammation with mild plaque buildup.',
  'Radiographic examination shows no evidence of periapical pathology.',
  'Existing restorations appear intact with no marginal breakdown noted.',
  'Percussion and palpation testing were within normal limits.',
  'Periodontal probing depths averaged 2 to 3 millimeters throughout.',
  'Soft tissues appear healthy and pink with good stippling.',
  'Cold test elicited a lingering response in the tooth in question.',
  'Visual and tactile examination reveals a carious lesion consistent with the chief complaint.',
  'No lesions or areas of concern noted on soft tissue exam.',
];

const ASSESSMENT_SENTENCES = [
  'Findings consistent with early interproximal caries requiring restorative treatment.',
  'Clinical picture consistent with reversible pulpitis, no endodontic involvement expected.',
  'Diagnosis of irreversible pulpitis warranting root canal therapy.',
  'Mild gingivitis attributable to plaque accumulation, responsive to improved oral hygiene.',
  'No acute findings; patient is a good candidate for routine preventive care.',
  'Structural compromise of existing restoration necessitating replacement.',
  'Findings support extraction given the extent of structural loss.',
  'Overall oral health stable since the last recall visit.',
];

const PLAN_SENTENCES = [
  'Proceed with restoration at today\'s visit; reviewed post-operative sensitivity precautions with patient.',
  'Scheduled for follow-up in two weeks to reassess symptoms before further intervention.',
  'Recommended prophylaxis and reinforced oral hygiene instruction; patient advised to return in six months.',
  'Referred for root canal therapy; patient counseled on procedure, risks, and alternatives.',
  'Extraction planned; discussed post-extraction care and replacement options.',
  'Continue monitoring; no treatment indicated at this time.',
  'Prescribed appropriate home care regimen and scheduled routine recall.',
  'Discussed findings and treatment options with patient, who consented to proceed.',
];

const DIAGNOSIS_SENTENCES = [
  'Interproximal caries confirmed on clinical and radiographic exam.',
  'Irreversible pulpitis with associated periapical sensitivity.',
  'Fractured cusp with compromised structural integrity.',
  'Generalized mild gingivitis secondary to plaque accumulation.',
  'Non-restorable tooth due to extent of decay.',
  'Stable periodontal status with no active disease noted.',
];

const TREATMENT_PLAN_SENTENCES = [
  'Restore with direct composite or amalgam as clinically indicated.',
  'Proceed with root canal therapy followed by a full-coverage crown.',
  'Extract and discuss replacement options at a follow-up visit.',
  'Continue routine prophylaxis on a six-month recall schedule.',
  'Scale and root plane affected quadrant, reassess in four to six weeks.',
  'Monitor at next recall visit; no active intervention required.',
];

function composeSentences(rng: SeededRandom, pool: string[], count: number): string {
  return rng.pickMany(pool, count).join(' ');
}

export function generateSoapNote(rng: SeededRandom): {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
} {
  return {
    subjective: composeSentences(rng, SUBJECTIVE_SENTENCES, rng.int(2, 5)),
    objective: composeSentences(rng, OBJECTIVE_SENTENCES, rng.int(2, 5)),
    assessment: composeSentences(rng, ASSESSMENT_SENTENCES, rng.int(2, 4)),
    plan: composeSentences(rng, PLAN_SENTENCES, rng.int(2, 4)),
  };
}

export function generateDiagnosis(rng: SeededRandom): string {
  return rng.pick(DIAGNOSIS_SENTENCES);
}

export function generateTreatmentPlanText(rng: SeededRandom): string {
  return rng.pick(TREATMENT_PLAN_SENTENCES);
}

export const DENTAL_ANXIETY_NOTE =
  'Patient has a documented history of dental anxiety; prefers a slower pace, frequent check-ins during procedures, and clear explanation before any instrument is used.';
