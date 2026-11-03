import { describe, it, expect } from 'vitest';
import type { PlaceEvent } from '@shared/types/models';
import { planEventDayChange } from './itineraryUtils';

const evt = (id: string, dayIndex: number, order: number): PlaceEvent =>
  ({ id, tripId: 't1', dayIndex, order, title: id, category: 'activities' }) as PlaceEvent;

describe('planEventDayChange', () => {
  const events = [evt('a', 0, 0), evt('b', 0, 1), evt('c', 0, 2), evt('x', 1, 0), evt('y', 1, 5)];

  it('appends the moved event after the highest order of the target day', () => {
    expect(planEventDayChange(events, 'b', 1).targetOrder).toBe(6);
  });

  it('uses order 0 for an empty target day', () => {
    expect(planEventDayChange(events, 'a', 3).targetOrder).toBe(0);
  });

  it('compacts the source day to a gapless sequence', () => {
    const { sourceReindexed } = planEventDayChange(events, 'a', 1);
    expect(sourceReindexed.map((e) => [e.id, e.order])).toEqual([
      ['b', 0],
      ['c', 1],
    ]);
  });

  it('does not touch unchanged events and does not reindex when the day is the same', () => {
    expect(planEventDayChange(events, 'c', 1).sourceReindexed).toEqual([]);
    expect(planEventDayChange(events, 'a', 0).sourceReindexed).toEqual([]);
  });
});

