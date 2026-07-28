import { repository } from '@/data';
import { useRepositoryQuery } from './useRepositoryQuery';
import type { ReportRange, ReportMetrics } from '@/data/repository';

const EMPTY_REPORT_METRICS: ReportMetrics = {
  totalRevenue: 0,
  invoiceCount: 0,
  paidInvoiceCount: 0,
  overdueInvoiceCount: 0,
  appointmentCount: 0,
  completedAppointmentCount: 0,
  noShowCount: 0,
  cancelledCount: 0,
  showRatePercent: 0,
  revenueByMonth: [],
  appointmentsByProvider: [],
};

export function useReportMetrics(range: ReportRange) {
  return useRepositoryQuery<ReportMetrics>(
    () => repository.getReportMetrics(range),
    [range.start, range.end],
    EMPTY_REPORT_METRICS,
  );
}
