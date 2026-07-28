import { repository } from '@/data';
import { useRepositoryQuery } from './useRepositoryQuery';
import { useScenarioStore } from '@/store/scenario.store';
import { applyMonthEndOverlay } from '@/data/scenarios/overlays';
import type { InvoiceFilters } from '@/data/repository';
import type { Invoice, Payment } from '@/data/types';

export function useInvoices(filters: InvoiceFilters = {}) {
  const scenario = useScenarioStore((s) => s.scenario);
  // month-end surfaces the whole billing picture regardless of whatever
  // status tab/filter the caller had selected.
  const effectiveFilters = scenario === 'month-end' ? {} : filters;

  return useRepositoryQuery<Invoice[]>(
    async () => applyMonthEndOverlay(await repository.listInvoices(effectiveFilters), scenario),
    [effectiveFilters.patientId ?? '', effectiveFilters.status ?? '', scenario],
    [],
  );
}

export function useInvoicesForPatient(patientId: string | undefined) {
  return useRepositoryQuery<Invoice[]>(
    () => (patientId ? repository.listInvoicesForPatient(patientId) : Promise.resolve([])),
    [patientId],
    [],
  );
}

export function useInvoice(id: string | undefined) {
  return useRepositoryQuery<Invoice | null>(
    () => (id ? repository.getInvoice(id) : Promise.resolve(null)),
    [id],
    null,
  );
}

export function usePaymentsForInvoice(invoiceId: string | undefined) {
  return useRepositoryQuery<Payment[]>(
    () => (invoiceId ? repository.listPaymentsForInvoice(invoiceId) : Promise.resolve([])),
    [invoiceId],
    [],
  );
}
