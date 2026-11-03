import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  useGetTripsQuery,
  useGetExpensesQuery,
  useGetChecklistsQuery,
  useCreateTripMutation,
  useUpdateTripMutation,
} from '@shared/api/apiSlice';
import type { Trip, Expense, ChecklistItem } from '@shared/types/models';
import { useCurrency } from '@shared/lib/useCurrency';
import {
  TripFormModal,
  toTripPayload,
  useDuplicateTrip,
  useDeleteTrip,
  type TripFormData,
} from '@features/trip-management';
import { KpiTicker } from './components/KpiTicker/KpiTicker';
import { TripFilters } from './components/TripFilters/TripFilters';
import { useCatalogParams } from './model/useCatalogParams';
import { TripCard } from '@entities/trip';
import { EmptyState } from './components/EmptyState/EmptyState';
import { useToast, ConfirmDialog, QueryErrorState } from '@shared/ui';
import styles from './TripsPage.module.css';

/** Base currency used for normalizing dashboard-wide KPI metrics and aggregates. */
const REPORTING_CURRENCY = 'USD';

/**
 * Trips Catalog and Overview Dashboard Page.
 *
 * Serves as the primary landing dashboard in WanderFlow:
 * - Aggregates high-level KPIs (active trips, total spent budget, upcoming flights).
 * - Provides search, status filtering ('all', 'upcoming', 'active', 'past'), and sorting.
 * - Supports grid vs compact table view switching.
 * - Orchestrates trip creation and editing dialogs.
 * - Keeps filter / sort / view / search state in the URL (`?status=&sort=&view=&q=`),
 *   and responds to `?new=1` to open the creation dialog.
 *
 * Trip status is derived from calendar dates by the API layer; duplication and deletion
 * orchestration lives in `@features/trip-management` hooks.
 */
export const TripsPage: React.FC = () => {
  const { toast } = useToast();
  const { sum, baseCurrency } = useCurrency();
  const reportingCurrency = baseCurrency || REPORTING_CURRENCY;
  const {
    data: trips = [],
    isLoading,
    isFetching,
    isError: isTripsError,
    refetch: refetchTrips,
  } = useGetTripsQuery();
  const {
    data: allExpenses = [],
    isError: isExpensesError,
    refetch: refetchExpenses,
  } = useGetExpensesQuery();
  const {
    data: allChecklists = [],
    isError: isChecklistsError,
    refetch: refetchChecklists,
  } = useGetChecklistsQuery();
  const [createTrip] = useCreateTripMutation();
  const [updateTrip] = useUpdateTripMutation();
  const duplicateTrip = useDuplicateTrip();
  const { deleteTrip, isDeleting: isDeletingTrip } = useDeleteTrip();

  const isLoadingTrips = isLoading || (isFetching && trips.length === 0);
  const isMetricsError = isExpensesError || isChecklistsError;

  const retryAll = () => {
    if (isTripsError) refetchTrips();
    if (isExpensesError) refetchExpenses();
    if (isChecklistsError) refetchChecklists();
  };

  // Filter & control state lives in the URL so it survives navigation and reloads
  const {
    filterStatus,
    sortBy,
    viewMode,
    searchQuery,
    setFilterStatus,
    setSortBy,
    setViewMode,
    setSearchQuery,
  } = useCatalogParams();

  // Router Search Parameters (`?new=1` opens the creation modal)
  const [searchParams, setSearchParams] = useSearchParams();

  // Modal State: open if manually triggered or URL requests ?new=1
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tripToEdit, setTripToEdit] = useState<Trip | null>(null);

  const isCreatingNew = searchParams.get('new') === '1';
  const effectiveIsModalOpen = isModalOpen || isCreatingNew;

  const handleModalOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setTripToEdit(null);
      if (searchParams.has('new')) {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('new');
        setSearchParams(nextParams, { replace: true });
      }
    }
  };

  // Compute status counts for filter tabs (status is calendar-derived)
  const counts = useMemo(() => {
    return {
      all: trips.length,
      upcoming: trips.filter((t) => t.status === 'planned').length,
      active: trips.filter((t) => t.status === 'in_progress').length,
      past: trips.filter((t) => t.status === 'completed' || t.status === 'cancelled').length,
    };
  }, [trips]);

  // Group expenses and checklists by tripId for O(1) card lookups without N+1 requests
  const expensesByTripId = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const exp of allExpenses) {
      const list = map.get(exp.tripId);
      if (list) {
        list.push(exp);
      } else {
        map.set(exp.tripId, [exp]);
      }
    }
    return map;
  }, [allExpenses]);

  const checklistsByTripId = useMemo(() => {
    const map = new Map<string, ChecklistItem[]>();
    for (const item of allChecklists) {
      const list = map.get(item.tripId);
      if (list) {
        list.push(item);
      } else {
        map.set(item.tripId, [item]);
      }
    }
    return map;
  }, [allChecklists]);

  // Compute KPI Ticker Metrics (real data only, no placeholder numbers)
  const kpiMetrics = useMemo(() => {
    const validTripIds = new Set(trips.map((t) => t.id));
    const validExpenses = allExpenses.filter((e) => validTripIds.has(e.tripId));
    const validChecklists = allChecklists.filter((c) => validTripIds.has(c.tripId));

    // Unique destinations or total active/upcoming trips
    const activeOrUpcoming = trips.filter(
      (t) => t.status === 'in_progress' || t.status === 'planned'
    );
    const destinationNames = new Set(
      activeOrUpcoming.map((t) => t.location?.split(',')[0].trim() || t.title)
    );

    const spentBudget = sum(validExpenses, reportingCurrency);
    const totalBudget = sum(
      trips.map((t) => ({ amount: t.budgetLimit, currency: t.currency })),
      reportingCurrency
    );

    const totalPacked = validChecklists.filter((c) => c.isCompleted).length;
    const totalItems = validChecklists.length;
    // `null` = there is no checklist item yet, so readiness is undefined rather than 0%.
    const readinessPercentage =
      totalItems > 0 ? Math.round((totalPacked / totalItems) * 100) : null;

    return {
      destinationsCount: destinationNames.size,
      spentBudget,
      totalBudget,
      readinessPercentage,
    };
  }, [trips, allExpenses, allChecklists, sum, reportingCurrency]);

  // Filter and sort trips
  const filteredAndSortedTrips = useMemo(() => {
    return trips
      .filter((trip) => {
        // Status filter (derived calendar status)
        if (filterStatus === 'upcoming' && trip.status !== 'planned') return false;
        if (filterStatus === 'active' && trip.status !== 'in_progress') return false;
        if (
          filterStatus === 'past' &&
          trip.status !== 'completed' &&
          trip.status !== 'cancelled'
        ) {
          return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesTitle = trip.title.toLowerCase().includes(q);
          const matchesDesc = trip.description?.toLowerCase().includes(q);
          const matchesLocation = trip.location?.toLowerCase().includes(q);
          if (!matchesTitle && !matchesDesc && !matchesLocation) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'budget') {
          return (b.budgetLimit || 0) - (a.budgetLimit || 0);
        }
        if (sortBy === 'alphabetical') {
          return a.title.localeCompare(b.title);
        }
        // 'soonest' (YYYY-MM-DD strings sort chronologically)
        return a.startDate.localeCompare(b.startDate);
      });
  }, [trips, filterStatus, searchQuery, sortBy]);

  // Action Handlers
  const handleOpenCreateModal = () => {
    setTripToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditTrip = (trip: Trip) => {
    setTripToEdit(trip);
    setIsModalOpen(true);
  };

  const handleDuplicateTrip = async (tripId: string) => {
    const tripToDup = trips.find((t) => t.id === tripId);
    if (!tripToDup) return;
    try {
      await duplicateTrip(tripToDup);
      toast({
        title: 'Success',
        description: 'Trip, itinerary and checklist duplicated successfully',
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to duplicate trip',
        variant: 'destructive',
      });
    }
  };

  const [tripToDeleteId, setTripToDeleteId] = useState<string | null>(null);

  const handleDeleteTrip = (tripId: string) => {
    setTripToDeleteId(tripId);
  };

  const handleConfirmDeleteTrip = async () => {
    if (!tripToDeleteId) return;
    try {
      await deleteTrip(tripToDeleteId);
      toast({
        title: 'Deleted',
        description: 'Trip deleted successfully',
        variant: 'success',
      });
      setTripToDeleteId(null);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete trip',
        variant: 'destructive',
      });
    }
  };

  const handleFormSubmit = async (formData: TripFormData) => {
    const payload = toTripPayload(formData);
    if (tripToEdit) {
      await updateTrip({ id: tripToEdit.id, payload }).unwrap();
    } else {
      await createTrip(payload).unwrap();
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* KPI Ticker */}
        <KpiTicker
          destinationsCount={kpiMetrics.destinationsCount}
          spentBudget={kpiMetrics.spentBudget}
          totalBudget={kpiMetrics.totalBudget}
          readinessPercentage={kpiMetrics.readinessPercentage}
          currency={reportingCurrency}
          onCreateNewJourney={handleOpenCreateModal}
        />

        {/* Filters, Search, and View Mode Toggle */}
        <TripFilters
          currentStatus={filterStatus}
          onStatusChange={setFilterStatus}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          counts={counts}
        />

        {/* Partial failure: trips are shown, but card metrics may be incomplete */}
        {isMetricsError && !isTripsError && (
          <QueryErrorState
            title="Some trip metrics could not be loaded"
            description="Spending and checklist numbers on the cards may be incomplete."
            onRetry={retryAll}
          />
        )}

        {/* Trips Display Grid, Error State or Empty State */}
        {isLoadingTrips ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p>Loading your journeys...</p>
          </div>
        ) : isTripsError && trips.length === 0 ? (
          <QueryErrorState
            title="Could not load your trips"
            onRetry={retryAll}
          />
        ) : filteredAndSortedTrips.length > 0 ? (
          <div
            className={viewMode === 'grid' ? styles.tripsGrid : styles.tripsList}
            id="tripsContainer"
          >
            {filteredAndSortedTrips.map((trip) => {
              const tripExp = expensesByTripId.get(trip.id) || [];
              const tripChk = checklistsByTripId.get(trip.id) || [];
              const tripSpent = sum(tripExp, trip.currency || 'USD');
              const tripPacked = tripChk.filter((c) => c.isCompleted).length;
              const tripTotalChecklist = tripChk.length;

              return (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  viewMode={viewMode}
                  spentBudget={tripSpent}
                  packedCount={tripPacked}
                  totalChecklistCount={tripTotalChecklist}
                  onEdit={handleEditTrip}
                  onDuplicate={handleDuplicateTrip}
                  onDelete={handleDeleteTrip}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState
            onCreateTrip={handleOpenCreateModal}
            title={
              searchQuery
                ? `No trips matching "${searchQuery}"`
                : 'No trips in this view'
            }
            description={
              searchQuery
                ? 'Try adjusting your search terms or filter to find what you are looking for.'
                : 'Create a new trip or choose another status tab above to see your travel plans.'
            }
          />
        )}

        {/* Onboarding Bottom Section (from Mockup) */}
        {filteredAndSortedTrips.length > 0 && (
          <EmptyState
            onCreateTrip={handleOpenCreateModal}
            onImportItinerary={() => {
              toast({
                title: 'Coming Soon',
                description: 'Itinerary import (.ics / JSON) feature is coming soon!',
              });
            }}
            title="Planning a new destination?"
            description="Organize daily agendas, track accommodation costs, and curate interactive checklists in WanderFlow's minimalist space."
          />
        )}
      </div>

      {/* Create / Edit Trip Modal */}
      <TripFormModal
        open={effectiveIsModalOpen}
        onOpenChange={handleModalOpenChange}
        tripToEdit={tripToEdit}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(tripToDeleteId)}
        onOpenChange={(open) => {
          if (!open) setTripToDeleteId(null);
        }}
        title="Delete Trip Workspace"
        description="Are you sure you want to delete this trip workspace? All associated events, checklists, and expenses will be permanently removed."
        confirmLabel="Delete Trip"
        variant="destructive"
        isLoading={isDeletingTrip}
        onConfirm={handleConfirmDeleteTrip}
      />
    </div>
  );
};

export default TripsPage;
