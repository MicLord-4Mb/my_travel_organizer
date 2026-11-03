import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Share2,
  CheckSquare,
  FileDown,
  Calendar,
  MapPin,
  Edit2,
  Plus,
  Check,
} from 'lucide-react';
import { Badge } from '@shared/ui';
import type { Trip } from '@shared/types/models';
import { useCurrency } from '@shared/lib/useCurrency';
import { parseLocalDate } from '@shared/lib/date';
import { getBudgetPercent, getBudgetState } from '@entities/expense';
import { useGetExpensesByTripIdQuery, useGetChecklistsByTripIdQuery } from '@shared/api/apiSlice';
import styles from './TripContextHeader.module.css';

export interface TripContextHeaderProps {
  trip: Trip;
  totalDays: number;
  onAddActivity: () => void;
  onEditTrip?: () => void;
}

export const TripContextHeader: React.FC<TripContextHeaderProps> = ({
  trip,
  totalDays,
  onAddActivity,
  onEditTrip,
}) => {
  const { format, sum } = useCurrency();
  const [copied, setCopied] = useState(false);

  const { data: tripExpenses = [] } = useGetExpensesByTripIdQuery(trip.id);
  const { data: tripChecklists = [] } = useGetChecklistsByTripIdQuery(trip.id);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPdf = () => {
    window.print();
  };

  const formatDateRange = () => {
    const startDate = parseLocalDate(trip.startDate);
    const endDate = parseLocalDate(trip.endDate);
    if (!startDate || !endDate) return 'Flexible Dates';
    const s = startDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const e = endDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${s} – ${e}`;
  };

  // Real values only: a missing budget limit / empty checklist is shown as such.
  const spent = sum(tripExpenses, trip.currency || 'USD');
  const limit = trip.budgetLimit ?? 0;
  const hasBudget = limit > 0;
  // Not capped at 100 so an overspend stays visible (e.g. 140%)
  const budgetPercent = getBudgetPercent(spent, limit);
  const budgetState = getBudgetState(spent, limit);

  const totalChecklist = tripChecklists.length;
  const packed = tripChecklists.filter(c => c.isCompleted).length;
  const checklistPercent =
    totalChecklist > 0 ? Math.min(100, Math.round((packed / totalChecklist) * 100)) : 0;

  return (
    <div className={styles.headerWrapper}>
      {/* Top navigation row */}
      <div className={styles.topBar}>
        <Link to="/" className={styles.backLink}>
          <ArrowLeft size={18} />
          <span>Back to Trips</span>
        </Link>

        <div className={styles.actionsGroup}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleShare}
            title="Copy shareable link"
          >
            {copied ? <Check size={16} color="var(--color-primary)" /> : <Share2 size={16} />}
            <span>{copied ? 'Link Copied!' : 'Share Trip'}</span>
          </button>

          <Link to={`/trips/${trip.id}/checklists`} className={styles.actionBtn}>
            <CheckSquare size={16} />
            <span>Checklists</span>
            <span className={styles.indicatorDot} />
          </Link>

          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleExportPdf}
            title="Print or export as PDF"
          >
            <FileDown size={16} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Main Trip Context Card */}
      <div className={styles.card}>
        <div className={styles.infoGroup}>
          <div className={styles.titleRow}>
            <h1 className={styles.tripTitle}>
              {trip.title}
              {onEditTrip && (
                <button
                  type="button"
                  className={styles.editTitleBtn}
                  onClick={onEditTrip}
                  aria-label="Edit trip details"
                >
                  <Edit2 size={16} />
                </button>
              )}
            </h1>

            <Badge
              variant={
                trip.status === 'in_progress'
                  ? 'active'
                  : trip.status === 'completed'
                  ? 'past'
                  : trip.status === 'cancelled'
                  ? 'neutral'
                  : 'upcoming'
              }
              pulseDot={trip.status === 'in_progress'}
            >
              {trip.status === 'in_progress'
                ? 'ACTIVE NOW'
                : trip.status === 'completed'
                ? 'COMPLETED'
                : trip.status === 'cancelled'
                ? 'CANCELLED'
                : 'PLANNED'}
            </Badge>
          </div>

          <div className={styles.metaRow}>
            <span className={styles.metaItem}>
              <Calendar size={15} />
              <span>{formatDateRange()}</span>
            </span>

            <span className={styles.metaDot} />

            <span className={styles.metaItem}>
              <span>{totalDays} Days</span>
            </span>

            {trip.location && (
              <>
                <span className={styles.metaDot} />
                <span className={styles.metaItem}>
                  <MapPin size={15} />
                  <span>{trip.location}</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Metrics & Add button */}
        <div className={styles.metricsGroup}>
          {/* Budget Widget */}
          <Link
            className={styles.metricBox}
            to={`/trips/${trip.id}/budget`}
            title="View budget & expenses"
          >
            <div className={styles.metricText}>
              <span className={styles.metricLabel}>Estimated Budget</span>
              <div className={styles.metricValue}>
                <span>{format(spent, trip.currency)}</span>
                <span className={styles.metricTotal}>
                  {hasBudget ? `/ ${format(limit, trip.currency)}` : '· no limit set'}
                </span>
              </div>
            </div>
            <div className={styles.progressBarContainer}>
              <div
                className={styles.progressBarFill}
                style={{
                  width: `${Math.min(100, budgetPercent)}%`,
                  ...(budgetState === 'danger' ? { background: 'var(--color-status-danger)' } : {}),
                  ...(budgetState === 'warning' ? { background: 'var(--color-category-dining)' } : {}),
                }}
              />
            </div>
            {hasBudget && budgetState === 'danger' && (
              <span className={styles.metricTotal} role="status">
                Over budget · {budgetPercent}% used
              </span>
            )}
          </Link>

          {/* Checklist Quick Status */}
          <Link
            className={styles.metricBox}
            to={`/trips/${trip.id}/checklists`}
            title="View checklist packing"
          >
            <div className={styles.metricText}>
              <span className={styles.metricLabel}>Packing Readiness</span>
              <div className={styles.metricValue}>
                <span>{packed}</span>
                <span className={styles.metricTotal}>
                  {totalChecklist > 0 ? `/ ${totalChecklist} Ready` : '· no items yet'}
                </span>
              </div>
            </div>
            <div className={styles.progressBarContainer}>
              <div
                className={styles.progressBarFill}
                style={{
                  width: `${checklistPercent}%`,
                  background: 'var(--color-category-activities)',
                }}
              />
            </div>
          </Link>

          <button
            type="button"
            className={styles.addStopBtn}
            onClick={onAddActivity}
          >
            <Plus size={18} />
            <span>+ Add Activity</span>
          </button>
        </div>
      </div>
    </div>
  );
};
