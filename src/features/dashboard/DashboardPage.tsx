import { Link } from 'react-router-dom';
import { usePatients, useReportMetrics } from '@/data/hooks';
import { dateAtDayOffset, toIsoDate } from '@/data/demoClock';
import { formatCurrency } from '@/lib/format';
import { Skeleton } from '@/components/ui';

const REPORT_RANGE = {
  start: toIsoDate(dateAtDayOffset(-365)),
  end: toIsoDate(dateAtDayOffset(30)),
};

/**
 * Real seeded numbers now that the patient list/chart and data layer are
 * wired up — but still not the actual role-scoped KPI dashboard (charts,
 * per-role scoping, comparisons) the brief describes; that's Stage 6.
 */
export function DashboardPage() {
  const { data: patients, isLoading: patientsLoading } = usePatients();
  const { data: metrics, isLoading: metricsLoading } = useReportMetrics(REPORT_RANGE);
  const isLoading = patientsLoading || metricsLoading;

  return (
    <div className="p-6">
      <h1 className="font-heading text-xl font-semibold text-ink-primary">Dashboard</h1>
      <p className="mt-1 max-w-prose text-sm text-ink-secondary">
        Full role-scoped KPIs and charts arrive in Stage 6. These are quick totals from the seeded data in
        the meantime.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {isLoading ? (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : (
          <>
            <StatCard label="Total patients" value={String(patients?.length ?? 0)} />
            <StatCard label="Appointments" value={String(metrics?.appointmentCount ?? 0)} />
            <StatCard label="Show rate" value={`${metrics?.showRatePercent ?? 0}%`} />
            <StatCard label="Revenue collected" value={formatCurrency(metrics?.totalRevenue ?? 0)} />
          </>
        )}
      </div>

      <Link
        to="/patients"
        className="mt-6 inline-flex items-center gap-1.5 rounded-md border border-hairline bg-surface-raised px-3.5 py-2 text-sm font-medium text-ink-primary hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        Go to Patients →
      </Link>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-hairline bg-surface-raised p-4">
      <p className="text-xs text-ink-secondary">{label}</p>
      <p className="mt-1 font-mono text-xl font-semibold text-ink-primary">{value}</p>
    </div>
  );
}
