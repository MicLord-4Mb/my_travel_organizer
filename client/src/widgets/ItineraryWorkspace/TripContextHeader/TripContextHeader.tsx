import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { format } = useCurrency();
  const [copied, setCopied] = useState(false);

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
  const spent = trip.spentBudget ?? 0;
  const limit = trip.budgetLimit ?? 0;
  const hasBudget = limit > 0;
  const budgetPercent = hasBudget ? Math.min(100, Math.round((spent / limit) * 100)) : 0;

  const packed = trip.packedCount ?? 0;
  const totalChecklist = trip.totalChecklistCount ?? 0;
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

          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => navigate(`/trips/${trip.id}/checklists`)}
          >
            <CheckSquare size={16} />
            <span>Checklists</span>
            <span className={styles.indicatorDot} />
          </button>

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
          <div
            className={styles.metricBox}
            onClick={() => navigate(`/trips/${trip.id}/budget`)}
            style={{ cursor: 'pointer' }}
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
                style={{ width: `${budgetPercent}%` }}
              />
            </div>
          </div>

          {/* Checklist Quick Status */}
          <div
            className={styles.metricBox}
            onClick={() => navigate(`/trips/${trip.id}/checklists`)}
            style={{ cursor: 'pointer' }}
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
          </div>

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
