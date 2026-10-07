/**
 * Core Domain Models and Value Types for WanderFlow Travel Organizer.
 *
 * This module defines the central domain contracts used across UI components,
 * Redux slices, and API endpoints. Adheres to Feature-Sliced Design (FSD) principles.
 */

/**
 * Unique identifier for domain entities (typically UUID v4 or formatted slug string).
 */
export type EntityId = string;

/**
 * Base interface for persistent domain entities requiring audit metadata.
 */
export interface AuditableEntity {
  /** Unique primary key identifier */
  id: EntityId;
  /** ISO 8601 UTC timestamp of creation */
  createdAt: string;
  /** ISO 8601 UTC timestamp of last update */
  updatedAt: string;
}

// ==========================================
// Trip Models
// ==========================================

/**
 * Operational lifecycle statuses of a trip.
 */
export type TripStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

/**
 * Represents a user's travel project / trip plan.
 */
export interface Trip extends AuditableEntity {
  /** Human-readable trip title or name */
  title: string;
  /** Detailed description, notes, or goals */
  description?: string;
  /** Calendar start date in YYYY-MM-DD format (local date) */
  startDate: string;
  /** Calendar end date in YYYY-MM-DD format (local date) */
  endDate: string;
  /** Remote URL for cover/hero card imagery */
  coverImageUrl?: string;
  /** Lifecycle progress status */
  status: TripStatus;
  /** Optional overall budget limit in base currency */
  budgetLimit?: number;
  /** ISO 4217 currency code (e.g., 'USD', 'EUR', 'JPY') */
  currency: string;
  /** Geographic destination or primary region */
  location?: string;
  /** Cached total spent amount in base currency */
  spentBudget?: number;
  /** Cached count of packed checklist items */
  packedCount?: number;
  /** Cached total count of checklist items */
  totalChecklistCount?: number;
  /** Specific spending limits per category */
  categoryBudgets?: Partial<Record<string, number>>;
}

// ==========================================
// Itinerary and Events Models
// ==========================================

/**
 * Primary categories for scheduled itinerary events.
 */
export type EventCategory = 'transport' | 'lodging' | 'activities' | 'dining';

/**
 * Geographic coordinates and address details of an itinerary stop.
 */
export interface EventLocation {
  /** Name of the venue or landmark */
  name: string;
  /** Physical street address */
  address?: string;
  /** Latitude coordinate (-90 to 90) */
  lat?: number;
  /** Longitude coordinate (-180 to 180) */
  lng?: number;
}

/**
 * Represents an activity, transport leg, or lodging stay scheduled within a trip.
 */
export interface PlaceEvent extends AuditableEntity {
  /** Foreign key pointing to the associated Trip */
  tripId: EntityId;
  /** Zero-based day index relative to `Trip.startDate` (0 = Day 1) */
  dayIndex: number;
  /** Sequence index for ordering events within a single day */
  order: number;
  /** Display title of the event */
  title: string;
  /** Category determining icon, color scheme, and grouping */
  category?: EventCategory;
  /** Additional memos, instructions, or tips */
  notes?: string;
  /** Geo-location information */
  location?: EventLocation;
  /** 24h start time string (HH:mm) */
  startTime?: string;
  /** 24h end time string (HH:mm) */
  endTime?: string;
  /** Estimated or actual price for this event */
  cost?: number;
  /** ISO 4217 currency for the cost */
  currency?: string;
  /** Confirmation or reservation reference number */
  bookingRef?: string;
}

/**
 * Aggregated schedule representation for a single day of a trip.
 */
export interface DaySchedule {
  /** Zero-based day index relative to trip start */
  dayIndex: number;
  /** ISO date string calculated from `startDate + dayIndex` */
  date: string;
  /** Ordered list of events occurring on this day */
  events: PlaceEvent[];
}

// ==========================================
// Finances and Expenses Models
// ==========================================

/**
 * Financial spending categories for transactions and budget allocation.
 */
export type ExpenseCategory =
  | 'transport'
  | 'lodging'
  | 'dining'
  | 'activities'
  | 'shopping'
  | 'insurance'
  | 'other'
  | 'accommodation'
  | 'food';

/**
 * Represents an individual financial expense recorded for a trip.
 */
export interface Expense extends AuditableEntity {
  /** Foreign key pointing to the owning Trip */
  tripId: EntityId;
  /** Transaction monetary amount */
  amount: number;
  /** ISO 4217 currency code of the transaction */
  currency: string;
  /** Budget allocation category */
  category: ExpenseCategory;
  /** Merchant name or expense description */
  title: string;
  /** Date of transaction in YYYY-MM-DD format */
  date: string;
  /** Optional relation linking this expense directly to an itinerary stop */
  placeEventId?: EntityId;
  /** Payment instrument used (e.g. 'Credit Card', 'Cash') */
  paymentMethod?: string;
  /** Optional transaction memo or receipt notes */
  notes?: string;
  /** Relative day index (0 = Day 1, -1 = Pre-trip expense) */
  dayIndex?: number;
}

// ==========================================
// Currency and Exchange Rates Models
// ==========================================

/**
 * Metadata for a supported world currency.
 */
export interface Currency {
  /** Unique entity ID */
  id: string;
  /** Standard 3-letter ISO 4217 code (e.g. 'USD', 'EUR') */
  code: string;
  /** Graphic symbol (e.g. '$', '€', '¥') */
  symbol: string;
  /** Localized display name */
  name: string;
}

/**
 * Exchange rate table relative to a base currency.
 */
export interface ExchangeRateTable {
  /** Unique table identifier */
  id: string;
  /** Base currency against which rates are defined (e.g. 'USD') */
  base: string;
  /** Map of ISO currency codes to conversion multipliers */
  rates: Record<string, number>;
}

// ==========================================
// Checklist Models
// ==========================================

/**
 * Checklist classification (pre-trip preparations vs physical packing).
 */
export type ChecklistType = 'pretrip' | 'luggage';

/**
 * Urgency/importance priority levels for checklist items.
 */
export type ChecklistPriority = 'high' | 'normal' | 'optional';

/**
 * Segmented categories for checklist organization.
 */
export type ChecklistCategory =
  | 'documents'
  | 'bookings'
  | 'insurance'
  | 'clothes'
  | 'gear'
  | 'meds'
  | 'tasks';

/**
 * Individual task or packing item in a trip's checklist.
 */
export interface ChecklistItem extends AuditableEntity {
  /** Foreign key pointing to the owning Trip */
  tripId: EntityId;
  /** Description or item label */
  title: string;
  /** Phase type (pre-trip task or luggage packing) */
  type?: ChecklistType;
  /** Organizational grouping */
  category: ChecklistCategory;
  /** Completion / packed state flag */
  isCompleted: boolean;
  /** Urgency level */
  priority?: ChecklistPriority;
  /** Optional item quantity */
  quantity?: number;
  /** Optional day assignment for timed tasks */
  assignedDayIndex?: number;
}

// ==========================================
// Query and Filter Models
// ==========================================

/**
 * Filter and sorting criteria for trip catalog views.
 */
export interface TripFilterParams {
  /** Search string matching title or destination */
  searchQuery?: string;
  /** Status filter or 'all' for unconstrained */
  status?: TripStatus | 'all';
  /** Range lower bound for start date (YYYY-MM-DD) */
  startDateFrom?: string;
  /** Range upper bound for start date (YYYY-MM-DD) */
  startDateTo?: string;
  /** Sorting attribute */
  sortBy?: 'startDate' | 'createdAt' | 'title';
  /** Sort order direction */
  sortDirection?: 'asc' | 'desc';
}
