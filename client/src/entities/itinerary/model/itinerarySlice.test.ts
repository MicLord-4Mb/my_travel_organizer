import { describe, it, expect } from 'vitest';
import itineraryReducer, {
  setActiveDayIndex,
  setCategoryFilter,
  setSelectedEventId,
  setTransitMode,
} from './itinerarySlice';

describe('itinerarySlice', () => {
  const initial = itineraryReducer(undefined, { type: '@@INIT' });

  it('should have default state', () => {
    expect(initial.activeDayIndex).toBe(1);
    expect(initial.categoryFilter).toBe('all');
    expect(initial.transitMode).toBe('walk');
    expect(initial.selectedEventId).toBeNull();
  });

  it('should change active day index', () => {
    const next = itineraryReducer(initial, setActiveDayIndex(3));
    expect(next.activeDayIndex).toBe(3);
    expect(next.selectedEventId).toBeNull();
  });

  it('should change category filter', () => {
    const next = itineraryReducer(initial, setCategoryFilter('food'));
    expect(next.categoryFilter).toBe('food');
  });

  it('should set selected event and transit mode', () => {
    const next = itineraryReducer(initial, setSelectedEventId('mock-event-1'));
    expect(next.selectedEventId).toBe('mock-event-1');

    const nextMode = itineraryReducer(next, setTransitMode('transit'));
    expect(nextMode.transitMode).toBe('transit');
  });
});

