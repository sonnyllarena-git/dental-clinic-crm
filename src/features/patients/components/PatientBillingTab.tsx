import type { Patient, InvoiceStatus } from '@/data/types';
import { useInvoicesForPatient } from '@/data/hooks';
import { QueryState } from './QueryState';
import { Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/format';

type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

const STATUS_TONE: Record<InvoiceStatus, BadgeTone> = {
  draft: 'neutral',
  sent: 'neutral',
  viewed: 'accent',
  partially_paid: 'warning',
  paid: 'success',
  overdue: 'danger',
  cancelled: 'neutral',
};

export function PatientBillingTab({ patient }: { patient: Patient }) {
  const { data: invoices, isLoading, error } = useInvoicesForPatient(patient.id);
  const list = invoices ?? [];
  const openInvoices = list.filter((inv) => inv.status !== 'paid' && inv.status !== 'cancelled');
  const totalOutstanding = openInvoices.reduce((sum, inv) => sum + inv.amountDue, 0);

  return (
    <QueryState isLoading={isLoading} error={error} isEmpty={list.length === 0} emptyMessage="No invoices for this patient yet.">
      <div className="mb-4 flex items-center justify-between rounded-md border border-hairline bg-surface-raised p-4">
        <div>
          <p className="text-xs text-ink-secondary">Outstanding balance</p>
          <p className="font-mono text-lg font-semibold text-ink-primary">{formatCurrency(totalOutstanding)}</p>
        </div>
        <p className="text-xs text-ink-secondary">
          {openInvoices.length} open invoice{openInvoices.length === 1 ? '' : 's'}
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Due</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-mono text-xs">{invoice.invoiceNumber}</TableCell>
              <TableCell className="font-mono text-xs">{formatDate(invoice.invoiceDate)}</TableCell>
              <TableCell className="font-mono text-xs">{formatDate(invoice.dueDate)}</TableCell>
              <TableCell className="font-mono">{formatCurrency(invoice.totalAmount)}</TableCell>
              <TableCell className="font-mono">{formatCurrency(invoice.amountDue)}</TableCell>
              <TableCell>
                <Badge tone={STATUS_TONE[invoice.status]}>{invoice.status.replace('_', ' ')}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </QueryState>
  );
}
