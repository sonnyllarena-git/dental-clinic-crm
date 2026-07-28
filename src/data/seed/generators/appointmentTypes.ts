import type { SeededRandom } from '../prng';
import type { AppointmentType } from '@/data/types';

interface AppointmentTypeDef {
  name: string;
  description: string;
  durationMinutes: number;
  colorHex: string;
}

const APPOINTMENT_TYPE_DEFS: AppointmentTypeDef[] = [
  { name: 'Cleaning', description: 'Routine prophylaxis and oral hygiene maintenance.', durationMinutes: 30, colorHex: '#2563EB' },
  { name: 'Exam', description: 'Periodic oral evaluation, with radiographs as needed.', durationMinutes: 20, colorHex: '#0EA5E9' },
  { name: 'Filling', description: 'Restorative treatment for carious lesions.', durationMinutes: 45, colorHex: '#7C3AED' },
  { name: 'Root Canal', description: 'Endodontic therapy for irreversible pulpitis or necrosis.', durationMinutes: 90, colorHex: '#DC2626' },
  { name: 'Crown', description: 'Full-coverage restoration, prep and/or seat.', durationMinutes: 60, colorHex: '#CA8A04' },
  { name: 'Extraction', description: 'Surgical or simple extraction of an erupted tooth.', durationMinutes: 45, colorHex: '#EA580C' },
  { name: 'Consultation', description: 'New-patient or second-opinion consultation, no procedure performed.', durationMinutes: 20, colorHex: '#059669' },
  { name: 'Emergency', description: 'Same-day urgent visit for acute pain or trauma.', durationMinutes: 30, colorHex: '#BE123C' },
];

export function generateAppointmentTypes(rng: SeededRandom, clinicId: string): AppointmentType[] {
  return APPOINTMENT_TYPE_DEFS.map((def) => ({
    id: rng.id('apptType'),
    clinicId,
    name: def.name,
    description: def.description,
    durationMinutes: def.durationMinutes,
    colorHex: def.colorHex,
    isActive: true,
  }));
}
