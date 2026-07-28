import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui';

interface QueryStateProps {
  isLoading: boolean;
  error: Error | null;
  isEmpty: boolean;
  emptyMessage: string;
  loadingRows?: number;
  children: ReactNode;
}

/** The four states every data-driven tab needs: loading, error, empty, populated. */
export function QueryState({ isLoading, error, isEmpty, emptyMessage, loadingRows = 3, children }: QueryStateProps) {
  if (isLoading) {
    return (
      <div className="space-y-2" aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading…</span>
        {Array.from({ length: loadingRows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex items-center gap-2 rounded-md border border-status-danger/30 bg-status-danger/5 p-4 text-sm text-status-danger"
      >
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
        <span>{error.message}</span>
      </div>
    );
  }

  if (isEmpty) {
    return <p className="rounded-md border border-hairline bg-surface-raised p-4 text-sm text-ink-secondary">{emptyMessage}</p>;
  }

  return <>{children}</>;
}
