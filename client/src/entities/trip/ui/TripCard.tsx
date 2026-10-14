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
import { useCurrency } from '@shared/lib/useCurrency';
import { inclusiveDayCount, parseLocalDate } from '@shared/lib/date';
import { useGetExpensesByTripIdQuery, useGetChecklistsByTripIdQuery } from '@shared/api/apiSlice';
import styles from './TripCard.module.css';

export interface TripCardProps {
  trip: Trip;
  viewMode?: 'grid' | 'list';
  spentBudget?: number;
  packedCount?: number;
  totalChecklistCount?: number;
  onEdit: (trip: Trip) => void;
  onDuplicate: (tripId: string) => void;
  onDelete: (tripId: string) => void;
}

// Helpers for formatted date ranges
function formatDateRange(startDateStr: string, endDateStr: string): string {
  try {
    const start = parseLocalDate(startDateStr);
    const end = parseLocalDate(endDateStr);
    if (!start || !end) return `${startDateStr} – ${endDateStr}`;
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
  return inclusiveDayCount(startDateStr, endDateStr);
}

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  viewMode = 'grid',
  spentBudget: propSpentBudget,
  packedCount: propPackedCount,
  totalChecklistCount: propTotalChecklistCount,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  const { format, sum } = useCurrency();
  const isPast = trip.status === 'completed';
  const isActive = trip.status === 'in_progress';
  const isUpcoming = trip.status === 'planned';
  const isCancelled = trip.status === 'cancelled';

  const totalDays = calculateDays(trip.startDate, trip.endDate);
  const dateRange = formatDateRange(trip.startDate, trip.endDate);

  const shouldFetchExpenses = propSpentBudget === undefined;
  const shouldFetchChecklists =
    propPackedCount === undefined || propTotalChecklistCount === undefined;

  const { data: tripExpenses = [] } = useGetExpensesByTripIdQuery(trip.id, {
    skip: !shouldFetchExpenses,
  });
  const { data: tripChecklists = [] } = useGetChecklistsByTripIdQuery(trip.id, {
    skip: !shouldFetchChecklists,
  });

  // Real values only: a missing budget limit / empty checklist is shown as such, never replaced by a made-up number.
  const budgetLimit = trip.budgetLimit ?? 0;
  const hasBudget = budgetLimit > 0;
  const spentBudget =
    propSpentBudget !== undefined
      ? propSpentBudget
      : sum(tripExpenses, trip.currency || 'USD');
  const budgetPercent = hasBudget
    ? Math.min(100, Math.round((spentBudget / budgetLimit) * 100))
    : 0;

  const totalChecklist =
    propTotalChecklistCount !== undefined
      ? propTotalChecklistCount
      : tripChecklists.length;
  const hasChecklist = totalChecklist > 0;
  const packedCount =
    propPackedCount !== undefined
      ? propPackedCount
      : tripChecklists.filter((c) => c.isCompleted).length;
  const packingPercent = hasChecklist
    ? Math.min(100, Math.round((packedCount / totalChecklist) * 100))
    : 0;

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
          {isCancelled && (
            <Badge variant="neutral" glass>
              Cancelled
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
            {totalDays} {totalDays === 1 ? 'Day' : 'Days'}
            {trip.description ? ` • ${trip.description}` : ''}
          </p>
        </div>

        {/* Metrics Block */}
        <div className={styles.metricsSection}>
          {isPast ? (
            <div className={styles.completedSummaryBox}>
              <span className={styles.completedItemsLabel}>
                <CheckCircle2 size={16} color="var(--color-status-success)" />
                {hasChecklist ? `${packedCount}/${totalChecklist} items packed` : 'No checklist'}
              </span>
              <span className={`${styles.metricValue} tabular-nums`}>
                {format(spentBudget, trip.currency)} Final
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
                    {hasChecklist ? (
                      <>
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
                      </>
                    ) : (
                      <span style={{ color: 'var(--color-text-secondary)' }}>No checklist yet</span>
                    )}
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
                    {format(spentBudget, trip.currency)}{' '}
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      {hasBudget
                        ? `/ ${format(budgetLimit, trip.currency)} (${budgetPercent}%)`
                        : '· no budget set'}
                    </span>
                  </span>
                </div>
                <ProgressBar
                  value={budgetPercent}
                  variant={
                    !hasBudget
                      ? 'muted'
                      : budgetPercent > 90
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
          {/* Spacer keeps the link right-aligned (collaborators are not a feature yet) */}
          <span aria-hidden="true" />

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
