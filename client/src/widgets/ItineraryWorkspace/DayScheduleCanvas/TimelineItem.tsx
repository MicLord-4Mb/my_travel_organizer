import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  MapPin,
  Info,
  Edit2,
  Trash2,
  QrCode,
  Clock,
  Moon,
  AlertTriangle,
} from 'lucide-react';
import type { PlaceEvent, EventCategory } from '@shared/types/models';
import { useCurrency } from '@shared/lib/useCurrency';
import {
  formatTimeWithPeriod,
  formatDurationLabel,
  getEventDurationMinutes,
  type ScheduledPlaceEvent,
} from '@entities/itinerary';
import styles from './TimelineItem.module.css';

export interface TimelineItemProps {
  event: PlaceEvent | ScheduledPlaceEvent;
  isSelected?: boolean;
  isDragDisabled?: boolean;
  isOverlay?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const CATEGORY_CONFIG: Record<
  EventCategory,
  { label: string; color: string; bg: string }
> = {
  dining: {
    label: 'DINING',
    color: 'var(--color-category-dining)',
    bg: 'var(--color-category-dining-bg)',
  },
  activities: {
    label: 'ACTIVITY',
    color: 'var(--color-category-activities)',
    bg: 'var(--color-category-activities-bg)',
  },
  transport: {
    label: 'TRANSIT',
    color: 'var(--color-category-transport)',
    bg: 'var(--color-category-transport-bg)',
  },
  lodging: {
    label: 'LODGING',
    color: 'var(--color-category-lodging)',
    bg: 'var(--color-category-lodging-bg)',
  },
};

export const TimelineItem: React.FC<TimelineItemProps> = ({
  event,
  isSelected,
  isDragDisabled = false,
  isOverlay = false,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const { format } = useCurrency();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: isOverlay ? `overlay-${event.id}` : event.id,
    disabled: isDragDisabled || isOverlay,
  });

  const style: React.CSSProperties | undefined = isOverlay
    ? undefined
    : {
        transform: CSS.Translate.toString(transform),
        transition,
      };

  const catKey = (event.category || 'activities') as EventCategory;
  const cat = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG.activities;
  const timeFormatted = formatTimeWithPeriod(event.startTime);
  const endTimeFormatted = event.endTime ? formatTimeWithPeriod(event.endTime) : null;
  const durationMinutes = getEventDurationMinutes(event);
  const isOvernightSpillover =
    'isOvernightSpillover' in event && Boolean(event.isOvernightSpillover);
  const exceedsTargetEnd =
    'exceedsTargetEnd' in event && Boolean(event.exceedsTargetEnd);

  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.();
    }
  };

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      className={`${styles.timelineRow} ${
        isDragging && !isOverlay ? styles.timelineRowDragging : ''
      } ${isOverlay ? styles.timelineRowOverlay : ''} ${
        isOver && !isDragging && !isOverlay ? styles.timelineRowDropTarget : ''
      }`}
    >
      {/* Node Timestamp */}
      <div className={styles.nodeTimestamp}>
        <span className={styles.timeNum}>{timeFormatted.time}</span>
        {timeFormatted.period && (
          <span className={styles.timePeriod}>{timeFormatted.period}</span>
        )}
        <div className={styles.coloredDot} style={{ background: cat.color }} />
      </div>

      {/* Main Card (role="button" + tabIndex so nested <button> controls stay valid HTML) */}
      <div
        role="button"
        tabIndex={0}
        aria-pressed={Boolean(isSelected)}
        aria-label={`Select stop ${event.title}`}
        className={`${styles.cardContainer} ${
          isSelected ? styles.cardSelected : ''
        }`}
        onClick={onSelect}
        onKeyDown={handleCardKeyDown}
      >
        <div
          className={styles.categoryStripe}
          style={{ background: cat.color }}
        />

        <div className={styles.cardContent}>
          <div className={styles.cardHeader}>
            <div className={styles.titleArea}>
              {!isDragDisabled && (
                <button
                  type="button"
                  className={styles.dragHandle}
                  {...attributes}
                  {...listeners}
                  title="Drag to reorder event"
                  aria-label={`Reorder ${event.title}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <GripVertical size={16} />
                </button>
              )}
              <span
                className={styles.categoryBadge}
                style={{ color: cat.color, background: cat.bg }}
              >
                {cat.label}
              </span>

              <h3 className={styles.eventTitle} title={event.title}>
                {event.title}
              </h3>
            </div>

            <div className={styles.headerRight}>
              {event.cost != null && event.cost > 0 ? (
                <span className={styles.costTag}>
                  {format(event.cost, event.currency || 'USD')}
                </span>
              ) : (
                <span className={styles.freeTag}>Free</span>
              )}

              {/* Action buttons */}
              <div
                className={styles.cardActions}
                onClick={(e) => e.stopPropagation()}
              >
                {onEdit && (
                  <button
                    type="button"
                    className={styles.actionIconBtn}
                    onClick={onEdit}
                    title="Edit stop"
                    aria-label={`Edit ${event.title}`}
                  >
                    <Edit2 size={14} />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    className={`${styles.actionIconBtn} ${styles.actionIconBtnDanger}`}
                    onClick={onDelete}
                    title="Delete stop"
                    aria-label={`Delete ${event.title}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Location, Stay Duration & Metadata notes */}
          <div className={styles.metaRow}>
            <span className={`${styles.metaItem} ${styles.durationBadge}`} title="Stay duration at this stop">
              <Clock size={13} />
              <span>
                {formatDurationLabel(durationMinutes)}
                {event.startTime && endTimeFormatted
                  ? ` (${timeFormatted.time} ${timeFormatted.period} → ${endTimeFormatted.time} ${endTimeFormatted.period})`
                  : ''}
              </span>
            </span>

            {isOvernightSpillover && (
              <span className={styles.overnightBadge}>
                <Moon size={12} />
                <span>
                  Continues to Day {(event.dayIndex ?? 0) + 2} (until {event.endTime})
                </span>
              </span>
            )}

            {exceedsTargetEnd && !isOvernightSpillover && (
              <span className={styles.overrunBadge}>
                <AlertTriangle size={12} />
                <span>Past target day end</span>
              </span>
            )}

            {event.location?.name && (
              <span className={styles.metaItem}>
                <MapPin size={14} color={cat.color} />
                <span>{event.location.name}</span>
              </span>
            )}

            {event.bookingRef && (
              <span className={`${styles.metaItem} ${styles.metaAccent}`}>
                <QrCode size={14} />
                <span>{event.bookingRef}</span>
              </span>
            )}

            {event.notes && (
              <span className={styles.metaItem} title={event.notes}>
                <Info size={14} />
                <span className={styles.notesEllipsis}>
                  {event.notes}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
