import React from 'react';
import {
  PlaneTakeoff,
  Filter,
  CheckCheck,
  RotateCcw,
  Sparkles,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@shared/ui';
import type { Trip } from '@shared/types/models';
import styles from './ChecklistHeader.module.css';

export interface ChecklistHeaderProps {
  currentTrip?: Trip | null;
  trips: Trip[];
  onSelectTrip: (tripId: string) => void;
  totalItems: number;
  completedItems: number;
  percentage: number;
  filterUnchecked: boolean;
  onToggleFilterUnchecked: () => void;
  onMarkAllCompleted: () => void;
  onResetChecklist: () => void;
  onOpenTemplates: () => void;
  onOpenAddItem: () => void;
}

export const ChecklistHeader: React.FC<ChecklistHeaderProps> = ({
  currentTrip,
  trips,
  onSelectTrip,
  totalItems,
  completedItems,
  percentage,
  filterUnchecked,
  onToggleFilterUnchecked,
  onMarkAllCompleted,
  onResetChecklist,
  onOpenTemplates,
  onOpenAddItem,
}) => {
  return (
    <section className={styles.headerContainer} aria-label="Checklist summary and controls">
      <div className={styles.topRow}>
        <div className={styles.infoArea}>
          <div className={styles.badgesRow}>
            <span className={styles.seasonBadge}>
              {currentTrip?.startDate
                ? `Trip ${new Date(currentTrip.startDate).getFullYear()}`
                : 'Current Expedition'}
            </span>
            <span className={styles.countdownBadge}>
              <PlaneTakeoff size={14} />
              {currentTrip?.status === 'in_progress'
                ? 'Active Now'
                : 'T-Minus 9 Days'}
            </span>
          </div>

          <div className={styles.titleRow}>
            <h1 className={styles.title}>
              {currentTrip?.title || 'Expedition Checklist'}
            </h1>

            {trips.length > 1 && (
              <select
                className={styles.tripSelect}
                value={currentTrip?.id || ''}
                onChange={(e) => onSelectTrip(e.target.value)}
                aria-label="Select trip"
              >
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    Switch: {t.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          <p className={styles.summaryText}>
            {totalItems} items • {completedItems} completed ({percentage}%)
          </p>
        </div>

        <div className={styles.actionButtons}>
          <button
            type="button"
            className={`${styles.actionBtn} ${filterUnchecked ? styles.active : ''}`}
            onClick={onToggleFilterUnchecked}
            aria-pressed={filterUnchecked}
          >
            <Filter size={16} />
            <span>{filterUnchecked ? 'Showing: Unchecked' : 'Filter: Unchecked only'}</span>
          </button>

          <button
            type="button"
            className={styles.actionBtn}
            onClick={onMarkAllCompleted}
            title="Mark all as completed"
          >
            <CheckCheck size={16} color="var(--color-primary)" />
            <span>Mark all</span>
          </button>

          <button
            type="button"
            className={`${styles.actionBtn} ${styles.danger}`}
            onClick={onResetChecklist}
            title="Reset all checkboxes"
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Sparkles size={16} />}
            onClick={onOpenTemplates}
          >
            Templates
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={16} />}
            onClick={onOpenAddItem}
          >
            Add Item
          </Button>
        </div>
      </div>

      {/* Progress Bar Section */}
      <div className={styles.progressSection}>
        <div className={styles.progressLabelRow}>
          <span className={styles.progressTitle}>
            <ShieldCheck size={16} color="var(--color-primary)" />
            Readiness &amp; Packing Index
          </span>
          <span className={`${styles.progressBadge} tabular-nums`}>
            {percentage}% Ready
          </span>
        </div>

        <div className={styles.track} role="progressbar" aria-valuenow={percentage}>
          <div className={styles.fill} style={{ width: `${percentage}%` }} />
        </div>
      </div>
    </section>
  );
};
