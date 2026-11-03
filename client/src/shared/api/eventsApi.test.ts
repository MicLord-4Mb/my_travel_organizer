import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestStore } from '@shared/lib/test-utils';
import { eventsApi } from './eventsApi';
import type { PlaceEvent } from '@shared/types/models';

const makeEvents = (): PlaceEvent[] => [
  {
    id: 'evt-1',
    tripId: 'trip-reorder',
    dayIndex: 0,
    order: 0,
    title: 'Breakfast',
    category: 'dining',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  },
  {
    id: 'evt-2',
    tripId: 'trip-reorder',
    dayIndex: 0,
    order: 1,
    title: 'Museum',
    category: 'activities',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  },
];

describe('eventsApi reorderEvents serialization & optimistic rollback', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('optimistically updates event order and rolls back on failure', async () => {
    const initial = makeEvents();
    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = init?.method ?? (typeof input === 'object' && 'method' in input ? input.method : 'GET');
      if (method === 'GET') {
        return new Response(JSON.stringify(initial), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ message: 'Failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    globalThis.fetch = fetchSpy as typeof fetch;

    const store = createTestStore();
    await store.dispatch(eventsApi.endpoints.getEventsByTripId.initiate('trip-reorder'));

    const swapped: PlaceEvent[] = [
      { ...initial[0], order: 1 },
      { ...initial[1], order: 0 },
    ];

    await expect(
      store
        .dispatch(
          eventsApi.endpoints.reorderEvents.initiate({
            tripId: 'trip-reorder',
            events: swapped,
          })
        )
        .unwrap()
    ).rejects.toBeDefined();

    const cached = eventsApi.endpoints.getEventsByTripId.select('trip-reorder')(store.getState());
    expect(cached.data?.find((e) => e.id === 'evt-1')?.order).toBe(0);
    expect(cached.data?.find((e) => e.id === 'evt-2')?.order).toBe(1);
  });

  it('serializes rapid reorders per tripId and supersedes stale remaining writes', async () => {
    const initial = makeEvents();
    const patchCalls: Array<{ url: string; order: number }> = [];

    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method ?? (typeof input === 'object' && 'method' in input ? input.method : 'GET');
      if (method === 'PATCH') {
        const bodyText =
          typeof init?.body === 'string'
            ? init.body
            : typeof input === 'object' && 'text' in input
              ? await input.clone().text()
              : '{}';
        const parsed = JSON.parse(bodyText || '{}') as { order: number };
        patchCalls.push({ url, order: parsed.order });
        await new Promise((r) => setTimeout(r, 15));
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify(initial), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    globalThis.fetch = fetchSpy as typeof fetch;

    const store = createTestStore();
    const firstOrder: PlaceEvent[] = [
      { ...initial[0], order: 1 },
      { ...initial[1], order: 0 },
    ];
    const secondOrder: PlaceEvent[] = [
      { ...initial[0], order: 0 },
      { ...initial[1], order: 1 },
    ];

    const p1 = store
      .dispatch(eventsApi.endpoints.reorderEvents.initiate({ tripId: 'trip-q', events: firstOrder }))
      .unwrap();
    const p2 = store
      .dispatch(eventsApi.endpoints.reorderEvents.initiate({ tripId: 'trip-q', events: secondOrder }))
      .unwrap();

    await Promise.all([p1, p2]);

    // The second reorder superseded the first before the first finished all items,
    // and the final PATCH writes reflect secondOrder.
    expect(patchCalls.length).toBeLessThanOrEqual(3);
    expect(patchCalls[patchCalls.length - 1]?.order).toBe(1);
  });
});

