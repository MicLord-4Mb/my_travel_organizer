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
} from 'lucide-react';
import type { PlaceEvent, EventCategory } from '@shared/types/models';
import { useCurrency } from '@shared/lib/useCurrency';
import { formatTimeWithPeriod } from '../lib/itineraryUtils';
import styles from './TimelineItem.module.css';

export interface TimelineItemProps {
  event: PlaceEvent;
  isSelected?: boolean;
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
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.12)',
  },
  activities: {
    label: 'ACTIVITY',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.12)',
  },
  transport: {
    label: 'TRANSIT',
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.12)',
  },
  lodging: {
    label: 'LODGING',
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.12)',
  },
};

export const TimelineItem: React.FC<TimelineItemProps> = ({
  event,
  isSelected,
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
  } = useSortable({ id: event.id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const catKey = (event.category || 'activities') as EventCategory;
  const cat = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG.activities;
  const timeFormatted = formatTimeWithPeriod(event.startTime);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.timelineRow} ${
        isDragging ? styles.timelineRowDragging : ''
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

      {/* Main Card */}
      <div
        className={`${styles.cardContainer} ${
          isSelected ? styles.cardSelected : ''
        }`}
        onClick={onSelect}
      >
        <div
          className={styles.categoryStripe}
          style={{ background: cat.color }}
        />

        <div className={styles.cardContent}>
          <div className={styles.cardHeader}>
            <div className={styles.titleArea}>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Location & Metadata notes */}
          <div className={styles.metaRow}>
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
                <span style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
