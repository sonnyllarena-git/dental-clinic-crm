import type { SeededRandom } from '../prng';
import type {
  StaffUser,
  Patient,
  Appointment,
  Treatment,
  Invoice,
  AuditLogEntry,
  AuditAction,
} from '@/data/types';
import { addMinutes, toIsoDateTime } from '../referenceDate';

function pickActor(rng: SeededRandom, users: StaffUser[]): string {
  return rng.pick(users).id;
}

export function generateAuditLog(
  rng: SeededRandom,
  clinicId: string,
  users: StaffUser[],
  patients: Patient[],
  appointments: Appointment[],
  treatments: Treatment[],
  invoices: Invoice[],
): AuditLogEntry[] {
  const entries: AuditLogEntry[] = [];

  const log = (opts: {
    userId: string | null;
    action: AuditAction;
    resourceType: string;
    resourceId: string;
    createdAt: string;
    isSensitiveData: boolean;
    changes?: string | null;
  }): void => {
    entries.push({
      id: rng.id('audit'),
      clinicId,
      userId: opts.userId,
      action: opts.action,
      resourceType: opts.resourceType,
      resourceId: opts.resourceId,
      changes: opts.changes ?? null,
      isSensitiveData: opts.isSensitiveData,
      createdAt: opts.createdAt,
    });
  };

  // Every patient record's creation is logged — chronologically anchored
  // to the patient's own createdAt, never invented independently.
  patients.forEach((patient) => {
    log({
      userId: pickActor(rng, users),
      action: 'created',
      resourceType: 'patients',
      resourceId: patient.id,
      createdAt: patient.createdAt,
      isSensitiveData: true,
    });
    if (rng.bool(0.3)) {
      log({
        userId: pickActor(rng, users),
        action: 'accessed',
        resourceType: 'patients',
        resourceId: patient.id,
        createdAt: toIsoDateTime(addMinutes(new Date(patient.updatedAt), rng.int(60, 60 * 24 * 30))),
        isSensitiveData: true,
      });
    }
  });

  rng.pickMany(appointments, Math.min(70, appointments.length)).forEach((appt) => {
    log({
      userId: pickActor(rng, users),
      action: 'created',
      resourceType: 'appointments',
      resourceId: appt.id,
      createdAt: appt.createdAt,
      isSensitiveData: true,
    });
  });

  rng.pickMany(treatments, Math.min(60, treatments.length)).forEach((tx) => {
    log({
      userId: tx.dentistId,
      action: 'created',
      resourceType: 'treatments',
      resourceId: tx.id,
      createdAt: tx.createdAt,
      isSensitiveData: true,
      changes: `Diagnosis recorded: ${tx.diagnosis ?? 'n/a'}`,
    });
  });

  rng.pickMany(invoices, Math.min(50, invoices.length)).forEach((inv) => {
    log({
      userId: pickActor(rng, users),
      action: 'created',
      resourceType: 'invoices',
      resourceId: inv.id,
      createdAt: toIsoDateTime(new Date(`${inv.invoiceDate}T00:00:00Z`)),
      isSensitiveData: true,
    });
    if (inv.sentAt) {
      log({
        userId: pickActor(rng, users),
        action: 'updated',
        resourceType: 'invoices',
        resourceId: inv.id,
        createdAt: inv.sentAt,
        isSensitiveData: true,
        changes: 'Status changed to sent',
      });
    }
  });

  return entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
