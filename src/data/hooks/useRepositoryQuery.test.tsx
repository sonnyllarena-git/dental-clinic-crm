import { beforeEach, describe, it, expect, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useRepositoryQuery } from './useRepositoryQuery';
import { useScenarioStore } from '@/store/scenario.store';

beforeEach(() => {
  useScenarioStore.setState({ scenario: 'full', dataVersion: 0 });
});

describe('useRepositoryQuery', () => {
  it('resolves with fetched data under the "full" scenario', async () => {
    const { result } = renderHook(() => useRepositoryQuery(() => Promise.resolve(['a', 'b']), [], [] as string[]));

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(['a', 'b']);
    expect(result.current.error).toBeNull();
  });

  it('returns the empty value under the "empty" scenario without calling the fetcher', async () => {
    useScenarioStore.setState({ scenario: 'empty' });
    const fetcher = vi.fn().mockResolvedValue(['a', 'b']);

    const { result } = renderHook(() => useRepositoryQuery(fetcher, [], [] as string[]));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('slices arrays to one item under the "single" scenario', async () => {
    useScenarioStore.setState({ scenario: 'single' });

    const { result } = renderHook(() =>
      useRepositoryQuery(() => Promise.resolve(['a', 'b', 'c']), [], [] as string[]),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(['a']);
  });

  it('never resolves under the "loading" scenario', async () => {
    useScenarioStore.setState({ scenario: 'loading' });

    const { result } = renderHook(() => useRepositoryQuery(() => Promise.resolve(['a']), [], [] as string[]));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('rejects with a synthetic error under the "error" scenario', async () => {
    useScenarioStore.setState({ scenario: 'error' });

    const { result } = renderHook(() => useRepositoryQuery(() => Promise.resolve(['a']), [], [] as string[]));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.data).toBeUndefined();
  });

  it('surfaces a real fetcher rejection as the error state', async () => {
    const { result } = renderHook(() =>
      useRepositoryQuery(() => Promise.reject(new Error('boom')), [], [] as string[]),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error?.message).toBe('boom');
  });

  it('refetches when dataVersion is bumped, without needing a deps change', async () => {
    let callCount = 0;
    const fetcher = vi.fn(async () => {
      callCount += 1;
      return callCount;
    });

    const { result } = renderHook(() => useRepositoryQuery(fetcher, [], 0));
    await waitFor(() => expect(result.current.data).toBe(1));

    act(() => {
      useScenarioStore.getState().bumpDataVersion();
    });
    await waitFor(() => expect(result.current.data).toBe(2));
  });
});
