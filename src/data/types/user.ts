import type { Role } from '@/types/roles';

export type StaffStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';

/**
 * Mirrors `users` in the schema. `licenseState`, `npiNumber`, and
 * `deaNumber` are US-specific concepts (state-scoped licensing, National
 * Provider Identifier, DEA registration) that don't map to PH practice —
 * they stay on the type for schema fidelity but are always null for this
 * locale. `licenseNumber` holds a PRC (Professional Regulation Commission)
 * license number for clinical staff instead.
 */
export interface StaffUser {
  id: string;
  clinicId: string;
  email: string;
  role: Role;
  status: StaffStatus;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  lastLoginAt: string | null;
  licenseNumber: string | null;
  licenseState: string | null;
  npiNumber: string | null;
  deaNumber: string | null;
  createdAt: string;
  updatedAt: string;
}
