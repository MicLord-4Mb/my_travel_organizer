import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type {
  FilterStatus,
  SortOption,
  ViewMode,
} from '@pages/TripsPage/components/TripFilters/TripFilters';

const STATUS_VALUES: readonly FilterStatus[] = ['all', 'upcoming', 'active', 'past'];
const SORT_VALUES: readonly SortOption[] = ['soonest', 'budget', 'alphabetical'];
const VIEW_VALUES: readonly ViewMode[] = ['grid', 'list'];

const DEFAULTS = { status: 'all', sort: 'soonest', view: 'grid' } as const;

function pick<T extends string>(raw: string | null, allowed: readonly T[], fallback: T): T {
  return raw !== null && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
}

/**
 * Catalog view state (status tab, sort, layout mode and search text) persisted in the URL:
 * `?status=upcoming&sort=budget&view=list&q=tokyo`.
 *
 * Default values are omitted from the query string. Because the state lives in the
 * router history, the browser Back button restores filters when returning from a trip.
 */
export function useCatalogParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filterStatus = pick(searchParams.get('status'), STATUS_VALUES, DEFAULTS.status);
  const sortBy = pick(searchParams.get('sort'), SORT_VALUES, DEFAULTS.sort);
  const viewMode = pick(searchParams.get('view'), VIEW_VALUES, DEFAULTS.view);
  const searchQuery = searchParams.get('q') ?? '';

  const update = useCallback(
    (key: string, value: string, defaultValue: string, replace: boolean) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value && value !== defaultValue) {
            next.set(key, value);
          } else {
            next.delete(key);
          }
          return next;
        },
        { replace }
      );
    },
    [setSearchParams]
  );

  return useMemo(
    () => ({
      filterStatus,
      sortBy,
      viewMode,
      searchQuery,
      setFilterStatus: (v: FilterStatus) => update('status', v, DEFAULTS.status, false),
      setSortBy: (v: SortOption) => update('sort', v, DEFAULTS.sort, false),
      setViewMode: (v: ViewMode) => update('view', v, DEFAULTS.view, false),
      // Typing in the search box must not flood the history stack
      setSearchQuery: (v: string) => update('q', v, '', true),
    }),
    [filterStatus, sortBy, viewMode, searchQuery, update]
  );
}

