import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '@/data/hooks';
import { useWorkspaceStore } from '@/store/workspace.store';
import { QueryState } from './components/QueryState';
import {
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui';
import { ageAt } from '@/data/demoClock';
import type { PatientStatus } from '@/data/types';

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'transferred', label: 'Transferred' },
];

const STATUS_BADGE_TONE: Record<PatientStatus, 'success' | 'neutral' | 'warning'> = {
  active: 'success',
  inactive: 'neutral',
  transferred: 'warning',
  deceased: 'neutral',
};

export function PatientListPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const { data: patients, isLoading, error } = usePatients({
    search: search || undefined,
    status: status === 'all' ? undefined : (status as PatientStatus),
  });
  const openTab = useWorkspaceStore((s) => s.openTab);
  const navigate = useNavigate();

  const handleOpen = (patientId: string, label: string): void => {
    const result = openTab({ id: patientId, label });
    if (result !== 'blocked') navigate(`/patients/${patientId}`);
  };

  const list = patients ?? [];

  return (
    <div className="p-6">
      <h1 className="font-heading text-xl font-semibold text-ink-primary">Patients</h1>
      <p className="mt-1 text-sm text-ink-secondary">
        {list.length} patient{list.length === 1 ? '' : 's'}
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <Input
          placeholder="Search by name, email, or phone"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search patients"
          className="max-w-sm"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4">
        <QueryState
          isLoading={isLoading}
          error={error}
          isEmpty={list.length === 0}
          emptyMessage={
            search || status !== 'all'
              ? 'No patients match your search or filter.'
              : 'No patients yet.'
          }
          loadingRows={8}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((patient) => {
                const fullName = [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ');
                return (
                  <TableRow key={patient.id}>
                    <TableCell className="max-w-[240px]">
                      <button
                        type="button"
                        onClick={() => handleOpen(patient.id, fullName)}
                        className="truncate text-left font-medium text-ink-primary underline-offset-2 hover:text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        title={fullName}
                      >
                        {fullName}
                      </button>
                    </TableCell>
                    <TableCell className="font-mono">{ageAt(patient.dateOfBirth)}</TableCell>
                    <TableCell className="font-mono text-xs">{patient.phone ?? '—'}</TableCell>
                    <TableCell className="text-xs">{patient.email ?? '—'}</TableCell>
                    <TableCell>
                      <Badge tone={STATUS_BADGE_TONE[patient.status]}>{patient.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {patient.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {patient.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} tone="neutral">
                              {tag}
                            </Badge>
                          ))}
                          {patient.tags.length > 2 ? (
                            <span className="text-xs text-ink-secondary">+{patient.tags.length - 2}</span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs text-ink-secondary">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </QueryState>
      </div>
    </div>
  );
}
