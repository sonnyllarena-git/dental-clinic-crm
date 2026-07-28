import { beforeEach, describe, it, expect } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { useWorkspaceStore } from '@/store/workspace.store';
import { useSessionStore } from '@/store/session.store';
import { useScenarioStore } from '@/store/scenario.store';

// Zustand stores and jsdom's history are module-level singletons that
// outlive a single `render()` — reset them so each test starts from the
// same clean slate (closed tabs, default role, on the Dashboard route).
beforeEach(() => {
  window.history.pushState({}, '', '/');
  useWorkspaceStore.setState({ tabs: [], pendingCloseId: null, overflowBlockedId: null });
  useSessionStore.setState({ currentRole: 'dentist', isLocked: false, lastActivityAt: Date.now() });
  useScenarioStore.setState({ scenario: 'full', dataVersion: 0 });
});

describe('App shell', () => {
  it('renders the sidebar navigation and the demo-data badge', () => {
    render(<App />);
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByText(/demo data/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('opens a real patient from the Patients list as a workspace tab', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/patients');
    render(<App />);

    const table = await screen.findByRole('table');
    const [firstNameButton] = within(table).getAllByRole('button');
    const patientName = firstNameButton.textContent;
    expect(patientName).toBeTruthy();

    await user.click(firstNameButton);

    expect(await screen.findByRole('tab', { name: patientName! })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: patientName!, level: 1 })).toBeInTheDocument();
  });

  it('warns before discarding an unsaved chart on close', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/patients');
    render(<App />);

    const table = await screen.findByRole('table');
    const [firstNameButton] = within(table).getAllByRole('button');
    const patientName = firstNameButton.textContent as string;
    await user.click(firstNameButton);
    await screen.findByRole('tab', { name: patientName });

    // Simulate the tab going dirty — no current feature sets this yet, but
    // the workspace store's dirty-tracking/close-guard is still real
    // infrastructure worth covering directly.
    const [tab] = useWorkspaceStore.getState().tabs;
    act(() => {
      useWorkspaceStore.getState().setDirty(tab.id, true);
    });

    await user.click(screen.getByRole('button', { name: `Close ${patientName}` }));

    await waitFor(() => {
      // Exact-text matcher, not a regex — a patient name could contain
      // characters (periods, parentheses) that aren't safe to interpolate
      // straight into a RegExp.
      expect(
        screen.getByText((_, element) => element?.textContent === `Close ${patientName} without saving?`),
      ).toBeInTheDocument();
    });
  });
});
