import { create } from 'zustand';

export const SCENARIOS = [
  'full',
  'empty',
  'single',
  'loading',
  'error',
  'slow',
  'busy-monday',
  'month-end',
] as const;

export type Scenario = (typeof SCENARIOS)[number];

export const SCENARIO_LABELS: Record<Scenario, string> = {
  full: 'Full dataset',
  empty: 'Empty lists',
  single: 'Single record',
  loading: 'Perpetual loading',
  error: 'Every read fails',
  slow: 'Slow network (3s)',
  'busy-monday': 'Busy Monday (demo)',
  'month-end': 'Month-end billing (demo)',
};

interface ScenarioState {
  scenario: Scenario;
  /** Bumped by resetAndReseed() so every mounted useRepositoryQuery refetches. */
  dataVersion: number;
  setScenario: (scenario: Scenario) => void;
  bumpDataVersion: () => void;
}

export const useScenarioStore = create<ScenarioState>((set) => ({
  scenario: 'full',
  dataVersion: 0,
  setScenario: (scenario) => set({ scenario }),
  bumpDataVersion: () => set((state) => ({ dataVersion: state.dataVersion + 1 })),
}));
