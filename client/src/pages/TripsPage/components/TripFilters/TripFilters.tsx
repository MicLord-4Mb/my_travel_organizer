import React from 'react';
import { Search, LayoutGrid, Rows } from 'lucide-react';
import { Tabs, Input, Select } from '@shared/ui';
import { TRIP_SORT_OPTIONS } from '@entities/trip';
import styles from './TripFilters.module.css';

export type FilterStatus = 'all' | 'upcoming' | 'active' | 'past';
export type SortOption = 'soonest' | 'budget' | 'alphabetical';
export type ViewMode = 'grid' | 'list';

export interface TripFiltersProps {
  currentStatus: FilterStatus;
  onStatusChange: (status: FilterStatus) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  counts: {
    all: number;
    upcoming: number;
    active: number;
    past: number;
  };
}

export const TripFilters: React.FC<TripFiltersProps> = ({
  currentStatus,
  onStatusChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  counts,
}) => {
  return (
    <div className={styles.filtersContainer}>
      <div className={styles.row}>
        {/* Status Filter Tabs */}
        <Tabs
          value={currentStatus}
          onValueChange={(val) => onStatusChange(val as FilterStatus)}
          variant="pills"
          items={[
            {
              value: 'all',
              label: 'All',
              count: counts.all,
            },
            {
              value: 'upcoming',
              label: 'Upcoming',
              count: counts.upcoming,
            },
            {
              value: 'active',
              label: 'Active',
              count: counts.active,
              dot: true,
            },
            {
              value: 'past',
              label: 'Past',
              count: counts.past,
            },
          ]}
        />

        {/* Search, Sort, and View Mode Cluster */}
        <div className={styles.controlsCluster}>
          <div className={styles.searchBox}>
            <Input
              type="text"
              placeholder="Search trips, places, tags..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              leftIcon={<Search size={18} />}
            />
          </div>

          <div className={styles.sortBox}>
            <Select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              options={TRIP_SORT_OPTIONS}
            />
          </div>

          <div className={styles.viewToggle} role="group" aria-label="Layout view mode">
            <button
              type="button"
              className={`${styles.toggleBtn} ${viewMode === 'grid' ? styles.active : ''}`}
              onClick={() => onViewModeChange('grid')}
              aria-label="Grid view"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.active : ''}`}
              onClick={() => onViewModeChange('list')}
              aria-label="List view"
            >
              <Rows size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
