import React, { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import {
  fetchTrips,
  createTrip,
  updateTrip,
  deleteTrip,
  duplicateTrip,
  selectAllTrips,
  selectTripStatus,
} from '@entities/trip';
import type { Trip } from '@shared/types/models';
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
import styles from './TripsPage.module.css';

export const TripsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const trips = useAppSelector(selectAllTrips);
  const status = useAppSelector(selectTripStatus);

  // Filter & Control States
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('soonest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tripToEdit, setTripToEdit] = useState<Trip | null>(null);

  // Fetch initial trips on mount
  useEffect(() => {
    dispatch(fetchTrips());
  }, [dispatch]);

  // Listen for global "wanderflow:open-new-trip" custom event
  useEffect(() => {
    const handleOpenNewTrip = () => {
      setTripToEdit(null);
      setIsModalOpen(true);
    };

    window.addEventListener('wanderflow:open-new-trip', handleOpenNewTrip);
    return () => {
      window.removeEventListener('wanderflow:open-new-trip', handleOpenNewTrip);
    };
  }, []);

  // Compute status counts for filter tabs
  const counts = useMemo(() => {
    return {
      all: trips.length,
      upcoming: trips.filter((t) => t.status === 'planned').length,
      active: trips.filter((t) => t.status === 'in_progress').length,
      past: trips.filter((t) => t.status === 'completed' || t.status === 'cancelled').length,
    };
  }, [trips]);

  // Compute KPI Ticker Metrics
  const kpiMetrics = useMemo(() => {
    // Unique destinations or total active/upcoming trips
    const activeOrUpcoming = trips.filter(
      (t) => t.status === 'in_progress' || t.status === 'planned'
    );
    const destinationNames = new Set(
      activeOrUpcoming.map((t) => t.location?.split(',')[0].trim() || t.title)
    );
    const destinationsCount = destinationNames.size || activeOrUpcoming.length;

    const spentBudget = trips.reduce((acc, t) => acc + (t.spentBudget || 0), 0);
    const totalBudget = trips.reduce((acc, t) => acc + (t.budgetLimit || 0), 0);

    const totalPacked = trips.reduce((acc, t) => acc + (t.packedCount || 0), 0);
    const totalItems = trips.reduce(
      (acc, t) => acc + (t.totalChecklistCount || 10),
      0
    );
    const readinessPercentage =
      totalItems > 0 ? Math.round((totalPacked / totalItems) * 100) : 0;

    return {
      destinationsCount: destinationsCount || 3,
      spentBudget: spentBudget || 4250,
      totalBudget: totalBudget || 9700,
      readinessPercentage: readinessPercentage || 43,
    };
  }, [trips]);

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
        // 'soonest'
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
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
    await dispatch(duplicateTrip(tripId));
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (window.confirm('Are you sure you want to delete this trip workspace?')) {
      await dispatch(deleteTrip(tripId));
    }
  };

  const handleFormSubmit = async (formData: TripFormData) => {
    if (tripToEdit) {
      await dispatch(
        updateTrip({
          id: tripToEdit.id,
          payload: {
            ...formData,
            budgetLimit: formData.budgetLimit || 0,
          },
        })
      );
    } else {
      await dispatch(
        createTrip({
          ...formData,
          budgetLimit: formData.budgetLimit || 0,
          spentBudget: 0,
          packedCount: 0,
          totalChecklistCount: 12,
        })
      );
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
              alert('Itinerary import (.ics / JSON) feature is coming soon!');
            }}
            title="Planning a new destination?"
            description="Organize daily agendas, track accommodation costs, and curate interactive checklists in WanderFlow's minimalist space."
          />
        )}
      </div>

      {/* Create / Edit Trip Modal */}
      <TripFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        tripToEdit={tripToEdit}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
};

export default TripsPage;
