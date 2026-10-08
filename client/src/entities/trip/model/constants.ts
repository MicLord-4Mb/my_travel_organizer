export const TRIP_STATUS_OPTIONS = [
  { value: 'planned', label: 'Upcoming (Planned)' },
  { value: 'in_progress', label: 'Active Now' },
  { value: 'completed', label: 'Completed (Past)' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

export const TRIP_SORT_OPTIONS = [
  { value: 'soonest', label: 'Sort: Date (Soonest)' },
  { value: 'budget', label: 'Sort: Budget (Highest)' },
  { value: 'alphabetical', label: 'Sort: Alphabetical' },
] as const;
