import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui';
import { useWorkspaceStore } from '@/store/workspace.store';

/**
 * Seven sample charts — one more than MAX_OPEN_TABS — so opening all of
 * them demonstrates the "close a tab first" overflow guard, not just the
 * happy path. Real patient data and role-scoped KPIs land in Stage 3 / 6;
 * this page exists now to prove out the tabbed-workspace mechanics.
 */
const DEMO_PATIENTS = [
  { id: '3f2a1b10-8c44-4e2a-9d61-000000000001', label: 'Reyes, Ana' },
  { id: '3f2a1b10-8c44-4e2a-9d61-000000000002', label: 'Okafor, Ben' },
  { id: '3f2a1b10-8c44-4e2a-9d61-000000000003', label: 'Lindqvist, Cora' },
  { id: '3f2a1b10-8c44-4e2a-9d61-000000000004', label: 'Mercado, Dee' },
  { id: '3f2a1b10-8c44-4e2a-9d61-000000000005', label: 'Nakamura, Eli' },
  { id: '3f2a1b10-8c44-4e2a-9d61-000000000006', label: 'Petrov, Faye' },
  { id: '3f2a1b10-8c44-4e2a-9d61-000000000007', label: 'Quintero, Gus' },
];

export function DashboardPage() {
  const openTab = useWorkspaceStore((s) => s.openTab);
  const navigate = useNavigate();

  const handleOpen = (id: string, label: string) => {
    const result = openTab({ id, label });
    if (result !== 'blocked') navigate(`/patients/${id}`);
  };

  return (
    <div className="p-6">
      <h1 className="font-heading text-xl font-semibold text-ink-primary">Dashboard</h1>
      <p className="mt-1 max-w-prose text-sm text-ink-secondary">
        Role-scoped KPIs arrive in Stage 6. For now, use these sample charts to try the tabbed workspace —
        open a few, switch between them with the arrow keys once a tab has focus, and try the 7th to see
        the open-tab limit.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {DEMO_PATIENTS.map((p) => (
          <Button key={p.id} variant="secondary" size="sm" onClick={() => handleOpen(p.id, p.label)}>
            Open {p.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
