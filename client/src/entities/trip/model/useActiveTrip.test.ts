import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useActiveTrip } from '@entities/trip';
import * as apiSlice from '@shared/api/apiSlice';
import * as reactRouterDom from 'react-router-dom';
import type { Trip } from '@shared/types/models';

vi.mock('@shared/api/apiSlice', () => ({
  useGetTripsQuery: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useParams: vi.fn(),
}));

describe('useActiveTrip', () => {
  const mockUseGetTrips = vi.mocked(apiSlice.useGetTripsQuery);
  const mockUseParams = vi.mocked(reactRouterDom.useParams);

  const mockTrips: Trip[] = [
    {
      id: 'trip-1',
      title: 'Tokyo Exploration',
      location: 'Tokyo, Japan',
      startDate: '2026-10-10',
      endDate: '2026-10-20',
      status: 'planned',
      budgetLimit: 3500,
      currency: 'USD',
      coverImageUrl: 'https://example.com/tokyo.jpg',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    },
    {
      id: 'trip-2',
      title: 'Paris Getaway',
      location: 'Paris, France',
      startDate: '2026-11-01',
      endDate: '2026-11-08',
      status: 'planned',
      budgetLimit: 2500,
      currency: 'EUR',
      coverImageUrl: 'https://example.com/paris.jpg',
      createdAt: '2026-10-02T00:00:00Z',
      updatedAt: '2026-10-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns status="loading" and null activeTrip while query is in-flight', () => {
    mockUseParams.mockReturnValue({ id: 'trip-1' });
    mockUseGetTrips.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useActiveTrip());

    expect(result.current.status).toBe('loading');
    expect(result.current.activeTrip).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it('returns status="no_trips" when query finishes with empty array', () => {
    mockUseParams.mockReturnValue({ id: 'trip-1' });
    mockUseGetTrips.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useActiveTrip());

    expect(result.current.status).toBe('no_trips');
    expect(result.current.activeTrip).toBeNull();
    expect(result.current.allTrips).toEqual([]);
  });

  it('returns status="ready" and matched trip when route id is present and exists', () => {
    mockUseParams.mockReturnValue({ id: 'trip-2' });
    mockUseGetTrips.mockReturnValue({
      data: mockTrips,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useActiveTrip());

    expect(result.current.status).toBe('ready');
    expect(result.current.activeTrip).toEqual(mockTrips[1]);
  });

  it('returns status="not_found" when route id is requested but not in the trips list', () => {
    mockUseParams.mockReturnValue({ id: 'nonexistent-id' });
    mockUseGetTrips.mockReturnValue({
      data: mockTrips,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useActiveTrip());

    expect(result.current.status).toBe('not_found');
    expect(result.current.activeTrip).toBeNull();
  });

  it('defaults to the first trip with status="ready" when no route param or explicit ID is provided', () => {
    mockUseParams.mockReturnValue({});
    mockUseGetTrips.mockReturnValue({
      data: mockTrips,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useActiveTrip());

    expect(result.current.status).toBe('ready');
    expect(result.current.activeTrip).toEqual(mockTrips[0]);
  });

  it('allows explicitTripId argument to override route parameter', () => {
    mockUseParams.mockReturnValue({ id: 'trip-1' });
    mockUseGetTrips.mockReturnValue({
      data: mockTrips,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useActiveTrip('trip-2'));

    expect(result.current.status).toBe('ready');
    expect(result.current.activeTrip).toEqual(mockTrips[1]);
  });
});
