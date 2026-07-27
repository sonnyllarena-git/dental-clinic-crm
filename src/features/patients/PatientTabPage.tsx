import { useParams } from 'react-router-dom';
import { useWorkspaceStore } from '@/store/workspace.store';
import { Button } from '@/components/ui';
import { accentColorFromId } from '@/lib/colorFromId';

/**
 * Placeholder for `/patients/:id`. The real chart — persistent safety
 * banner, odontogram, and tabbed sections — arrives in Stage 3. This page
 * exists now so the tab lifecycle (open, switch, mark dirty, close with a
 * confirmation) is real and testable ahead of real patient data.
 */
export function PatientTabPage() {
  const { id } = useParams<{ id: string }>();
  const tabs = useWorkspaceStore((s) => s.tabs);
  const setDirty = useWorkspaceStore((s) => s.setDirty);
  const tab = tabs.find((t) => t.id === id);

  if (!id || !tab) {
    return (
      <div className="p-6">
        <p className="text-sm text-ink-secondary">
          This chart isn't open. Go to the Dashboard or Patients list to open a patient.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div
        className="h-1 w-16 rounded-full"
        style={{ backgroundColor: accentColorFromId(tab.id) }}
        aria-hidden
      />
      <h1 className="mt-3 font-heading text-xl font-semibold text-ink-primary">{tab.label}</h1>
      <p className="mt-1 max-w-prose text-sm text-ink-secondary">
        The full chart — safety banner, odontogram, treatments, notes, insurance, billing — arrives in
        Stage 3. This placeholder exists to prove out the tab lifecycle: dirty-state tracking and the
        close confirmation.
      </p>
      <Button variant="secondary" size="sm" className="mt-4" onClick={() => setDirty(tab.id, !tab.isDirty)}>
        {tab.isDirty ? 'Mark as saved' : 'Simulate unsaved change'}
      </Button>
    </div>
  );
}
