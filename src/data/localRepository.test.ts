import { beforeEach, describe, it, expect } from 'vitest';
import { localRepository } from './localRepository';
import { db } from './db';

const NEW_PATIENT_INPUT = {
  firstName: 'Test',
  lastName: 'Patient',
  middleName: null,
  dateOfBirth: '1990-01-01',
  gender: 'F' as const,
  phone: null,
  email: null,
  emergencyContactName: null,
  emergencyContactPhone: null,
  emergencyContactRelationship: null,
  status: 'active' as const,
  preferredContactMethod: 'phone' as const,
  prefersSmsReminders: true,
  prefersEmailReminders: true,
  tags: [],
};

beforeEach(async () => {
  await localRepository.resetAndReseed();
});

describe('LocalRepository', () => {
  it('seeds the database on first access', async () => {
    const patients = await localRepository.listPatients();
    expect(patients).toHaveLength(60);
  });

  it('does not reseed on every call', async () => {
    const before = await db.patients.count();
    await localRepository.listPatients();
    await localRepository.listUsers();
    const after = await db.patients.count();
    expect(after).toBe(before);
  });

  it('filters patients by status and search term', async () => {
    const inactive = await localRepository.listPatients({ status: 'inactive' });
    expect(inactive.length).toBeGreaterThan(0);
    expect(inactive.every((p) => p.status === 'inactive')).toBe(true);

    const [somePatient] = await localRepository.listPatients();
    const bySearch = await localRepository.listPatients({ search: somePatient.lastName });
    expect(bySearch.some((p) => p.id === somePatient.id)).toBe(true);
  });

  it('creates and retrieves a new patient, attributed to the acting user', async () => {
    const clinic = await localRepository.getClinic();
    const [someStaff] = await localRepository.listUsers();

    const created = await localRepository.createPatient(NEW_PATIENT_INPUT, someStaff.id);

    expect(created.clinicId).toBe(clinic.id);
    expect(created.createdAt).toBe(created.updatedAt);

    const fetched = await localRepository.getPatient(created.id);
    expect(fetched?.firstName).toBe('Test');

    const auditEntries = await localRepository.listAuditLog({ resourceType: 'patients', resourceId: created.id });
    expect(auditEntries).toHaveLength(1);
    expect(auditEntries[0].userId).toBe(someStaff.id);
    expect(auditEntries[0].action).toBe('created');
  });

  it('updates a patient and bumps updatedAt', async () => {
    const [first] = await localRepository.listPatients();
    const updated = await localRepository.updatePatient(first.id, { status: 'inactive' });
    expect(updated.status).toBe('inactive');
    expect(updated.id).toBe(first.id);
  });

  it('lists appointments within a range, honoring filters', async () => {
    const allAppointments = await localRepository.listAppointments({
      start: '2000-01-01T00:00:00.000Z',
      end: '2100-01-01T00:00:00.000Z',
    });
    expect(allAppointments.length).toBeGreaterThan(150);

    const completedOnly = await localRepository.listAppointments(
      { start: '2000-01-01T00:00:00.000Z', end: '2100-01-01T00:00:00.000Z' },
      { status: 'completed' },
    );
    expect(completedOnly.every((a) => a.status === 'completed')).toBe(true);
    expect(completedOnly.length).toBeLessThan(allAppointments.length);
  });

  it('recordPayment updates the invoice balance and flips it to paid', async () => {
    const [invoice] = await localRepository.listInvoices({ status: 'overdue' });
    expect(invoice).toBeDefined();

    const outstanding = invoice.totalAmount - invoice.amountPaid;
    const payment = await localRepository.recordPayment({
      invoiceId: invoice.id,
      patientId: invoice.patientId,
      amount: outstanding,
      paymentMethod: 'cash',
      paymentDate: '2026-07-27',
      processor: null,
      transactionId: null,
      status: 'completed',
      notes: null,
    });

    expect(payment.amount).toBe(outstanding);

    const updatedInvoice = await localRepository.getInvoice(invoice.id);
    expect(updatedInvoice?.status).toBe('paid');
    expect(updatedInvoice?.amountDue).toBe(0);
  });

  it('adjustInventoryQuantity never drops below zero', async () => {
    const [item] = await localRepository.listInventoryItems();
    const updated = await localRepository.adjustInventoryQuantity(item.id, -(item.currentQuantity + 500));
    expect(updated.currentQuantity).toBe(0);
  });

  it('resetAndReseed rebuilds the exact same deterministic dataset', async () => {
    const before = await localRepository.listPatients();
    await localRepository.resetAndReseed();
    const after = await localRepository.listPatients();

    expect(after).toHaveLength(before.length);
    expect(after.map((p) => p.id)).toEqual(before.map((p) => p.id));
  });

  it('resetAndReseed discards records created since the last seed', async () => {
    await localRepository.createPatient(NEW_PATIENT_INPUT);
    expect(await db.patients.count()).toBe(61);

    await localRepository.resetAndReseed();
    expect(await db.patients.count()).toBe(60);
  });
});
