import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  MoreVertical,
  Backpack,
  Wallet,
  CheckCircle2,
  ArrowRight,
  Edit,
  Copy,
  Trash2,
} from 'lucide-react';
import { Badge, ProgressBar, DropdownMenu } from '@shared/ui';
import type { Trip } from '@shared/types/models';
import styles from './TripCard.module.css';

export interface TripCardProps {
  trip: Trip;
  viewMode?: 'grid' | 'list';
  onEdit: (trip: Trip) => void;
  onDuplicate: (tripId: string) => void;
  onDelete: (tripId: string) => void;
}

// Helpers for formatted date ranges
function formatDateRange(startDateStr: string, endDateStr: string): string {
  try {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    const startDay = start.getDate();
    const endDay = end.getDate();
    const year = end.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}–${endDay}, ${year}`;
    }
    return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;
  } catch {
    return `${startDateStr} – ${endDateStr}`;
  }
}

function calculateDays(startDateStr: string, endDateStr: string): number {
  try {
    const start = new Date(startDateStr).getTime();
    const end = new Date(endDateStr).getTime();
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diff);
  } catch {
    return 1;
  }
}

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  viewMode = 'grid',
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  const isPast = trip.status === 'completed';
  const isActive = trip.status === 'in_progress';
  const isUpcoming = trip.status === 'planned';

  const totalDays = calculateDays(trip.startDate, trip.endDate);
  const dateRange = formatDateRange(trip.startDate, trip.endDate);

  const budgetLimit = trip.budgetLimit || 2000;
  const spentBudget = trip.spentBudget || 0;
  const budgetPercent = Math.min(100, Math.round((spentBudget / budgetLimit) * 100));

  const totalChecklist = trip.totalChecklistCount || 12;
  const packedCount = trip.packedCount || 0;
  const packingPercent = Math.min(100, Math.round((packedCount / totalChecklist) * 100));

  return (
    <article
      className={`${styles.card} ${viewMode === 'list' ? styles.listMode : ''}`}
      data-trip-id={trip.id}
    >
      {/* 16:9 Cover Image */}
      <div className={styles.mediaContainer}>
        <img
          src={
            trip.coverImageUrl ||
            'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80'
          }
          alt={trip.title}
          className={styles.coverImage}
          loading="lazy"
        />

        {/* Top Badges Overlay */}
        <div className={styles.topOverlay}>
          {isActive && (
            <Badge variant="active" glass withDot pulseDot>
              Active Now
            </Badge>
          )}
          {isUpcoming && (
            <Badge variant="upcoming" glass>
              Upcoming
            </Badge>
          )}
          {isPast && (
            <Badge variant="past" glass>
              Completed
            </Badge>
          )}

          <Badge variant="neutral" glass>
            {dateRange}
          </Badge>
        </div>

        {/* Bottom Location Tag */}
        {trip.location && (
          <div className={styles.bottomOverlay}>
            <span className={styles.locationIcon}>
              <MapPin size={15} />
            </span>
            <span>{trip.location}</span>
          </div>
        )}
      </div>

      {/* Card Content Body */}
      <div className={styles.body}>
        <div className={styles.headerSection}>
          <div className={styles.titleRow}>
            <Link to={`/trips/${trip.id}`} className={styles.title}>
              <h2>{trip.title}</h2>
            </Link>

            {/* Context Action Menu */}
            <DropdownMenu
              align="end"
              trigger={
                <button
                  type="button"
                  className={styles.menuBtn}
                  aria-label="Trip actions"
                >
                  <MoreVertical size={18} />
                </button>
              }
              items={[
                {
                  key: 'edit',
                  label: 'Edit Trip',
                  icon: <Edit size={15} />,
                  onClick: () => onEdit(trip),
                },
                {
                  key: 'duplicate',
                  label: 'Duplicate',
                  icon: <Copy size={15} />,
                  onClick: () => onDuplicate(trip.id),
                },
                'separator',
                {
                  key: 'delete',
                  label: 'Delete',
                  icon: <Trash2 size={15} />,
                  destructive: true,
                  onClick: () => onDelete(trip.id),
                },
              ]}
            />
          </div>

          <p className={styles.subtitle}>
            {totalDays} Days • {trip.description || 'Scenic adventure & exploration'}
          </p>
        </div>

        {/* Metrics Block */}
        <div className={styles.metricsSection}>
          {isPast ? (
            <div className={styles.completedSummaryBox}>
              <span className={styles.completedItemsLabel}>
                <CheckCircle2 size={16} color="var(--color-status-success)" />
                All {totalChecklist} items returned
              </span>
              <span className={`${styles.metricValue} tabular-nums`}>
                ${spentBudget.toLocaleString()} Final
              </span>
            </div>
          ) : (
            <>
              {/* Packing Tracker */}
              <div className={styles.metricRow}>
                <div className={styles.metricLabelRow}>
                  <span className={styles.metricName}>
                    <Backpack size={14} /> Packing Progress
                  </span>
                  <span className={`${styles.metricValue} tabular-nums`}>
                    {packedCount}/{totalChecklist} items{' '}
                    <span
                      style={{
                        color:
                          packingPercent > 50
                            ? 'var(--color-status-success)'
                            : 'var(--color-text-secondary)',
                      }}
                    >
                      ({packingPercent}%)
                    </span>
                  </span>
                </div>
                <ProgressBar
                  value={packingPercent}
                  variant={
                    packingPercent > 50
                      ? 'success'
                      : packingPercent > 0
                      ? 'transport'
                      : 'muted'
                  }
                />
              </div>

              {/* Budget Tracker */}
              <div className={styles.metricRow}>
                <div className={styles.metricLabelRow}>
                  <span className={styles.metricName}>
                    <Wallet size={14} /> Budget Usage
                  </span>
                  <span className={`${styles.metricValue} tabular-nums`}>
                    ${spentBudget.toLocaleString()}{' '}
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      / ${budgetLimit.toLocaleString()} ({budgetPercent}%)
                    </span>
                  </span>
                </div>
                <ProgressBar
                  value={budgetPercent}
                  variant={
                    budgetPercent > 90
                      ? 'danger'
                      : budgetPercent > 60
                      ? 'warning'
                      : 'success'
                  }
                />
              </div>
            </>
          )}
        </div>

        {/* Footer Info */}
        <div className={styles.footer}>
          <div className={styles.collaborators}>
            <div className={styles.avatarOverlap}>
              <img
                src="/user-avatar-planner.png"
                alt="Member"
                className={styles.avatarImg}
              />
            </div>
            <div className={`${styles.avatarOverlap} ${styles.avatarInitial}`}>
              +2
            </div>
          </div>

          <Link
            to={`/trips/${trip.id}`}
            className={`${styles.openLink} ${isPast ? styles.archivedLink : ''}`}
          >
            {isPast ? 'View Log' : 'Open Workspace'}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
};
