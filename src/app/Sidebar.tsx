import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from './navItems';
import { useSessionStore } from '@/store/session.store';
import { cn } from '@/lib/cn';

export function Sidebar() {
  const currentRole = useSessionStore((s) => s.currentRole);
  const items = NAV_ITEMS.filter((item) => item.roles.includes(currentRole));

  return (
    <nav
      aria-label="Primary"
      className="flex w-56 shrink-0 flex-col border-r border-hairline bg-surface-raised"
    >
      <div className="flex h-14 items-center border-b border-hairline px-4">
        <span className="font-heading text-sm font-semibold tracking-tight text-ink-primary">
          Dental Clinic CRM
        </span>
      </div>
      <ul className="flex flex-1 flex-col gap-0.5 p-2">
        {items.map(({ label, path, icon: Icon }) => (
          <li key={path}>
            <NavLink
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink-secondary hover:bg-surface-sunken hover:text-ink-primary',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  isActive && 'bg-accent-wash font-medium text-accent hover:bg-accent-wash hover:text-accent',
                )
              }
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
