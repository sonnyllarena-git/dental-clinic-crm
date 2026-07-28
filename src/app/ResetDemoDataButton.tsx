import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { repository } from '@/data';
import { useScenarioStore } from '@/store/scenario.store';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui';

/**
 * Reachable in exactly two clicks from anywhere in the app (open the top
 * bar button, confirm) — this gets used constantly while testing, per the
 * brief, so it's a permanent, always-visible action, not tucked inside the
 * dev-only Scenario Switcher.
 */
export function ResetDemoDataButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const bumpDataVersion = useScenarioStore((s) => s.bumpDataVersion);

  const handleConfirm = async (): Promise<void> => {
    setIsResetting(true);
    await repository.resetAndReseed();
    bumpDataVersion();
    setIsResetting(false);
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        aria-label="Reset demo data"
        title="Reset demo data"
      >
        <RotateCcw className="h-4 w-4" aria-hidden />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogTitle>Reset demo data?</DialogTitle>
          <DialogDescription>
            This wipes everything stored in this browser and regenerates the original seeded dataset — any
            patients, appointments, or invoices created or edited since the last reset will be lost.
          </DialogDescription>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsOpen(false)} disabled={isResetting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void handleConfirm()} disabled={isResetting}>
              {isResetting ? 'Resetting…' : 'Reset demo data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
