import { create } from 'zustand';
import type { Role } from '@/types/roles';

/** Clinic workstations are shared and left unattended — lock after 10 idle minutes. */
export const IDLE_LIMIT_MS = 10 * 60 * 1000;

interface SessionState {
  /** Stubbed auth for this offline build — swapped for a real session on API integration. */
  currentRole: Role;
  lastActivityAt: number;
  isLocked: boolean;
  setRole: (role: Role) => void;
  recordActivity: () => void;
  lock: () => void;
  unlock: (confirmedRole: Role) => void;
  checkIdle: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  currentRole: 'dentist',
  lastActivityAt: Date.now(),
  isLocked: false,

  setRole: (role) => set({ currentRole: role }),

  recordActivity: () => {
    if (!get().isLocked) set({ lastActivityAt: Date.now() });
  },

  lock: () => set({ isLocked: true }),

  unlock: (confirmedRole) =>
    set({ isLocked: false, currentRole: confirmedRole, lastActivityAt: Date.now() }),

  checkIdle: () => {
    const { isLocked, lastActivityAt } = get();
    if (!isLocked && Date.now() - lastActivityAt > IDLE_LIMIT_MS) {
      set({ isLocked: true });
    }
  },
}));
