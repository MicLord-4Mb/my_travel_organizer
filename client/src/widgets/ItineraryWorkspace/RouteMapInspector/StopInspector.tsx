import React from 'react';
import {
  X,
  MapPin,
  ExternalLink,
  Clock,
  DollarSign,
  Bookmark,
  FileText,
  Edit2,
  Trash2,
} from 'lucide-react';
import type { PlaceEvent, EventCategory } from '@shared/types/models';
import { useCurrency } from '@shared/lib/useCurrency';
import { formatTimeWithPeriod } from '../lib/itineraryUtils';
import styles from './StopInspector.module.css';

export interface StopInspectorProps {
  event: PlaceEvent;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const CATEGORY_COLORS: Record<EventCategory, { label: string; color: string; bg: string }> = {
  dining: { label: 'DINING', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  activities: { label: 'ACTIVITY', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  transport: { label: 'TRANSIT', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  lodging: { label: 'LODGING', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' },
};

export const StopInspector: React.FC<StopInspectorProps> = ({
  event,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { format } = useCurrency();
  const cat =
    CATEGORY_COLORS[(event.category || 'activities') as EventCategory] ||
    CATEGORY_COLORS.activities;

  const timeFormatted = formatTimeWithPeriod(event.startTime);
  const endTimeFormatted = event.endTime ? formatTimeWithPeriod(event.endTime) : null;

  const fullLocationQuery = [
    event.location?.name,
    event.location?.address,
  ]
    .filter(Boolean)
    .join(', ');

  const googleMapsUrl = fullLocationQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullLocationQuery)}`
    : event.location?.lat && event.location?.lng
    ? `https://www.google.com/maps/search/?api=1&query=${event.location.lat},${event.location.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.title)}`;

  return (
    <div className={styles.inspectorContainer}>
      <div className={styles.inspectorHeader}>
        <div className={styles.titleArea}>
          <span
            className={styles.categoryBadge}
            style={{ color: cat.color, background: cat.bg }}
          >
            {cat.label}
          </span>
          <h4 className={styles.stopTitle}>{event.title}</h4>
        </div>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close stop inspector"
        >
          <X size={18} />
        </button>
      </div>

      <div className={styles.detailsList}>
        {/* Time */}
        {event.startTime && (
          <div className={styles.detailRow}>
            <Clock size={16} className={styles.detailIcon} />
            <div className={styles.detailContent}>
              <span className={styles.detailLabel}>Schedule</span>
              <span className={styles.detailValue}>
                {timeFormatted.time} {timeFormatted.period}
                {endTimeFormatted && ` – ${endTimeFormatted.time} ${endTimeFormatted.period}`}
              </span>
            </div>
          </div>
        )}

        {/* Cost */}
        <div className={styles.detailRow}>
          <DollarSign size={16} className={styles.detailIcon} />
          <div className={styles.detailContent}>
            <span className={styles.detailLabel}>Cost</span>
            <span className={styles.detailValue}>
              {event.cost ? format(event.cost, event.currency || 'USD') : 'Free'}
            </span>
          </div>
        </div>

        {/* Location & Address */}
        {(event.location?.name || event.location?.address) && (
          <div className={styles.detailRow}>
            <MapPin size={16} className={styles.detailIcon} />
            <div className={styles.detailContent}>
              <span className={styles.detailLabel}>Address & Landmark</span>
              <span className={styles.detailValue}>
                {event.location.name}
                {event.location.address && ` • ${event.location.address}`}
              </span>
            </div>
          </div>
        )}

        {/* Booking Ref */}
        {event.bookingRef && (
          <div className={styles.detailRow}>
            <Bookmark size={16} className={styles.detailIcon} />
            <div className={styles.detailContent}>
              <span className={styles.detailLabel}>Booking / Ticket Reference</span>
              <span className={styles.detailValue}>{event.bookingRef}</span>
            </div>
          </div>
        )}

        {/* Notes */}
        {event.notes && (
          <div className={styles.detailRow}>
            <FileText size={16} className={styles.detailIcon} />
            <div className={styles.detailContent}>
              <span className={styles.detailLabel}>Travel Notes</span>
              <span className={styles.detailValue}>{event.notes}</span>
            </div>
          </div>
        )}
      </div>

      <div className={styles.inspectorActions}>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.mapsBtn}
        >
          <ExternalLink size={14} />
          <span>Open in Google Maps</span>
        </a>

        <button type="button" className={styles.editBtn} onClick={onEdit}>
          <Edit2 size={14} />
          <span>Edit</span>
        </button>

        <button type="button" className={styles.deleteBtn} onClick={onDelete}>
          <Trash2 size={14} />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};
