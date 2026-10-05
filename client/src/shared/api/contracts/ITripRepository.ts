import type { Trip, EntityId, PlaceEvent, Expense, ChecklistItem } from '@shared/types/models';

export interface ITripRepository {
  // Trips
  getAllTrips(): Promise<Trip[]>;
  getTripById(id: EntityId): Promise<Trip | null>;
  createTrip(payload: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Promise<Trip>;
  updateTrip(id: EntityId, payload: Partial<Trip>): Promise<Trip>;
  deleteTrip(id: EntityId): Promise<void>;
  duplicateTrip?(id: EntityId): Promise<Trip>;

  // Itinerary (Events)
  getEventsByTrip(tripId: EntityId): Promise<PlaceEvent[]>;
  saveEventsBatch(tripId: EntityId, events: PlaceEvent[]): Promise<PlaceEvent[]>;

  // Expenses & Checklists
  getExpenses(tripId: EntityId): Promise<Expense[]>;
  saveExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense>;
  deleteExpense(id: EntityId): Promise<void>;

  getChecklist(tripId: EntityId): Promise<ChecklistItem[]>;
  toggleChecklistItem(id: EntityId, isCompleted: boolean): Promise<ChecklistItem>;
}
