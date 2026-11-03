import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestStore } from '@shared/lib/test-utils';
import { checklistsApi } from './checklistsApi';
import type { ChecklistItem } from '@shared/types/models';

const sampleItems: ChecklistItem[] = [
  {
    id: 'chk-1',
    tripId: 'trip-1',
    title: 'Passport',
    type: 'pretrip',
    category: 'documents',
    priority: 'high',
    isCompleted: false,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  },
];

describe('checklistsApi optimistic updates and rollback', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('optimistically toggles isCompleted without triggering a redundant GET refetch on success', async () => {
    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method ?? (typeof input === 'object' && 'method' in input ? input.method : 'GET');
      if (method === 'GET' && url.includes('checklists')) {
        return new Response(JSON.stringify(sampleItems), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (method === 'PATCH' && url.includes('checklists/chk-1')) {
        return new Response(
          JSON.stringify({ ...sampleItems[0], isCompleted: true }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response('{}', { status: 200 });
    });
    globalThis.fetch = fetchSpy as typeof fetch;

    const store = createTestStore();
    await store.dispatch(checklistsApi.endpoints.getChecklistsByTripId.initiate('trip-1'));
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    await store
      .dispatch(
        checklistsApi.endpoints.updateChecklistItem.initiate({
          id: 'chk-1',
          tripId: 'trip-1',
          payload: { isCompleted: true },
        })
      )
      .unwrap();

    const cached = checklistsApi.endpoints.getChecklistsByTripId.select('trip-1')(store.getState());
    expect(cached.data?.[0]?.isCompleted).toBe(true);
    // Only 1 initial GET + 1 PATCH (no redundant refetch after optimistic update)
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('rolls back the optimistic cache patch when the PATCH request fails', async () => {
    const fetchSpy = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const method = init?.method ?? (typeof _input === 'object' && 'method' in _input ? _input.method : 'GET');
      if (method === 'GET') {
        return new Response(JSON.stringify(sampleItems), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ message: 'Server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    globalThis.fetch = fetchSpy as typeof fetch;

    const store = createTestStore();
    await store.dispatch(checklistsApi.endpoints.getChecklistsByTripId.initiate('trip-1'));

    await expect(
      store
        .dispatch(
          checklistsApi.endpoints.updateChecklistItem.initiate({
            id: 'chk-1',
            tripId: 'trip-1',
            payload: { isCompleted: true },
          })
        )
        .unwrap()
    ).rejects.toBeDefined();

    const cached = checklistsApi.endpoints.getChecklistsByTripId.select('trip-1')(store.getState());
    expect(cached.data?.[0]?.isCompleted).toBe(false);
  });
});

