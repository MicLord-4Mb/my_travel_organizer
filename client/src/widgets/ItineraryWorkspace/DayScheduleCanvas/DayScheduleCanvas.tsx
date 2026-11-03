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
import {
  CalendarPlus,
  Clock,
  Moon,
  AlertTriangle,
  CheckCircle2,
  MapPin,
} from 'lucide-react';
import type {
  PlaceEvent,
  EventCategory,
  EntityId,
  DayScheduleBounds,
} from '@shared/types/models';
import {
  formatDurationLabel,
  formatTimeWithPeriod,
  type ComputedDaySchedule,
  type ItineraryCategoryFilter,
  type TransitMode,
} from '@entities/itinerary';
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
  /** Cascaded timeline computation for this day (start/end bounds, carry-over, finish check) */
  daySchedule?: ComputedDaySchedule;
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
  /** Callback fired when user edits the day's start or target end time bounds */
  onUpdateDayBounds?: (bounds: DayScheduleBounds) => void;
}

/**
 * Interactive Timeline Canvas for an individual trip day.
 *
 * Implements accessible Drag-and-Drop (`@dnd-kit`) for reordering stops,
 * cascaded arrival/departure calculations, overnight carry-over banners,
 * configurable day start/end bounds, and dynamic transit segment calculations.
 */
export const DayScheduleCanvas: React.FC<DayScheduleCanvasProps> = ({
  events,
  filteredEvents,
  daySchedule,
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
  onUpdateDayBounds,
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

  const carryOver = daySchedule?.carryOver ?? null;
  const finishFormatted = daySchedule?.finishTime
    ? formatTimeWithPeriod(daySchedule.finishTime)
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

      {/* Configurable Day Schedule Bounds & Cascade Summary Bar */}
      {daySchedule && (
        <div className={styles.dayBoundsBar} aria-label={`Day ${dayNumber} Time Window`}>
          <div className={styles.boundsInputsGroup}>
            <label className={styles.boundControl}>
              <Clock size={13} className={styles.boundIcon} />
              <span className={styles.boundLabel}>Day Start:</span>
              <input
                type="time"
                aria-label={`Day ${dayNumber} Start Time`}
                className={styles.boundTimeInput}
                value={daySchedule.plannedStartTime}
                onChange={(e) => {
                  if (e.target.value && onUpdateDayBounds) {
                    onUpdateDayBounds({
                      startTime: e.target.value,
                      endTime: daySchedule.plannedEndTime,
                    });
                  }
                }}
              />
            </label>

            <span className={styles.boundArrow}>→</span>

            <label className={styles.boundControl}>
              <span className={styles.boundLabel}>Target End:</span>
              <input
                type="time"
                aria-label={`Day ${dayNumber} Target End Time`}
                className={styles.boundTimeInput}
                value={daySchedule.plannedEndTime}
                onChange={(e) => {
                  if (e.target.value && onUpdateDayBounds) {
                    onUpdateDayBounds({
                      startTime: daySchedule.plannedStartTime,
                      endTime: e.target.value,
                    });
                  }
                }}
              />
            </label>

            {daySchedule.isStartShiftedByCarryOver && (
              <span className={styles.shiftedStartBadge}>
                <Moon size={12} />
                <span>Starts at {daySchedule.effectiveStartTime} (after overnight stop)</span>
              </span>
            )}
          </div>

          <div className={styles.boundsStatusGroup}>
            {finishFormatted && (
              <span
                className={`${styles.finishEstimatePill} ${
                  daySchedule.isOverTargetEnd ? styles.finishEstimateOverrun : styles.finishEstimateOk
                }`}
              >
                {daySchedule.isOverTargetEnd ? (
                  <>
                    <AlertTriangle size={13} />
                    <span>
                      Est. Finish: {finishFormatted.time} {finishFormatted.period} (+
                      {formatDurationLabel(daySchedule.overrunMinutes)} over target)
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={13} />
                    <span>
                      Est. Finish: {finishFormatted.time} {finishFormatted.period}
                    </span>
                  </>
                )}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Vertical Timeline Feed */}
      <div className={styles.timelineStream}>
        {(filteredEvents.length > 0 || carryOver) && (
          <div className={styles.verticalGuideLine} />
        )}

        {/* Overnight Carry-Over Tail from Day N-1 */}
        {carryOver && (
          <>
            <div
              role="button"
              tabIndex={0}
              aria-label={`Overnight stop continued from Day ${carryOver.sourceDayIndex + 1}: ${carryOver.sourceEvent.title}`}
              className={styles.carryOverCard}
              onClick={() => onSelectEvent(carryOver.sourceEvent.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectEvent(carryOver.sourceEvent.id);
                }
              }}
            >
              <div className={styles.carryOverIconWrap}>
                <Moon size={16} />
              </div>
              <div className={styles.carryOverContent}>
                <div className={styles.carryOverTopRow}>
                  <span className={styles.carryOverTag}>
                    Continued from Day {carryOver.sourceDayIndex + 1}
                  </span>
                  <span className={styles.carryOverEndBadge}>
                    Finishes at {formatTimeWithPeriod(carryOver.endTime).time}{' '}
                    {formatTimeWithPeriod(carryOver.endTime).period}
                  </span>
                </div>
                <div className={styles.carryOverTitleRow}>
                  <strong className={styles.carryOverTitle}>
                    {carryOver.sourceEvent.title}
                  </strong>
                  {carryOver.sourceEvent.location?.name && (
                    <span className={styles.carryOverLocation}>
                      <MapPin size={12} />
                      {carryOver.sourceEvent.location.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {filteredEvents.length > 0 && (
              <TransitSegment
                fromEvent={carryOver.sourceEvent}
                toEvent={filteredEvents[0]}
                mode={transitMode}
              />
            )}
          </>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          accessibility={{
            announcements: {
              onDragStart({ active }) {
                const found = events.find((e) => e.id === active.id);
                return `Picked up activity ${found?.title ?? active.id}. Use arrow keys to move, Space or Enter to drop.`;
              },
              onDragOver({ active, over }) {
                const activeItem = events.find((e) => e.id === active.id);
                if (over) {
                  const overItem = events.find((e) => e.id === over.id);
                  return `Activity ${activeItem?.title ?? active.id} is over position of ${overItem?.title ?? over.id}.`;
                }
                return `Activity ${activeItem?.title ?? active.id} is no longer over a droppable area.`;
              },
              onDragEnd({ active, over }) {
                const activeItem = events.find((e) => e.id === active.id);
                if (over) {
                  const overItem = events.find((e) => e.id === over.id);
                  return `Dropped activity ${activeItem?.title ?? active.id} at position of ${overItem?.title ?? over.id}.`;
                }
                return `Dropped activity ${activeItem?.title ?? active.id}.`;
              },
              onDragCancel({ active }) {
                const activeItem = events.find((e) => e.id === active.id);
                return `Cancelled reordering of ${activeItem?.title ?? active.id}.`;
              },
            },
          }}
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
                isOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Empty state when no events in day / filter */}
        {filteredEvents.length === 0 && !carryOver && (
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
