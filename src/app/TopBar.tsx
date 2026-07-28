import { Lock } from 'lucide-react';
import { DemoDataBadge } from './DemoDataBadge';
import { RoleSwitcher } from './RoleSwitcher';
import { ResetDemoDataButton } from './ResetDemoDataButton';
import { Button } from '@/components/ui';
import { useSessionStore } from '@/store/session.store';

export function TopBar() {
  const lock = useSessionStore((s) => s.lock);

  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b border-hairline bg-surface-base px-4">
      <DemoDataBadge />
      <div className="flex items-center gap-2">
        <RoleSwitcher />
        <ResetDemoDataButton />
        <Button
          variant="ghost"
          size="icon"
          onClick={lock}
          aria-label="Lock workspace now"
          title="Lock workspace now"
        >
          <Lock className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </header>
  );
}
