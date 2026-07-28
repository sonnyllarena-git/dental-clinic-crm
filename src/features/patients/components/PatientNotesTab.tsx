import type { Patient } from '@/data/types';
import { useClinicalNotesForPatient } from '@/data/hooks';
import { QueryState } from './QueryState';
import { formatDate } from '@/lib/format';

export function PatientNotesTab({ patient }: { patient: Patient }) {
  const { data: notes, isLoading, error } = useClinicalNotesForPatient(patient.id);
  const sorted = [...(notes ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <QueryState
      isLoading={isLoading}
      error={error}
      isEmpty={sorted.length === 0}
      emptyMessage="No clinical notes recorded for this patient yet."
    >
      <ul className="space-y-4">
        {sorted.map((note) => (
          <li key={note.id} className="rounded-md border border-hairline p-4">
            <p className="font-mono text-2xs text-ink-secondary">{formatDate(note.createdAt)}</p>
            <dl className="mt-2 space-y-2 text-sm">
              <div>
                <dt className="font-medium text-ink-primary">Subjective</dt>
                <dd className="text-ink-secondary">{note.subjective}</dd>
              </div>
              <div>
                <dt className="font-medium text-ink-primary">Objective</dt>
                <dd className="text-ink-secondary">{note.objective}</dd>
              </div>
              <div>
                <dt className="font-medium text-ink-primary">Assessment</dt>
                <dd className="text-ink-secondary">{note.assessment}</dd>
              </div>
              <div>
                <dt className="font-medium text-ink-primary">Plan</dt>
                <dd className="text-ink-secondary">{note.plan}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </QueryState>
  );
}
