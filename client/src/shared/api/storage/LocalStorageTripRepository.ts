import type { ITripRepository } from '@shared/api/contracts/ITripRepository';
import type { Trip, EntityId, PlaceEvent, Expense, ChecklistItem } from '@shared/types/models';

const STORAGE_KEY = 'travel_organizer_data_v2';

interface StorageData {
  trips: Trip[];
  events: PlaceEvent[];
  expenses: Expense[];
  checklists: ChecklistItem[];
}

const mockData: StorageData = {
  trips: [
    {
      id: 'mock-trip-1',
      title: 'Autumn in Tokyo & Kyoto',
      description: '8 Days • High-speed Shinkansen & boutique ryokan stay',
      startDate: '2026-10-12',
      endDate: '2026-10-20',
      coverImageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
      status: 'in_progress',
      location: 'Tokyo, Japan',
      budgetLimit: 2000,
      spentBudget: 1450,
      packedCount: 8,
      totalChecklistCount: 12,
      currency: 'USD',
      createdAt: new Date('2026-09-01').toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mock-trip-2',
      title: 'Alpine Winter Ski Expedition',
      description: '7 Days • Backcountry tour & ski equipment rentals',
      startDate: '2026-12-15',
      endDate: '2026-12-22',
      coverImageUrl: 'https://images.unsplash.com/photo-1502784444187-359ac186c5bb?auto=format&fit=crop&w=1200&q=80',
      status: 'planned',
      location: 'Zermatt, Switzerland',
      budgetLimit: 4500,
      spentBudget: 3100,
      packedCount: 2,
      totalChecklistCount: 15,
      currency: 'USD',
      createdAt: new Date('2026-09-10').toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mock-trip-3',
      title: 'Amalfi Coastline & Capri Ferry',
      description: '9 Days • Coastal road exploration & Capri grotto pass',
      startDate: '2027-04-10',
      endDate: '2027-04-18',
      coverImageUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
      status: 'planned',
      location: 'Positano, Italy',
      budgetLimit: 3200,
      spentBudget: 850,
      packedCount: 0,
      totalChecklistCount: 10,
      currency: 'USD',
      createdAt: new Date('2026-09-15').toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mock-trip-4',
      title: 'Norwegian Fjords Expedition',
      description: '10 Days • Roadtrip & scenic ferry navigation',
      startDate: '2025-08-04',
      endDate: '2025-08-14',
      coverImageUrl: 'https://images.unsplash.com/photo-1507272931001-fc06c17e4f43?auto=format&fit=crop&w=1200&q=80',
      status: 'completed',
      location: 'Bergen, Norway',
      budgetLimit: 3800,
      spentBudget: 3740,
      packedCount: 24,
      totalChecklistCount: 24,
      currency: 'USD',
      createdAt: new Date('2025-07-01').toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  events: [
    {
      id: 'mock-event-1',
      tripId: 'mock-trip-1',
      dayIndex: 0,
      order: 0,
      title: 'Arrival at Narita & Shinkansen to Kyoto',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  expenses: [
    {
      id: 'mock-exp-1',
      tripId: 'mock-trip-1',
      amount: 1450,
      currency: 'USD',
      category: 'accommodation',
      title: 'Ryokan Reservation',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  checklists: [
    {
      id: 'mock-task-1',
      tripId: 'mock-trip-1',
      title: 'JR Rail Pass voucher exchange',
      category: 'documents',
      isCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

export class LocalStorageTripRepository implements ITripRepository {
  private getData(): StorageData {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      this.saveData(mockData);
      return mockData;
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse local storage data', e);
      this.saveData(mockData);
      return mockData;
    }
  }

  private saveData(data: StorageData): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  private generateId(): string {
    return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
  }

  // --- Trips ---
  async getAllTrips(): Promise<Trip[]> {
    return this.getData().trips;
  }

  async getTripById(id: EntityId): Promise<Trip | null> {
    const trip = this.getData().trips.find((t) => t.id === id);
    return trip || null;
  }

  async createTrip(payload: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Promise<Trip> {
    const data = this.getData();
    const newTrip: Trip = {
      ...payload,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.trips.push(newTrip);
    this.saveData(data);
    return newTrip;
  }

  async updateTrip(id: EntityId, payload: Partial<Trip>): Promise<Trip> {
    const data = this.getData();
    const index = data.trips.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Trip ${id} not found`);

    const updatedTrip = {
      ...data.trips[index],
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    data.trips[index] = updatedTrip;
    this.saveData(data);
    return updatedTrip;
  }

  async duplicateTrip(id: EntityId): Promise<Trip> {
    const trip = await this.getTripById(id);
    if (!trip) throw new Error(`Trip ${id} not found`);
    return await this.createTrip({
      title: `${trip.title} (Copy)`,
      description: trip.description,
      startDate: trip.startDate,
      endDate: trip.endDate,
      coverImageUrl: trip.coverImageUrl,
      status: 'planned',
      budgetLimit: trip.budgetLimit,
      spentBudget: 0,
      packedCount: 0,
      totalChecklistCount: trip.totalChecklistCount || 10,
      currency: trip.currency,
      location: trip.location,
    });
  }

  async deleteTrip(id: EntityId): Promise<void> {
    const data = this.getData();
    data.trips = data.trips.filter((t) => t.id !== id);
    data.events = data.events.filter((e) => e.tripId !== id);
    data.expenses = data.expenses.filter((e) => e.tripId !== id);
    data.checklists = data.checklists.filter((c) => c.tripId !== id);
    this.saveData(data);
  }

  // --- Itinerary ---
  async getEventsByTrip(tripId: EntityId): Promise<PlaceEvent[]> {
    return this.getData().events.filter((e) => e.tripId === tripId);
  }

  async saveEventsBatch(tripId: EntityId, events: PlaceEvent[]): Promise<PlaceEvent[]> {
    const data = this.getData();
    data.events = data.events.filter((e) => e.tripId !== tripId);
    data.events.push(...events);
    this.saveData(data);
    return events;
  }

  // --- Expenses ---
  async getExpenses(tripId: EntityId): Promise<Expense[]> {
    return this.getData().expenses.filter((e) => e.tripId === tripId);
  }

  async saveExpense(expensePayload: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
    const data = this.getData();
    const newExpense: Expense = {
      ...expensePayload,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.expenses.push(newExpense);
    this.saveData(data);
    return newExpense;
  }

  async deleteExpense(id: EntityId): Promise<void> {
    const data = this.getData();
    data.expenses = data.expenses.filter((e) => e.id !== id);
    this.saveData(data);
  }

  // --- Checklists ---
  async getChecklist(tripId: EntityId): Promise<ChecklistItem[]> {
    return this.getData().checklists.filter((c) => c.tripId === tripId);
  }

  async toggleChecklistItem(id: EntityId, isCompleted: boolean): Promise<ChecklistItem> {
    const data = this.getData();
    const index = data.checklists.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`ChecklistItem ${id} not found`);

    data.checklists[index].isCompleted = isCompleted;
    data.checklists[index].updatedAt = new Date().toISOString();
    this.saveData(data);
    return data.checklists[index];
  }
}
