import React from 'react';
import type { ItineraryCategoryFilter } from '@entities/itinerary';
import styles from './TimelineFilters.module.css';

export interface TimelineFiltersProps {
  dayLabel: string;
  activitiesCount: number;
  currentFilter: ItineraryCategoryFilter;
  onFilterChange: (filter: ItineraryCategoryFilter) => void;
}

const CATEGORY_CHIPS: Array<{
  key: ItineraryCategoryFilter;
  label: string;
  dotColor?: string;
}> = [
  { key: 'all', label: 'ALL' },
  { key: 'food', label: 'FOOD', dotColor: 'var(--color-category-dining)' },
  { key: 'spots', label: 'SPOTS', dotColor: 'var(--color-category-activities)' },
  { key: 'transit', label: 'TRANSIT', dotColor: 'var(--color-category-transport)' },
  { key: 'lodging', label: 'LODGING', dotColor: 'var(--color-category-lodging)' },
];

export const TimelineFilters: React.FC<TimelineFiltersProps> = ({
  dayLabel,
  activitiesCount,
  currentFilter,
  onFilterChange,
}) => {
  return (
    <div className={styles.filterBar}>
      <div className={styles.daySummary}>
        <span className={styles.dayTitle}>{dayLabel}</span>
        <span className={styles.activityCount}>
          • {activitiesCount} {activitiesCount === 1 ? 'Activity' : 'Activities'} Planned
        </span>
      </div>

      <div className={styles.filtersGroup}>
        <span className={styles.filterLabel}>Filter:</span>
        {CATEGORY_CHIPS.map((chip) => {
          const isActive = currentFilter === chip.key;
          return (
            <button
              key={chip.key}
              type="button"
              className={`${styles.chip} ${isActive ? styles.chipActive : ''}`}
              onClick={() => onFilterChange(chip.key)}
            >
              {chip.dotColor && !isActive && (
                <span
                  className={styles.categoryDot}
                  style={{ background: chip.dotColor }}
                />
              )}
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
