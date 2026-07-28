import type { SeededRandom } from '../prng';
import type { Clinic, ClinicSettings } from '@/data/types';
import { CLINIC_LOCATION, CURRENCY } from '../locale/ph';
import { CLINIC_TIMEZONE } from '../referenceDate';

const CLINIC_FOUNDED_AT = new Date('2019-03-01T09:00:00+08:00').toISOString();
const CLINIC_SETTINGS_UPDATED_AT = new Date('2026-05-15T09:00:00+08:00').toISOString();

export function generateClinic(rng: SeededRandom): { clinic: Clinic; settings: ClinicSettings } {
  const clinicId = rng.id('clinic');

  const clinic: Clinic = {
    id: clinicId,
    name: 'Bright Smile Dental Clinic',
    slug: 'bright-smile-dental-makati',
    address: {
      street: '88 Rizal Street',
      barangay: 'Barangay Poblacion',
      city: CLINIC_LOCATION.city,
      province: CLINIC_LOCATION.province,
      zipCode: CLINIC_LOCATION.zipCode,
      country: 'Philippines',
    },
    phone: '+63 2 8812 3456',
    email: 'frontdesk@brightsmile.ph',
    timezone: CLINIC_TIMEZONE,
    currency: CURRENCY,
    isActive: true,
    createdAt: CLINIC_FOUNDED_AT,
    updatedAt: CLINIC_SETTINGS_UPDATED_AT,
  };

  const settings: ClinicSettings = {
    id: rng.id('clinic_settings'),
    clinicId,
    defaultAppointmentDurationMinutes: 30,
    businessHoursStart: '09:00',
    businessHoursEnd: '18:00',
    workingDays: [1, 2, 3, 4, 5, 6],
    autoSendAppointmentReminders: true,
    reminderBeforeMinutes: 24 * 60,
    maxAdvanceBookingDays: 90,
    requireNewPatientForm: true,
    telemedicineEnabled: false,
  };

  return { clinic, settings };
}
