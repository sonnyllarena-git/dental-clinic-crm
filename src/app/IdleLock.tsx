import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useSessionStore, IDLE_LIMIT_MS } from '@/store/session.store';
import { ROLES, ROLE_LABELS, type Role } from '@/types/roles';
import {
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Label,
} from '@/components/ui';

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'] as const;
const CHECK_INTERVAL_MS = 15_000;

/**
 * Full-screen lock overlay after 10 idle minutes. Clinic workstations are
 * shared and left unattended, so this blurs the workspace behind a screen
 * that requires re-confirming identity before any patient data is visible
 * again. Resuming re-uses the same role picker as the dev role switcher,
 * since this build stubs auth rather than implementing real login.
 */
export function IdleLock() {
  const isLocked = useSessionStore((s) => s.isLocked);
  const currentRole = useSessionStore((s) => s.currentRole);
  const recordActivity = useSessionStore((s) => s.recordActivity);
  const checkIdle = useSessionStore((s) => s.checkIdle);
  const unlock = useSessionStore((s) => s.unlock);
  const [selectedRole, setSelectedRole] = useState<Role>(currentRole);

  useEffect(() => {
    const handleActivity = () => recordActivity();
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, handleActivity));
    const interval = window.setInterval(checkIdle, CHECK_INTERVAL_MS);
    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, handleActivity));
      window.clearInterval(interval);
    };
  }, [recordActivity, checkIdle]);

  useEffect(() => {
    if (isLocked) setSelectedRole(currentRole);
  }, [isLocked, currentRole]);

  if (!isLocked) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="idle-lock-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-primary/50 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm rounded-md border border-hairline bg-surface-base p-6 shadow-overlay">
        <ShieldCheck className="h-6 w-6 text-accent" aria-hidden />
        <h2 id="idle-lock-title" className="mt-3 font-heading text-lg font-semibold text-ink-primary">
          Workspace locked
        </h2>
        <p className="mt-1 text-sm text-ink-secondary">
          Locked after {IDLE_LIMIT_MS / 60_000} minutes of inactivity to protect patient data. Confirm your
          role to resume.
        </p>
        <div className="mt-4">
          <Label htmlFor="resume-role">Your role</Label>
          <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as Role)}>
            <SelectTrigger id="resume-role" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button className="mt-5 w-full" onClick={() => unlock(selectedRole)}>
          Resume session
        </Button>
      </div>
    </div>
  );
}
