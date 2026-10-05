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
	status: TripStatus; 
	budgetLimit?: number; 
	currency: string; // ISO 4217 (e.g., 'USD', 'EUR', 'ILS')
	location?: string;
	spentBudget?: number;
	packedCount?: number;
	totalChecklistCount?: number;
}

// --- Daily Itinerary and Places ---
export interface PlaceEvent extends AuditableEntity {
	tripId: EntityId; 
	dayIndex: number; // 0, 1, 2... relative to start date
	order: number; // Index for Drag & Drop
	title: string; 
	notes?: string; 
	location?: {
		name: string; 
		lat?: number; 
		lng?: number; 
	}; 
	startTime?: string; // HH:mm
	endTime?: string; // HH:mm
	cost?: number;
}

export interface DaySchedule {
	dayIndex: number; 
	date: string; // Calculated dynamically: startDate + dayIndex
	events: PlaceEvent[];
}

// --- Finances and Budget ---
export type ExpenseCategory =
	| 'transport'
	| 'accommodation'
	| 'food'
	| 'activities'
	| 'shopping'
	| 'insurance'
	| 'other';

export interface Expense extends AuditableEntity {
	tripId: EntityId; 
	amount: number; 
	currency: string; 
	category: ExpenseCategory; 
	title: string; 
	date: string; // ISO Date
	placeEventId?: EntityId; // Optional link to a specific place
}

// --- Checklist of items and tasks ---
export type ChecklistCategory = 'documents' | 'clothes' | 'gear' | 'tasks' | 'meds';

export interface ChecklistItem extends AuditableEntity {
	tripId: EntityId; 
	title: string; 
	category: ChecklistCategory; 
	isCompleted: boolean; 
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
