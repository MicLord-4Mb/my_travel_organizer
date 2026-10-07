import type { Trip, EntityId, PlaceEvent, Expense, ChecklistItem } from '@shared/types/models';

/**
 * Data Access Contract for WanderFlow Travel Persistence.
 *
 * Implements the Repository Pattern to isolate business logic and UI components
 * from concrete persistence mechanisms (e.g. LocalStorage, IndexedDB, or REST API).
 */
export interface ITripRepository {
  // ==========================================
  // Trip Operations
  // ==========================================

  /**
   * Fetches all trips currently available in storage.
   * @returns {Promise<Trip[]>} List of all stored trips.
   */
  getAllTrips(): Promise<Trip[]>;

  /**
   * Retrieves a single trip by its unique identifier.
   * @param {EntityId} id - Unique trip ID.
   * @returns {Promise<Trip | null>} The found trip, or `null` if not found.
   */
  getTripById(id: EntityId): Promise<Trip | null>;

  /**
   * Persists a newly created trip.
   * @param {Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>} payload - Trip data without audit fields.
   * @returns {Promise<Trip>} The created trip with assigned ID and timestamps.
   */
  createTrip(payload: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Promise<Trip>;

  /**
   * Partially updates an existing trip.
   * @param {EntityId} id - ID of the trip to update.
   * @param {Partial<Trip>} payload - Subset of fields to update.
   * @returns {Promise<Trip>} The updated trip instance.
   */
  updateTrip(id: EntityId, payload: Partial<Trip>): Promise<Trip>;

  /**
   * Deletes a trip along with its cascading dependencies.
   * @param {EntityId} id - ID of the trip to delete.
   * @returns {Promise<void>} Resolves when deletion succeeds.
   */
  deleteTrip(id: EntityId): Promise<void>;

  /**
   * Creates a deep duplicate of an existing trip including its itinerary events.
   * @param {EntityId} id - ID of the source trip to clone.
   * @returns {Promise<Trip>} The duplicated new trip.
   */
  duplicateTrip(id: EntityId): Promise<Trip>;

  // ==========================================
  // Itinerary (Events) Operations
  // ==========================================

  /**
   * Retrieves all itinerary events associated with a trip.
   * @param {EntityId} tripId - ID of the parent trip.
   * @returns {Promise<PlaceEvent[]>} List of scheduled place events.
   */
  getEventsByTrip(tripId: EntityId): Promise<PlaceEvent[]>;

  /**
   * Re-numbers the `order` property of events for a specific day.
   * Non-destructive: events belonging to other days or trips are preserved.
   *
   * @param {EntityId} tripId - Parent trip ID.
   * @param {number} dayIndex - Zero-based day index.
   * @param {EntityId[]} orderedIds - Ordered list of event IDs reflecting the new sequence.
   * @returns {Promise<PlaceEvent[]>} Updated events for that day in the new order.
   */
  reorderEvents(tripId: EntityId, dayIndex: number, orderedIds: EntityId[]): Promise<PlaceEvent[]>;

  /**
   * Adds a new event to a trip's itinerary.
   * @param {Omit<PlaceEvent, 'id' | 'createdAt' | 'updatedAt'>} event - Event details.
   * @returns {Promise<PlaceEvent>} Created event with ID and timestamps.
   */
  createEvent(event: Omit<PlaceEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<PlaceEvent>;

  /**
   * Updates an existing itinerary event.
   * @param {EntityId} id - Event ID.
   * @param {Partial<PlaceEvent>} payload - Modified fields.
   * @returns {Promise<PlaceEvent>} Updated event.
   */
  updateEvent(id: EntityId, payload: Partial<PlaceEvent>): Promise<PlaceEvent>;

  /**
   * Removes an itinerary event.
   * @param {EntityId} id - Event ID to delete.
   * @returns {Promise<void>} Resolves on deletion.
   */
  deleteEvent(id: EntityId): Promise<void>;

  // ==========================================
  // Expenses Operations
  // ==========================================

  /**
   * Retrieves all logged expenses for a specific trip.
   * @param {EntityId} tripId - Parent trip ID.
   * @returns {Promise<Expense[]>} List of expenses.
   */
  getExpenses(tripId: EntityId): Promise<Expense[]>;

  /**
   * Logs a new financial transaction for a trip.
   * @param {Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>} expense - Transaction data.
   * @returns {Promise<Expense>} Created expense record.
   */
  saveExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense>;

  /**
   * Modifies an existing expense record.
   * @param {EntityId} id - Expense ID.
   * @param {Partial<Expense>} payload - Changed expense attributes.
   * @returns {Promise<Expense>} Updated expense.
   */
  updateExpense(id: EntityId, payload: Partial<Expense>): Promise<Expense>;

  /**
   * Removes an expense record.
   * @param {EntityId} id - Expense ID.
   * @returns {Promise<void>} Resolves on deletion.
   */
  deleteExpense(id: EntityId): Promise<void>;

  // ==========================================
  // Checklist Operations
  // ==========================================

  /**
   * Retrieves all packing and pre-trip checklist items for a trip.
   * @param {EntityId} tripId - Parent trip ID.
   * @returns {Promise<ChecklistItem[]>} Checklist items.
   */
  getChecklist(tripId: EntityId): Promise<ChecklistItem[]>;

  /**
   * Toggles the completion state (`isCompleted`) of an individual checklist item.
   * @param {EntityId} id - Checklist item ID.
   * @param {boolean} isCompleted - Desired completion flag.
   * @returns {Promise<ChecklistItem>} Updated item.
   */
  toggleChecklistItem(id: EntityId, isCompleted: boolean): Promise<ChecklistItem>;

  /**
   * Adds an item to the trip checklist.
   * @param {Omit<ChecklistItem, 'id' | 'createdAt' | 'updatedAt'>} item - Item data.
   * @returns {Promise<ChecklistItem>} Created item.
   */
  addChecklistItem(item: Omit<ChecklistItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChecklistItem>;

  /**
   * Deletes a checklist item.
   * @param {EntityId} id - Item ID.
   * @returns {Promise<void>} Resolves on deletion.
   */
  deleteChecklistItem(id: EntityId): Promise<void>;

  /**
   * Batch updates completion status for all checklist items of a trip.
   * @param {EntityId} tripId - Parent trip ID.
   * @param {boolean} isCompleted - Status to apply to all items.
   * @returns {Promise<ChecklistItem[]>} All modified checklist items.
   */
  setAllChecklistStatus(tripId: EntityId, isCompleted: boolean): Promise<ChecklistItem[]>;

  /**
   * Generates preset checklist items from a predefined packing template.
   * @param {EntityId} tripId - Parent trip ID.
   * @param {string} templateId - Identifier of the template (e.g. 'international', 'beach').
   * @returns {Promise<ChecklistItem[]>} Newly inserted checklist items.
   */
  applyChecklistTemplate(tripId: EntityId, templateId: string): Promise<ChecklistItem[]>;
}
