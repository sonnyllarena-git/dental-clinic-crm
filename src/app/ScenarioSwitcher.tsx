import { useEffect, useState } from 'react';
import { FlaskConical, X } from 'lucide-react';
import { useScenarioStore, SCENARIOS, SCENARIO_LABELS } from '@/store/scenario.store';
import { ResetDemoDataButton } from './ResetDemoDataButton';
import { cn } from '@/lib/cn';

/**
 * Dev-only floating panel, toggled with Ctrl+Shift+D. `import.meta.env.DEV`
 * is replaced with a literal `false` by Vite in production builds, which
 * makes everything past this guard — including the keyboard listener —
 * dead code that esbuild/Rollup strips from `pnpm build` output entirely,
 * not just hidden at runtime.
 */
export function ScenarioSwitcher() {
  if (!import.meta.env.DEV) return null;
  return <ScenarioSwitcherPanel />;
}

function ScenarioSwitcherPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const scenario = useScenarioStore((s) => s.scenario);
  const setScenario = useScenarioStore((s) => s.setScenario);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="Scenario switcher"
      className="fixed bottom-4 right-4 z-[90] w-72 rounded-md border border-hairline bg-surface-base p-4 shadow-overlay"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-medium text-ink-primary">
          <FlaskConical className="h-4 w-4 text-accent" aria-hidden />
          Scenario Switcher
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close scenario switcher"
          className="rounded p-1 text-ink-secondary hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
      <p className="mt-1 text-2xs text-ink-secondary">
        Dev only — stripped from production builds. Ctrl+Shift+D to toggle.
      </p>

      <div className="mt-3 flex flex-col gap-1" role="radiogroup" aria-label="Active scenario">
        {SCENARIOS.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={scenario === s}
            onClick={() => setScenario(s)}
            className={cn(
              'flex items-center justify-between rounded-md border px-2.5 py-1.5 text-left text-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              scenario === s
                ? 'border-accent/30 bg-accent-wash font-medium text-accent'
                : 'border-hairline text-ink-primary hover:bg-surface-sunken',
            )}
          >
            <span className="font-mono text-2xs uppercase tracking-wide text-ink-secondary">{s}</span>
            <span>{SCENARIO_LABELS[s]}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
        <span className="text-2xs text-ink-secondary">Also used constantly during dev:</span>
        <ResetDemoDataButton />
      </div>
    </div>
  );
}
