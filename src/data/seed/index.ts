import { createSeededRandom, SEED } from './prng';
import type { SeedDataset } from '@/data/types';
import { generateClinic } from './generators/clinic';
import { generateUsers } from './generators/users';
import { generateAppointmentTypes } from './generators/appointmentTypes';
import { generatePatients } from './generators/patients';
import { generateMedicalHistories } from './generators/medicalHistory';
import { generateInsurance } from './generators/insurance';
import { generateAppointments } from './generators/appointments';
import { generateTreatments } from './generators/treatments';
import { generateClinicalNotes } from './generators/clinicalNotes';
import { generateInvoices } from './generators/invoices';
import { generatePayments } from './generators/payments';
import { generateInventory } from './generators/inventory';
import { generateAuditLog } from './generators/auditLog';

export { SEED } from './prng';
export { REFERENCE_DATE } from './referenceDate';

/**
 * Builds one clinic's worth of deterministic mock data, entity by entity,
 * in the dependency order the brief specifies: clinic -> users ->
 * appointment types -> patients -> medical history -> insurance ->
 * appointments -> treatments -> notes -> invoices -> payments ->
 * inventory -> audit log. Pure and side-effect free — persistence
 * (Dexie) is a Stage 2 concern layered on top of this, never inside it.
 */
export function buildSeedDataset(seed: string = SEED): SeedDataset {
  const rng = createSeededRandom(seed);

  const { clinic, settings } = generateClinic(rng);
  const users = generateUsers(rng, clinic.id);
  const appointmentTypes = generateAppointmentTypes(rng, clinic.id);
  const { patients, addresses } = generatePatients(rng, clinic.id);
  const medicalHistories = generateMedicalHistories(rng, patients);
  const { providers: insuranceProviders, patientInsurance } = generateInsurance(rng, clinic.id, patients);
  const appointments = generateAppointments(rng, clinic.id, users, patients, appointmentTypes);
  const treatments = generateTreatments(rng, clinic.id, patients, appointments, appointmentTypes, users);
  const clinicalNotes = generateClinicalNotes(rng, clinic.id, treatments, 120);
  const { invoices, hints } = generateInvoices(rng, clinic.id, patients, treatments);
  const payments = generatePayments(rng, clinic.id, invoices, hints);
  const { suppliers: inventorySuppliers, items: inventoryItems } = generateInventory(rng, clinic.id);
  const auditLog = generateAuditLog(rng, clinic.id, users, patients, appointments, treatments, invoices);

  return {
    clinic,
    clinicSettings: settings,
    users,
    appointmentTypes,
    patients,
    patientAddresses: addresses,
    medicalHistories,
    insuranceProviders,
    patientInsurance,
    appointments,
    treatments,
    clinicalNotes,
    invoices,
    payments,
    inventorySuppliers,
    inventoryItems,
    auditLog,
  };
}
