import type { SeededRandom } from '../prng';
import type { StaffUser } from '@/data/types';
import type { Role } from '@/types/roles';
import { generateMobilePhone } from '../locale/ph';
import { REFERENCE_DATE, dateAtDayOffset, toIsoDateTime } from '../referenceDate';

/**
 * 8 staff total: 2 dentists, 2 hygienists, 2 receptionists, 1 clinic
 * manager, 1 admin. The brief's summary count (7) doesn't match its own
 * role breakdown (2+2+2+1+1=8) — conforming to the explicit breakdown
 * since it's what the dashboard's "compare both dentists" and the
 * role-gated nav both need.
 */
interface StaffDef {
  role: Role;
  firstName: string;
  lastName: string;
}

const STAFF_DEFS: StaffDef[] = [
  { role: 'dentist', firstName: 'Isabel', lastName: 'Fernandez' },
  { role: 'dentist', firstName: 'Rafael', lastName: 'Domingo' },
  { role: 'hygienist', firstName: 'Carla', lastName: 'Mercado' },
  { role: 'hygienist', firstName: 'Noel', lastName: 'Salazar' },
  { role: 'receptionist', firstName: 'Joy', lastName: 'Villareal' },
  { role: 'receptionist', firstName: 'Paolo', lastName: 'Ignacio' },
  { role: 'clinic_manager', firstName: 'Teresa', lastName: 'Aguilar' },
  { role: 'admin', firstName: 'Ramon', lastName: 'Castillo' },
];

const CLINICAL_ROLES: Role[] = ['dentist', 'hygienist'];

function prcLicenseNumber(rng: SeededRandom): string {
  return `PRC-${String(rng.int(0, 10_000_000)).padStart(7, '0')}`;
}

export function generateUsers(rng: SeededRandom, clinicId: string): StaffUser[] {
  return STAFF_DEFS.map((def) => {
    const hiredYearsAgo = rng.int(1, 7);
    const hiredAt = new Date(REFERENCE_DATE);
    hiredAt.setUTCFullYear(hiredAt.getUTCFullYear() - hiredYearsAgo);

    const isClinical = CLINICAL_ROLES.includes(def.role);

    const user: StaffUser = {
      id: rng.id('user'),
      clinicId,
      email: `${def.firstName.toLowerCase()}.${def.lastName.toLowerCase()}@brightsmile.ph`,
      role: def.role,
      status: 'active',
      firstName: def.firstName,
      lastName: def.lastName,
      phone: generateMobilePhone(rng),
      avatarUrl: null,
      emailVerified: true,
      lastLoginAt: toIsoDateTime(dateAtDayOffset(-rng.int(0, 5))),
      licenseNumber: isClinical ? prcLicenseNumber(rng) : null,
      licenseState: null, // PRC licenses aren't state-scoped — see Stage 0 schema note
      npiNumber: null, // US-specific, not applicable in PH
      deaNumber: null, // US-specific, not applicable in PH
      createdAt: toIsoDateTime(hiredAt),
      updatedAt: toIsoDateTime(hiredAt),
    };
    return user;
  });
}
