import { create } from 'zustand';

/** Past this, the tab strip would compress into illegibility — prompt to close one instead. */
export const MAX_OPEN_TABS = 6;

export interface WorkspaceTab {
  /** Opaque UUID — doubles as the `/patients/:id` route param. Never a name or DOB. */
  id: string;
  label: string;
  isDirty: boolean;
}

interface WorkspaceState {
  tabs: WorkspaceTab[];
  /** Tab id awaiting an unsaved-changes confirmation before it can close. */
  pendingCloseId: string | null;
  /** Tab id that couldn't open because the 6-tab cap was hit. */
  overflowBlockedId: string | null;
  openTab: (tab: { id: string; label: string }) => 'opened' | 'existing' | 'blocked';
  setDirty: (id: string, isDirty: boolean) => void;
  requestClose: (id: string) => void;
  confirmClose: (id: string) => void;
  cancelClose: () => void;
  clearOverflow: () => void;
  neighborOf: (id: string, direction: 'left' | 'right') => string | null;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  tabs: [],
  pendingCloseId: null,
  overflowBlockedId: null,

  openTab: ({ id, label }) => {
    const { tabs } = get();
    if (tabs.some((t) => t.id === id)) return 'existing';
    if (tabs.length >= MAX_OPEN_TABS) {
      set({ overflowBlockedId: id });
      return 'blocked';
    }
    set({ tabs: [...tabs, { id, label, isDirty: false }] });
    return 'opened';
  },

  setDirty: (id, isDirty) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, isDirty } : t)),
    })),

  requestClose: (id) => set({ pendingCloseId: id }),

  confirmClose: (id) =>
    set((state) => ({
      tabs: state.tabs.filter((t) => t.id !== id),
      pendingCloseId: state.pendingCloseId === id ? null : state.pendingCloseId,
    })),

  cancelClose: () => set({ pendingCloseId: null }),

  clearOverflow: () => set({ overflowBlockedId: null }),

  neighborOf: (id, direction) => {
    const { tabs } = get();
    const idx = tabs.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    const nextIdx = direction === 'left' ? idx - 1 : idx + 1;
    return tabs[nextIdx]?.id ?? null;
  },
}));
