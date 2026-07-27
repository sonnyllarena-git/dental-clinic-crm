import { useNavigate, useParams } from 'react-router-dom';
import type { KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { useWorkspaceStore, MAX_OPEN_TABS } from '@/store/workspace.store';
import { useCloseWorkspaceTab } from './useCloseWorkspaceTab';
import { accentColorFromId } from '@/lib/colorFromId';
import { cn } from '@/lib/cn';

/**
 * The bespoke workspace tab strip: open patient charts, one per tab, up to
 * MAX_OPEN_TABS. The URL (`/patients/:id`) is the single source of truth for
 * which tab is active — this strip is a view over the open-tabs list plus
 * the current route, not an independent "active tab" state.
 */
export function TabStrip() {
  const tabs = useWorkspaceStore((s) => s.tabs);
  const neighborOf = useWorkspaceStore((s) => s.neighborOf);
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const { closeTab } = useCloseWorkspaceTab();

  if (tabs.length === 0) return null;

  const activate = (id: string) => navigate(`/patients/${id}`);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, id: string) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const neighbor = neighborOf(id, event.key === 'ArrowRight' ? 'right' : 'left');
      if (neighbor) activate(neighbor);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate(id);
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Open patient charts"
      className="flex h-10 items-stretch gap-0.5 overflow-x-auto border-b border-hairline bg-surface-raised px-2"
    >
      {tabs.map((tab) => {
        const isActive = params.id === tab.id;
        return (
          <div
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-label={tab.label}
            tabIndex={isActive ? 0 : -1}
            onClick={() => activate(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, tab.id)}
            className={cn(
              'group flex min-w-[9rem] max-w-[14rem] cursor-pointer select-none items-center gap-2 rounded-t-md border border-b-0 border-transparent px-2.5 text-sm text-ink-secondary',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              isActive
                ? 'border-hairline bg-surface-base font-medium text-ink-primary'
                : 'hover:bg-surface-sunken',
            )}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: accentColorFromId(tab.id) }}
              aria-hidden
            />
            <span className="truncate">{tab.label}</span>
            {tab.isDirty && (
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-status-warning"
                aria-label="Unsaved changes"
              />
            )}
            <button
              type="button"
              aria-label={`Close ${tab.label}`}
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className="ml-auto shrink-0 rounded p-0.5 text-ink-secondary opacity-0 hover:bg-surface-sunken group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <X className="h-3 w-3" aria-hidden />
            </button>
          </div>
        );
      })}
      <span className="ml-auto flex items-center px-2 text-xs text-ink-secondary">
        {tabs.length}/{MAX_OPEN_TABS}
      </span>
    </div>
  );
}
