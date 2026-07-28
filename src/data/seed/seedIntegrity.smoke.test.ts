import { describe, it, expect } from 'vitest';
import { buildSeedDataset, SEED } from './index';

describe('buildSeedDataset (Stage 1 smoke test)', () => {
  it('builds without throwing and produces roughly-expected volumes', () => {
    const dataset = buildSeedDataset();

    expect(dataset.patients).toHaveLength(60);
    expect(dataset.users).toHaveLength(8);
    expect(dataset.appointmentTypes).toHaveLength(8);
    expect(dataset.insuranceProviders).toHaveLength(6);
    expect(dataset.inventorySuppliers).toHaveLength(6);
    expect(dataset.inventoryItems).toHaveLength(45);

    expect(dataset.appointments.length).toBeGreaterThan(150);
    expect(dataset.appointments.length).toBeLessThan(300);

    expect(dataset.treatments.length).toBeGreaterThan(100);
    expect(dataset.invoices.length).toBeGreaterThan(50);
    expect(dataset.payments.length).toBeGreaterThan(30);
    expect(dataset.auditLog.length).toBeGreaterThan(200);
  });

  it('is deterministic — same seed produces byte-identical output', () => {
    const a = buildSeedDataset(SEED);
    const b = buildSeedDataset(SEED);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('never double-books a provider', () => {
    const { appointments } = buildSeedDataset();
    const byProvider = new Map<string, typeof appointments>();
    appointments.forEach((a) => {
      const list = byProvider.get(a.providerId) ?? [];
      list.push(a);
      byProvider.set(a.providerId, list);
    });
    byProvider.forEach((list) => {
      const sorted = [...list].sort((a, b) => a.startTime.localeCompare(b.startTime));
      for (let i = 1; i < sorted.length; i += 1) {
        expect(new Date(sorted[i].startTime).getTime()).toBeGreaterThanOrEqual(
          new Date(sorted[i - 1].endTime).getTime(),
        );
      }
    });
  });

  it('keeps every invoice arithmetically consistent', () => {
    const { invoices } = buildSeedDataset();
    invoices.forEach((inv) => {
      expect(inv.subtotal + inv.taxAmount - inv.discountAmount).toBe(inv.totalAmount);
      expect(inv.amountPaid + inv.amountDue).toBe(inv.totalAmount);
    });
  });

  it("sums payments to each invoice's amountPaid", () => {
    const { invoices, payments } = buildSeedDataset();
    const paidByInvoice = new Map<string, number>();
    payments.forEach((p) => paidByInvoice.set(p.invoiceId, (paidByInvoice.get(p.invoiceId) ?? 0) + p.amount));
    invoices.forEach((inv) => {
      const paid = paidByInvoice.get(inv.id) ?? 0;
      expect(paid).toBe(inv.amountPaid);
    });
  });

  it('never lets a completed treatment predate its appointment', () => {
    const { treatments, appointments } = buildSeedDataset();
    const apptById = new Map(appointments.map((a) => [a.id, a]));
    treatments
      .filter((t) => t.status === 'completed' && t.appointmentId)
      .forEach((t) => {
        const appt = apptById.get(t.appointmentId as string);
        expect(appt).toBeDefined();
        if (appt) {
          expect(new Date(t.completedAt as string).getTime()).toBeGreaterThanOrEqual(
            new Date(appt.startTime).getTime(),
          );
        }
      });
  });
});
