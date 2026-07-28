import { useCallback, useEffect, useRef, useState } from 'react';
import { useScenarioStore } from '@/store/scenario.store';

export interface RepositoryQueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  /** Re-runs the fetch without waiting for a scenario/dep change — call after a mutation. */
  refetch: () => void;
}

function isTestEnv(): boolean {
  return import.meta.env.MODE === 'test';
}

function delayForScenario(scenario: string): number {
  if (isTestEnv()) return 0;
  if (scenario === 'slow') return 3000;
  return 250;
}

function wait(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * The shared plumbing every hook in this folder wraps the repository
 * with. Handles the scenario-driven cross-cutting behaviors uniformly —
 * `loading` never resolves, `error` always rejects, `empty` never touches
 * the repository at all, and any array result gets sliced to one item
 * under `single` — so individual hooks only need to worry about their own
 * entity-specific overlays (busy-monday, month-end), not this machinery.
 *
 * `deps` drives refetching exactly like a useEffect dependency array;
 * `fetcher` itself is read through a ref so callers can pass a fresh
 * inline closure every render without that alone triggering a refetch.
 * `refetch()` is the escape hatch for the common case a `deps` change
 * can't cover: a mutation (e.g. createTreatment) that should make an
 * already-mounted list re-read the repository immediately.
 */
export function useRepositoryQuery<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
  emptyValue: T,
): RepositoryQueryResult<T> {
  const scenario = useScenarioStore((s) => s.scenario);
  const dataVersion = useScenarioStore((s) => s.dataVersion);
  const [state, setState] = useState<{ data: T | undefined; isLoading: boolean; error: Error | null }>({
    data: undefined,
    isLoading: true,
    error: null,
  });
  const [refreshNonce, setRefreshNonce] = useState(0);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    if (scenario === 'loading') {
      // Deliberately never resolves — isLoading stays true forever.
      return () => {
        cancelled = true;
      };
    }

    const run = async (): Promise<void> => {
      await wait(delayForScenario(scenario));
      if (cancelled) return;

      if (scenario === 'error') {
        setState({ data: undefined, isLoading: false, error: new Error('Simulated failure — scenario is set to "error"') });
        return;
      }

      if (scenario === 'empty') {
        setState({ data: emptyValue, isLoading: false, error: null });
        return;
      }

      try {
        const result = await fetcherRef.current();
        if (cancelled) return;
        const finalData =
          scenario === 'single' && Array.isArray(result) && result.length > 1
            ? (result.slice(0, 1) as unknown as T)
            : result;
        setState({ data: finalData, isLoading: false, error: null });
      } catch (err) {
        if (cancelled) return;
        setState({ data: undefined, isLoading: false, error: err instanceof Error ? err : new Error(String(err)) });
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
    // deps is a caller-provided dependency array, same contract as useEffect's own — eslint can't statically verify a spread.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario, dataVersion, refreshNonce, ...deps]);

  const refetch = useCallback(() => setRefreshNonce((n) => n + 1), []);

  return { ...state, refetch };
}
