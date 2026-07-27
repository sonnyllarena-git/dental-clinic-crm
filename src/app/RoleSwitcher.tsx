import { ChevronDown } from 'lucide-react';
import { ROLES, ROLE_LABELS } from '@/types/roles';
import { useSessionStore } from '@/store/session.store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';

/**
 * Stands in for real authentication in this offline build (see brief:
 * "stub a role-switcher for development instead"). Labelled "Dev" so it
 * never reads as a real account switcher to clinic staff testing the app.
 */
export function RoleSwitcher() {
  const currentRole = useSessionStore((s) => s.currentRole);
  const setRole = useSessionStore((s) => s.setRole);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md border border-hairline px-2.5 py-1.5 text-sm text-ink-primary hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="font-mono text-2xs uppercase tracking-wide text-ink-secondary">Dev</span>
          <span className="font-medium">{ROLE_LABELS[currentRole]}</span>
          <ChevronDown className="h-3.5 w-3.5 text-ink-secondary" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {ROLES.map((role) => (
          <DropdownMenuItem key={role} onSelect={() => setRole(role)}>
            {ROLE_LABELS[role]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
