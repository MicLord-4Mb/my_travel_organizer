```typescript
/**
 * 02. Domain Data Models
 * Path: docs/architecture/02-domain-models.md
 *
 * Strict data contracts. Every entity is prepared
 * for relational database structures and geo-integrations.
 */

export type EntityId = string; // UUID v4

// --- Base Interfaces ---
export interface AuditableEntity {
	id: EntityId;
	createdAt: string; // ISO 8601
	updatedAt: string; // ISO 8601
}

// --- Trip ---
export type TripStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export interface Trip extends AuditableEntity {
	title: string;
	description?: string;
	startDate: string; // YYYY-MM-DD
	endDate: string; // YYYY-MM-DD
	coverImageUrl?: string;
	/**
	 * Derived dynamically from `startDate`, `endDate`, and today's calendar date
	 * (`calculateTripStatus`). Only `cancelled` is a persisted manual override.
	 */
	status: TripStatus;
	budgetLimit?: number; // Undefined = unconstrained trip
	currency: string; // ISO 4217 (e.g., 'USD', 'EUR', 'ILS')
	location?: string;
	categoryBudgets?: Partial<Record<string, number>>;
}

// --- Daily Itinerary and Places ---
export type EventCategory = 'transport' | 'lodging' | 'activities' | 'dining';

export interface PlaceEvent extends AuditableEntity {
	tripId: EntityId;
	dayIndex: number; // 0, 1, 2... relative to start date
	order: number; // Gapless index (0, 1, 2...) for Drag & Drop within a day
	title: string;
	category?: EventCategory;
	notes?: string;
	location?: {
		name: string;
		address?: string;
		lat?: number;
		lng?: number;
	};
	startTime?: string; // HH:mm
	endTime?: string; // HH:mm (may be < startTime for overnight crossings)
	cost?: number;
	currency?: string;
	bookingRef?: string;
}

export interface DaySchedule {
	dayIndex: number;
	date: string; // Calculated dynamically: startDate + dayIndex
	events: PlaceEvent[];
}

// --- Finances and Budget ---
/**
 * Canonical expense categories used across UI, analytics, and forms.
 *
 * @deprecated Legacy aliases `'accommodation'` (-> `'lodging'`), `'food'` (-> `'dining'`),
 * and `'insurance'` (-> `'other'`) are normalized on read by `normalizeCategory` for
 * backward compatibility with older records, and must not be emitted by new writes.
 */
export type CanonicalExpenseCategory =
	| 'transport'
	| 'lodging'
	| 'dining'
	| 'activities'
	| 'shopping'
	| 'other';

/** @deprecated Legacy category aliases normalized at runtime by `normalizeCategory`. */
export type LegacyExpenseCategoryAlias = 'accommodation' | 'food' | 'insurance';

export type ExpenseCategory = CanonicalExpenseCategory | LegacyExpenseCategoryAlias;

export interface Expense extends AuditableEntity {
	tripId: EntityId;
	amount: number;
	currency: string;
	category: ExpenseCategory;
	title: string;
	date: string; // ISO Date YYYY-MM-DD
	placeEventId?: EntityId; // Optional link to a specific place
	paymentMethod?: string; // e.g., 'Card', 'Cash', 'Apple Pay'
	notes?: string; // Optional memo or receipt notes
	dayIndex?: number; // Relative day index (0 = Day 1, -1 = Pre-Trip)
}

// --- Checklist of items and tasks ---
export type ChecklistType = 'pretrip' | 'luggage';
export type ChecklistPriority = 'high' | 'normal' | 'optional';
export type ChecklistCategory =
	| 'documents'
	| 'bookings'
	| 'insurance'
	| 'clothes'
	| 'gear'
	| 'meds'
	| 'tasks';

export interface ChecklistItem extends AuditableEntity {
	tripId: EntityId;
	title: string;
	type?: ChecklistType;
	category: ChecklistCategory;
	isCompleted: boolean;
	priority?: ChecklistPriority;
	quantity?: number;
	assignedDayIndex?: number; // Optional task for a specific day
}

// --- Filters and Sorting ---
export interface TripFilterParams {
	searchQuery?: string;
	status?: TripStatus | 'all';
	startDateFrom?: string;
	startDateTo?: string;
	sortBy?: 'startDate' | 'createdAt' | 'title';
	sortDirection?: 'asc' | 'desc';
}
```
