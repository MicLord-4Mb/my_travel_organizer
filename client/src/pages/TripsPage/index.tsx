import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  useGetTripsQuery,
  useCreateTripMutation,
  useUpdateTripMutation,
  useDeleteTripMutation,
} from '@shared/api/apiSlice';
import type { Trip } from '@shared/types/models';
import { useCurrency } from '@shared/lib/useCurrency';
import { TripFormModal, type TripFormData } from '@features/trip-management';
import { KpiTicker } from './components/KpiTicker/KpiTicker';
import {
  TripFilters,
  type FilterStatus,
  type SortOption,
  type ViewMode,
} from './components/TripFilters/TripFilters';
import { TripCard } from './components/TripCard/TripCard';
import { EmptyState } from './components/EmptyState/EmptyState';
import { useToast } from '@shared/ui';
import styles from './TripsPage.module.css';

/** Base currency used for normalizing dashboard-wide KPI metrics and aggregates. */
const REPORTING_CURRENCY = 'USD';

/**
 * Trips Catalog and Overview Dashboard Page.
 *
 * Serves as the primary landing dashboard in WanderFlow:
 * - Aggregates high-level KPIs (active trips, total spent budget, upcoming flights).
 * - Provides search, status filtering ('all', 'planned', 'in_progress', 'completed'), and sorting.
 * - Supports grid vs compact table view switching.
 * - Orchestrates trip creation and editing dialogs.
 * - Responds to global URL search parameters (`?new=1`, `?q=search`).
 */
export const TripsPage: React.FC = () => {
  const { toast } = useToast();
  const { sum, baseCurrency } = useCurrency();
  const reportingCurrency = baseCurrency || REPORTING_CURRENCY;
  const { data: trips = [], isLoading, isFetching } = useGetTripsQuery();
  const [createTrip] = useCreateTripMutation();
  const [updateTrip] = useUpdateTripMutation();
  const [deleteTrip] = useDeleteTripMutation();

  const status = isLoading || isFetching ? 'loading' : 'succeeded';

  // Filter & Control States
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortOption>('soonest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Router Search Parameters
  const [searchParams, setSearchParams] = useSearchParams();

  // Search query derived directly from router query params without useEffect
  const searchQuery = searchParams.get('q') || '';

  const handleSearchChange = (q: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (q) {
      nextParams.set('q', q);
    } else {
      nextParams.delete('q');
    }
    setSearchParams(nextParams, { replace: true });
  };

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

  // Compute status counts for filter tabs
  const counts = useMemo(() => {
    return {
      all: trips.length,
      upcoming: trips.filter((t) => t.status === 'planned').length,
      active: trips.filter((t) => t.status === 'in_progress').length,
      past: trips.filter((t) => t.status === 'completed' || t.status === 'cancelled').length,
    };
  }, [trips]);

  // Compute KPI Ticker Metrics (real data only, no placeholder numbers)
  const kpiMetrics = useMemo(() => {
    // Unique destinations or total active/upcoming trips
    const activeOrUpcoming = trips.filter(
      (t) => t.status === 'in_progress' || t.status === 'planned'
    );
    const destinationNames = new Set(
      activeOrUpcoming.map((t) => t.location?.split(',')[0].trim() || t.title)
    );

    const spentBudget = sum(
      trips.map((t) => ({ amount: t.spentBudget, currency: t.currency })),
      reportingCurrency
    );
    const totalBudget = sum(
      trips.map((t) => ({ amount: t.budgetLimit, currency: t.currency })),
      reportingCurrency
    );

    const totalPacked = trips.reduce((acc, t) => acc + (t.packedCount ?? 0), 0);
    const totalItems = trips.reduce((acc, t) => acc + (t.totalChecklistCount ?? 0), 0);
    // `null` = there is no checklist item yet, so readiness is undefined rather than 0%.
    const readinessPercentage =
      totalItems > 0 ? Math.round((totalPacked / totalItems) * 100) : null;

    return {
      destinationsCount: destinationNames.size,
      spentBudget,
      totalBudget,
      readinessPercentage,
    };
  }, [trips, sum, reportingCurrency]);

  // Filter and sort trips
  const filteredAndSortedTrips = useMemo(() => {
    return trips
      .filter((trip) => {
        // Status filter
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
    try {
      const tripToDup = trips.find((t) => t.id === tripId);
      if (tripToDup) {
        const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = tripToDup;
        await createTrip({ ...rest, title: `${rest.title} (Copy)` }).unwrap();
        toast({
          title: 'Success',
          description: 'Trip duplicated successfully',
          variant: 'success'
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to duplicate trip',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (window.confirm('Are you sure you want to delete this trip workspace?')) {
      try {
        await deleteTrip(tripId).unwrap();
        toast({
          title: 'Deleted',
          description: 'Trip deleted successfully',
          variant: 'success'
        });
      } catch (err) {
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to delete trip',
          variant: 'destructive'
        });
      }
    }
  };

  const handleFormSubmit = async (formData: TripFormData) => {
    if (tripToEdit) {
      await updateTrip({
        id: tripToEdit.id,
        payload: {
          ...formData,
          budgetLimit: formData.budgetLimit || 0,
        },
      }).unwrap();
    } else {
      await createTrip({
        ...formData,
        budgetLimit: formData.budgetLimit || 0,
        spentBudget: 0,
        packedCount: 0,
        totalChecklistCount: 0,
      }).unwrap();
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
          onSearchChange={handleSearchChange}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          counts={counts}
        />

        {/* Trips Display Grid or Empty State */}
        {status === 'loading' && trips.length === 0 ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p>Loading your journeys...</p>
          </div>
        ) : filteredAndSortedTrips.length > 0 ? (
          <div
            className={viewMode === 'grid' ? styles.tripsGrid : styles.tripsList}
            id="tripsContainer"
          >
            {filteredAndSortedTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                viewMode={viewMode}
                onEdit={handleEditTrip}
                onDuplicate={handleDuplicateTrip}
                onDelete={handleDeleteTrip}
              />
            ))}
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
                description: 'Itinerary import (.ics / JSON) feature is coming soon!'
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
    </div>
  );
};

export default TripsPage;
