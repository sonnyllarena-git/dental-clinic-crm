import type { Patient } from '@/data/types';
import { useTreatmentsForPatient } from '@/data/hooks';
import { TREATMENT_STATUS_LABEL } from '../odontogram/statusStyles';
import { QueryState } from './QueryState';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/format';

export function PatientTreatmentsTab({ patient }: { patient: Patient }) {
  const { data: treatments, isLoading, error } = useTreatmentsForPatient(patient.id);
  const sorted = [...(treatments ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <QueryState
      isLoading={isLoading}
      error={error}
      isEmpty={sorted.length === 0}
      emptyMessage="No treatments recorded for this patient yet."
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Procedure</TableHead>
            <TableHead>Tooth</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Recorded</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((t) => (
            <TableRow key={t.id}>
              <TableCell>
                <span className="font-mono text-xs text-ink-secondary">{t.procedureCode}</span> {t.procedureName}
              </TableCell>
              <TableCell className="font-mono">
                {t.toothNumber ?? '—'}
                {t.surface ? ` (${t.surface})` : ''}
              </TableCell>
              <TableCell>{TREATMENT_STATUS_LABEL[t.status]}</TableCell>
              <TableCell className="font-mono">{formatCurrency(t.actualCost ?? t.estimatedCost)}</TableCell>
              <TableCell className="font-mono text-xs">{formatDate(t.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </QueryState>
  );
}
