import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useUpdateTripMutation,
  useGetEventsByTripIdQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
} from '@shared/api/apiSlice';
import { useActiveTrip } from '@entities/trip';
import type { PlaceEvent, EventCategory } from '@shared/types/models';
import type { ItineraryCategoryFilter, TransitMode } from '@entities/itinerary';
import {
  TripContextHeader,
  StickyDayRail,
  DayScheduleCanvas,
  RouteMapInspector,
  calculateTripDays,
} from '@widgets/ItineraryWorkspace';
import {
  PlaceEventModal,
  type PlaceEventFormData,
} from '@features/itinerary-management';
import { TripFormModal } from '@features/trip-management';
import { useCurrency } from '@shared/lib/useCurrency';
import { parseLocalDate, addDaysLocalDate, toDateInputValue } from '@shared/lib/date';
import {useToast, ConfirmDialog, Button} from '@shared/ui';
import styles from './TripDetailsPage.module.css';

/**
 * Trip Workspace and Interactive Itinerary Planner Page.
 *
 * Provides a multi-pane workstation layout for deep trip management:
 * - `TripContextHeader`: Displays title, duration, budget progress, and quick action controls.
 * - `StickyDayRail`: Horizontal scrollable day switcher with date tags and event counts.
 * - `DayScheduleCanvas`: Interactive vertical timeline with Drag-and-Drop event reordering,
 *   quick event insertion, and category filtering.
 * - `RouteMapInspector`: Interactive route visualizer, transit segment estimations,
 *   and stop inspector sidebar.
 */
export default function TripDetailsPage() {
  const { id: routeTripId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { rates, baseCurrency } = useCurrency();
  const { activeTrip, status: tripStatus } = useActiveTrip();

  // Local UI State
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<ItineraryCategoryFilter>('all');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [transitMode, setTransitMode] = useState<TransitMode>('walk');

  const { data: allEvents = [] } = useGetEventsByTripIdQuery(activeTrip?.id ?? '', {
    skip: !activeTrip?.id,
  });

  const [createEvent] = useCreateEventMutation();
  const [updateEvent] = useUpdateEventMutation();
  const [deleteEvent] = useDeleteEventMutation();
  const [updateTripMutation] = useUpdateTripMutation();

  // 1. Calculate day schedule list
  const tripDays = useMemo(() => {
    if (!activeTrip) return [];
    return calculateTripDays(
      activeTrip.startDate,
      activeTrip.endDate,
      allEvents,
      activeTrip.currency,
      rates,
      baseCurrency
    );
  }, [activeTrip, allEvents, rates, baseCurrency]);

  // Derived safe day index clamped to valid range without cascading effect
  const safeDayIndex = tripDays.length > 0 ? Math.min(Math.max(0, activeDayIndex), tripDays.length - 1) : 0;

  const activeDayEvents = useMemo(() => {
    return allEvents
      .filter((e) => e.dayIndex === safeDayIndex)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [allEvents, safeDayIndex]);

  const filteredEvents = useMemo(() => {
    if (categoryFilter === 'all') return activeDayEvents;
    return activeDayEvents.filter((e) => {
      if (categoryFilter === 'food') return e.category === 'dining';
      if (categoryFilter === 'spots') return e.category === 'activities';
      if (categoryFilter === 'transit') return e.category === 'transport';
      if (categoryFilter === 'lodging') return e.category === 'lodging';
      return true;
    });
  }, [activeDayEvents, categoryFilter]);

  // Modals state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<PlaceEvent | null>(null);
  const [presetCategory, setPresetCategory] = useState<EventCategory | undefined>();
  const [isEditTripModalOpen, setIsEditTripModalOpen] = useState(false);

  // If on /itinerary with no id in URL, redirect or sync
  useEffect(() => {
    if (!routeTripId && activeTrip) {
      navigate(`/trips/${activeTrip.id}`, { replace: true });
    }
  }, [routeTripId, activeTrip, navigate]);

  const activeDayInfo = tripDays[safeDayIndex] || tripDays[0];

  // Actions
  const handleSelectDay = (dayIdx: number) => {
    setActiveDayIndex(dayIdx);
  };

  const handleAddDay = async () => {
    if (!activeTrip) return;
    const currentEnd = parseLocalDate(activeTrip.endDate);
    if (!currentEnd) return;
    const newEndStr = toDateInputValue(addDaysLocalDate(currentEnd, 1));

    try {
      await updateTripMutation({
        id: activeTrip.id,
        payload: { endDate: newEndStr },
      }).unwrap();
      setActiveDayIndex(tripDays.length);
      toast({
        title: 'Success',
        description: 'Added a new day to the trip',
        variant: 'success'
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to add day',
        variant: 'destructive'
      });
    }
  };

  const handleOpenAddActivity = (category?: EventCategory) => {
    setEventToEdit(null);
    setPresetCategory(category || 'activities');
    setIsEventModalOpen(true);
  };

  const handleOpenEditActivity = (event: PlaceEvent) => {
    setEventToEdit(event);
    setPresetCategory(event.category || 'activities');
    setIsEventModalOpen(true);
  };

  const [eventToDelete, setEventToDelete] = useState<PlaceEvent | null>(null);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);

  const handleDeleteActivity = (event: PlaceEvent) => {
    setEventToDelete(event);
  };

  const handleConfirmDeleteActivity = async () => {
    if (!activeTrip || !eventToDelete) return;
    try {
      setIsDeletingEvent(true);
      await deleteEvent({ id: eventToDelete.id, tripId: activeTrip.id }).unwrap();
      toast({
        title: 'Deleted',
        description: 'Activity successfully removed',
        variant: 'success'
      });
      setEventToDelete(null);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete activity',
        variant: 'destructive'
      });
    } finally {
      setIsDeletingEvent(false);
    }
  };

  const handleReorderEvents = async (reordered: PlaceEvent[]) => {
    if (!activeTrip) return;
    try {
      // Send multiple patch requests to update order
      await Promise.all(
        reordered.map((event, index) =>
          updateEvent({ id: event.id, payload: { order: index } }).unwrap()
        )
      );
    } catch (error) {
      console.error('Failed to persist the new event order', error);
    }
  };

  const handleFormSubmit = async (formData: PlaceEventFormData) => {
    if (!activeTrip) return;

    if (eventToEdit) {
      await updateEvent({
        id: eventToEdit.id,
        payload: {
          title: formData.title,
          category: formData.category,
          dayIndex: formData.dayIndex,
          startTime: formData.startTime || undefined,
          endTime: formData.endTime || undefined,
          cost: formData.cost,
          currency: formData.currency,
          notes: formData.notes,
          bookingRef: formData.bookingRef,
          location: {
            name: formData.locationName || '',
            address: formData.address || '',
            lat: formData.lat != null ? formData.lat : undefined,
            lng: formData.lng != null ? formData.lng : undefined,
          },
        },
      }).unwrap();
    } else {
      const targetDayEvents = allEvents.filter(e => e.dayIndex === formData.dayIndex);
      const order = targetDayEvents.length > 0 ? Math.max(...targetDayEvents.map(e => e.order ?? 0)) + 1 : 0;
      
      await createEvent({
        tripId: activeTrip.id,
        title: formData.title,
        category: formData.category,
        dayIndex: formData.dayIndex,
        order,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        cost: formData.cost,
        currency: formData.currency,
        notes: formData.notes,
        bookingRef: formData.bookingRef,
        location: {
          name: formData.locationName || '',
          address: formData.address || '',
          lat: formData.lat != null ? formData.lat : undefined,
          lng: formData.lng != null ? formData.lng : undefined,
        },
      }).unwrap();
    }
  };

  if (tripStatus === 'loading') {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <span>Loading itinerary workspace...</span>
      </div>
    );
  }

  if (tripStatus === 'not_found' || !activeTrip) {
    return (
      <div className={styles.emptyContainer}>
        <h2>404 - Trip Not Found</h2>
        <p>The trip you are looking for does not exist.</p>
        <Button variant="primary" onClick={() => navigate('/')}>
          Back to Trips
        </Button>
      </div>
    );
  }

  if (tripStatus === 'no_trips') {
    return (
      <div className={styles.emptyContainer}>
        <h2>No Trips Available</h2>
        <p>Please return to the overview and create a trip.</p>
        <Button variant="primary" onClick={() => navigate('/')}>
          Go to Overview
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* 1. Trip Context Header */}
      <TripContextHeader
        trip={activeTrip}
        totalDays={tripDays.length}
        onAddActivity={() => handleOpenAddActivity()}
        onEditTrip={() => setIsEditTripModalOpen(true)}
      />

      {/* 2. Sticky Day Rail */}
      <StickyDayRail
        days={tripDays}
        activeDayIndex={safeDayIndex}
        onSelectDay={handleSelectDay}
        onAddDay={handleAddDay}
      />

      {/* 3. Split-View Grid: Timeline Canvas & Route Map Inspector */}
      <div className={styles.splitViewGrid}>
        {/* Left Column: 7 Cols Schedule Canvas */}
        <DayScheduleCanvas
          events={activeDayEvents}
          filteredEvents={filteredEvents}
          dayLabel={activeDayInfo?.fullLabel || `Day ${safeDayIndex + 1}`}
          dayNumber={safeDayIndex + 1}
          currentFilter={categoryFilter}
          selectedEventId={selectedEventId}
          transitMode={transitMode}
          onFilterChange={(filter) => setCategoryFilter(filter)}
          onSelectEvent={(eventId) => setSelectedEventId(eventId)}
          onEditEvent={handleOpenEditActivity}
          onDeleteEvent={handleDeleteActivity}
          onReorderEvents={handleReorderEvents}
          onAddActivity={handleOpenAddActivity}
        />

        {/* Right Column: 5 Cols Route Map & Stop Inspector */}
        <RouteMapInspector
          dayNumber={safeDayIndex + 1}
          events={activeDayEvents}
          selectedEventId={selectedEventId}
          transitMode={transitMode}
          onSelectEvent={(id) => setSelectedEventId(id)}
          onTransitModeChange={(mode) => setTransitMode(mode)}
          onEditEvent={handleOpenEditActivity}
          onDeleteEvent={handleDeleteActivity}
        />
      </div>

      {/* 4. Modal for adding/editing place events */}
      <PlaceEventModal
        open={isEventModalOpen}
        onOpenChange={setIsEventModalOpen}
        eventToEdit={eventToEdit}
        defaultDayIndex={safeDayIndex}
        defaultCategory={presetCategory}
        totalDays={tripDays.length}
        startDate={activeTrip.startDate}
        tripCurrency={activeTrip.currency}
        onSubmit={handleFormSubmit}
      />

      {/* Trip Metadata Edit Modal */}
      {isEditTripModalOpen && (
        <TripFormModal
          open={isEditTripModalOpen}
          onOpenChange={setIsEditTripModalOpen}
          tripToEdit={activeTrip}
          onSubmit={async (tripData) => {
            await updateTripMutation({
              id: activeTrip.id,
              payload: tripData,
            }).unwrap();
          }}
        />
      )}

      {/* Delete Activity Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(eventToDelete)}
        onOpenChange={(open) => {
          if (!open) setEventToDelete(null);
        }}
        title="Remove Itinerary Stop"
        description={`Are you sure you want to remove "${eventToDelete?.title}" from your schedule?`}
        confirmLabel="Remove Activity"
        variant="destructive"
        isLoading={isDeletingEvent}
        onConfirm={handleConfirmDeleteActivity}
      />
    </div>
  );
}
