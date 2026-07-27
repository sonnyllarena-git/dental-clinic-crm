import { beforeEach, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { useWorkspaceStore } from '@/store/workspace.store';
import { useSessionStore } from '@/store/session.store';

// Zustand stores and jsdom's history are module-level singletons that
// outlive a single `render()` — reset them so each test starts from the
// same clean slate (closed tabs, default role, on the Dashboard route).
beforeEach(() => {
  window.history.pushState({}, '', '/');
  useWorkspaceStore.setState({ tabs: [], pendingCloseId: null, overflowBlockedId: null });
  useSessionStore.setState({ currentRole: 'dentist', isLocked: false, lastActivityAt: Date.now() });
});

describe('App shell', () => {
  it('renders the sidebar navigation and the demo-data badge', () => {
    render(<App />);
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByText(/demo data/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('opens a demo patient as a workspace tab', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Open Reyes, Ana' }));

    expect(screen.getByRole('tab', { name: 'Reyes, Ana' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reyes, Ana' })).toBeInTheDocument();
  });

  it('warns before discarding an unsaved chart on close', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Open Okafor, Ben' }));
    await user.click(screen.getByRole('button', { name: 'Simulate unsaved change' }));
    await user.click(screen.getByRole('button', { name: 'Close Okafor, Ben' }));

    expect(screen.getByText(/close okafor, ben without saving/i)).toBeInTheDocument();
  });
});
