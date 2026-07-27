import { useWorkspaceStore, MAX_OPEN_TABS } from '@/store/workspace.store';
import { useCloseWorkspaceTab } from './useCloseWorkspaceTab';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@/components/ui';

/**
 * Renders the two confirmation dialogs the tab strip can trigger: closing a
 * dirty tab (data loss risk) and hitting the max-open-tabs cap.
 */
export function TabCloseGuard() {
  const tabs = useWorkspaceStore((s) => s.tabs);
  const pendingCloseId = useWorkspaceStore((s) => s.pendingCloseId);
  const overflowBlockedId = useWorkspaceStore((s) => s.overflowBlockedId);
  const cancelClose = useWorkspaceStore((s) => s.cancelClose);
  const clearOverflow = useWorkspaceStore((s) => s.clearOverflow);
  const { confirmPendingClose } = useCloseWorkspaceTab();

  const pendingTab = tabs.find((t) => t.id === pendingCloseId);

  return (
    <>
      <Dialog open={!!pendingCloseId} onOpenChange={(open) => !open && cancelClose()}>
        <DialogContent>
          <DialogTitle>Close {pendingTab?.label} without saving?</DialogTitle>
          <DialogDescription>
            This tab has unsaved changes. Closing it now will discard them.
          </DialogDescription>
          <DialogFooter>
            <Button variant="secondary" onClick={cancelClose}>
              Keep editing
            </Button>
            <Button variant="danger" onClick={() => pendingCloseId && confirmPendingClose(pendingCloseId)}>
              Discard and close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!overflowBlockedId} onOpenChange={(open) => !open && clearOverflow()}>
        <DialogContent>
          <DialogTitle>Close a tab to open another</DialogTitle>
          <DialogDescription>
            You can have up to {MAX_OPEN_TABS} charts open at once. Close one of your open tabs before
            opening a new one.
          </DialogDescription>
          <DialogFooter>
            <Button variant="secondary" onClick={clearOverflow}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
