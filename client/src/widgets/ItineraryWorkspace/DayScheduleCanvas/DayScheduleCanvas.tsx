import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CalendarPlus } from 'lucide-react';
import type { PlaceEvent, EventCategory, EntityId } from '@shared/types/models';
import type { ItineraryCategoryFilter, TransitMode } from '@entities/itinerary';
import { TimelineFilters } from './TimelineFilters';
import { TimelineItem } from './TimelineItem';
import { TransitSegment } from './TransitSegment';
import { QuickAddBar } from './QuickAddBar';
import styles from './DayScheduleCanvas.module.css';

/**
 * Props accepted by `<DayScheduleCanvas />`.
 */
export interface DayScheduleCanvasProps {
  /** Complete list of events scheduled for this day (used for order persistence) */
  events: PlaceEvent[];
  /** Subset of events passing the active category filter (used for display rendering) */
  filteredEvents: PlaceEvent[];
  /** Human-readable day label (e.g., "OCT 14" or "Day 3") */
  dayLabel: string;
  /** Numerical day number (1-based for user display) */
  dayNumber: number;
  /** Active category filter ('all' or specific category) */
  currentFilter: ItineraryCategoryFilter;
  /** ID of the currently selected/inspected event */
  selectedEventId: EntityId | null;
  /** Active transit calculation mode */
  transitMode?: TransitMode;
  /** Callback fired when user switches the category filter */
  onFilterChange: (filter: ItineraryCategoryFilter) => void;
  /** Callback fired when an event is clicked for inspection */
  onSelectEvent: (eventId: EntityId) => void;
  /** Callback fired when an event edit action is requested */
  onEditEvent: (event: PlaceEvent) => void;
  /** Callback fired when an event delete action is requested */
  onDeleteEvent: (event: PlaceEvent) => void;
  /** Callback fired when drag-and-drop finishes and produces a new sequence */
  onReorderEvents: (reordered: PlaceEvent[]) => void;
  /** Callback fired when user clicks to add a new activity or spot */
  onAddActivity: (category?: EventCategory) => void;
}

/**
 * Interactive Timeline Canvas for an individual trip day.
 *
 * Implements accessible Drag-and-Drop (`@dnd-kit`) for reordering stops,
 * dynamic transit segment calculations between consecutive geo-located stops,
 * quick action buttons, and empty-state prompting.
 */
export const DayScheduleCanvas: React.FC<DayScheduleCanvasProps> = ({
  events,
  filteredEvents,
  dayLabel,
  dayNumber,
  currentFilter,
  selectedEventId,
  transitMode = 'walk',
  onFilterChange,
  onSelectEvent,
  onEditEvent,
  onDeleteEvent,
  onReorderEvents,
  onAddActivity,
}) => {
  const [activeDraggingId, setActiveDraggingId] = useState<EntityId | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDraggingId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDraggingId(null);

    if (over && active.id !== over.id) {
      const oldIndex = events.findIndex((item) => item.id === active.id);
      const newIndex = events.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const moved = arrayMove(events, oldIndex, newIndex);
        const updatedWithOrder = moved.map((item, idx) => ({
          ...item,
          order: idx,
        }));
        onReorderEvents(updatedWithOrder);
      }
    }
  };

  const activeDraggingEvent = activeDraggingId
    ? events.find((e) => e.id === activeDraggingId)
    : null;

  return (
    <section aria-label={`Day ${dayNumber} Schedule Timeline`} className={styles.canvasContainer}>
      {/* Top Filter Bar */}
      <TimelineFilters
        dayLabel={dayLabel}
        activitiesCount={events.length}
        currentFilter={currentFilter}
        onFilterChange={onFilterChange}
      />

      {/* Vertical Timeline Feed */}
      <div className={styles.timelineStream}>
        {filteredEvents.length > 0 && (
          <div className={styles.verticalGuideLine} />
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredEvents.map((e) => e.id)}
            strategy={verticalListSortingStrategy}
          >
            {filteredEvents.map((event, index) => {
              const nextEvent = filteredEvents[index + 1];
              const isSelected = selectedEventId === event.id;

              return (
                <React.Fragment key={event.id}>
                  <TimelineItem
                    event={event}
                    isSelected={isSelected}
                    isDragDisabled={currentFilter !== 'all'}
                    onSelect={() => onSelectEvent(event.id)}
                    onEdit={() => onEditEvent(event)}
                    onDelete={() => onDeleteEvent(event)}
                  />

                  {/* Render intermediate transit connecting segment if there's a subsequent item */}
                  {nextEvent && (
                    <TransitSegment
                      fromEvent={event}
                      toEvent={nextEvent}
                      mode={transitMode}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </SortableContext>

          {/* Floating drag preview overlay */}
          <DragOverlay>
            {activeDraggingEvent ? (
              <TimelineItem
                event={activeDraggingEvent}
                isSelected={selectedEventId === activeDraggingEvent.id}
              />
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Empty state when no events in day / filter */}
        {filteredEvents.length === 0 && (
          <div className={styles.emptyState}>
            <CalendarPlus size={36} color="var(--color-text-muted)" />
            <h4 className={styles.emptyTitle}>No Activities Planned</h4>
            <p className={styles.emptyDescription}>
              {currentFilter !== 'all'
                ? `No activities match the "${currentFilter}" filter for this day.`
                : `Start organizing Day ${dayNumber} by adding your first stop, restaurant, or transit event.`}
            </p>
          </div>
        )}
      </div>

      {/* Quick Add Bar */}
      <QuickAddBar
        dayNumber={dayNumber}
        onAddGeneral={() => onAddActivity()}
        onAddCategory={(cat) => onAddActivity(cat)}
      />
    </section>
  );
};
