import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { TabStrip } from './TabStrip';
import { TabCloseGuard } from './TabCloseGuard';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface-base text-ink-primary">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <TabStrip />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <TabCloseGuard />
    </div>
  );
}
