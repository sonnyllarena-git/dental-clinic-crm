import { useNavigate, useParams } from 'react-router-dom';
import { useWorkspaceStore } from '@/store/workspace.store';

/**
 * Closing a tab is a router concern as much as a store concern: if the tab
 * being closed is the one the URL currently points at, we must navigate
 * away from it. This hook is the single place that combines the two so
 * TabStrip's × button and TabCloseGuard's confirm button can't drift apart.
 */
export function useCloseWorkspaceTab() {
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const tabs = useWorkspaceStore((s) => s.tabs);
  const requestClose = useWorkspaceStore((s) => s.requestClose);
  const confirmClose = useWorkspaceStore((s) => s.confirmClose);
  const neighborOf = useWorkspaceStore((s) => s.neighborOf);

  const navigateAwayIfActive = (id: string) => {
    if (params.id !== id) return;
    const neighbor = neighborOf(id, 'right') ?? neighborOf(id, 'left');
    navigate(neighbor ? `/patients/${neighbor}` : '/');
  };

  const closeTab = (id: string) => {
    const tab = tabs.find((t) => t.id === id);
    if (tab?.isDirty) {
      requestClose(id);
      return;
    }
    navigateAwayIfActive(id);
    confirmClose(id);
  };

  const confirmPendingClose = (id: string) => {
    navigateAwayIfActive(id);
    confirmClose(id);
  };

  return { closeTab, confirmPendingClose };
}
