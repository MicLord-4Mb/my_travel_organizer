import { describe, it, expect } from 'vitest';
import type { PlaceEvent } from '@shared/types/models';
import {
  planEventDayChange,
  computeTripSchedule,
  projectRouteMarkers,
} from './itineraryUtils';

const evt = (
  id: string,
  dayIndex: number,
  order: number,
  overrides: Partial<PlaceEvent> = {}
): PlaceEvent => ({
  id,
  tripId: 't1',
  dayIndex,
  order,
  title: id,
  category: 'activities',
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
  ...overrides,
});

describe('planEventDayChange', () => {
  const events = [
    evt('a', 0, 0),
    evt('b', 0, 1),
    evt('c', 0, 2),
    evt('x', 1, 0),
    evt('y', 1, 5),
  ];

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

describe('computeTripSchedule — cascade & overnight carry-over engine', () => {
  it('cascades arrival and departure times from dayStartTime + transit + user stay duration, and recalculates on reorder', () => {
    const cafe = evt('cafe', 0, 0, {
      title: 'Cafe Palma',
      category: 'dining',
      durationMinutes: 30,
      location: { name: 'Cafe', lat: 35.658, lng: 139.7016 },
    });
    const museum = evt('museum', 0, 1, {
      title: 'National Museum',
      category: 'activities',
      durationMinutes: 240, // 4 hours
      location: { name: 'Museum', lat: 35.7188, lng: 139.7765 },
    });
    const dinner = evt('dinner', 0, 2, {
      title: 'Bistro',
      category: 'dining',
      durationMinutes: 60,
      location: { name: 'Bistro', lat: 35.712, lng: 139.771 },
    });

    const [day0] = computeTripSchedule([cafe, museum, dinner], 1, 'transit', {
      '0': { startTime: '07:00', endTime: '22:00' },
    });

    // Stop 1 starts at 07:00 and stays for 30 min -> 07:30
    expect(day0.events[0].computedStartTime).toBe('07:00');
    expect(day0.events[0].computedEndTime).toBe('07:30');
    expect(day0.events[0].durationMinutes).toBe(30);

    // Transit from Cafe to Museum (~9.6 km -> ~58 min transit)
    const transit1 = day0.events[0].nextTransit!;
    expect(transit1.durationMinutes).toBeGreaterThan(30);

    // Stop 2 arrives at 07:30 + transit1, stays for exactly 240 min (4h)
    expect(day0.events[1].arrivalMinutes).toBe(450 + transit1.durationMinutes);
    expect(day0.events[1].durationMinutes).toBe(240);
    expect(day0.events[1].departureMinutes).toBe(
      day0.events[1].arrivalMinutes + 240
    );

    // Now reorder: Museum first (order 0), Cafe second (order 1), Dinner third (order 2)
    const [reorderedDay0] = computeTripSchedule(
      [
        { ...museum, order: 0 },
        { ...cafe, order: 1 },
        { ...dinner, order: 2 },
      ],
      1,
      'transit',
      { '0': { startTime: '07:00', endTime: '22:00' } }
    );

    // Stay durations remain strictly unchanged (240m and 30m), while timestamps shift
    expect(reorderedDay0.events[0].id).toBe('museum');
    expect(reorderedDay0.events[0].durationMinutes).toBe(240);
    expect(reorderedDay0.events[0].computedStartTime).toBe('07:00');
    expect(reorderedDay0.events[0].computedEndTime).toBe('11:00');

    expect(reorderedDay0.events[1].id).toBe('cafe');
    expect(reorderedDay0.events[1].durationMinutes).toBe(30);
    expect(reorderedDay0.events[1].arrivalMinutes).toBeGreaterThan(11 * 60);
  });

  it('spills overnight events into Day N+1 as a carryOver tail, shifts Day N+1 start if needed, and calculates morning transit from overnight coordinates', () => {
    const nightTrain = evt('night-train', 0, 0, {
      title: 'Sunrise Express Sleeper',
      category: 'transport',
      durationMinutes: 690, // 11h 30m starting at 22:00 -> ends at 09:30 next day
      location: { name: 'Osaka Station', lat: 34.7025, lng: 135.4959 },
    });
    const morningCafe = evt('osaka-cafe', 1, 0, {
      title: 'Dotonbori Coffee',
      category: 'dining',
      durationMinutes: 45,
      location: { name: 'Dotonbori', lat: 34.6687, lng: 135.5013 },
    });

    const schedules = computeTripSchedule([nightTrain, morningCafe], 2, 'transit', {
      '0': { startTime: '22:00', endTime: '23:00' },
      '1': { startTime: '08:00', endTime: '22:00' },
    });

    // Day 0 marks nightTrain as overnight spillover and flags target end overrun
    expect(schedules[0].events[0].isOvernightSpillover).toBe(true);
    expect(schedules[0].events[0].computedStartTime).toBe('22:00');
    expect(schedules[0].events[0].computedEndTime).toBe('09:30');
    expect(schedules[0].isOverTargetEnd).toBe(true);

    // Day 1 receives carryOver ending at 09:30, shifting Day 1 start from 08:00 to 09:30
    const day1 = schedules[1];
    expect(day1.carryOver).not.toBeNull();
    expect(day1.carryOver?.endTime).toBe('09:30');
    expect(day1.isStartShiftedByCarryOver).toBe(true);
    expect(day1.effectiveStartTime).toBe('09:30');

    // Transit from Osaka Station (carryOver) to Dotonbori Coffee is added before first stop
    const morningTransit = day1.carryOver!.transitToFirstStop!;
    expect(morningTransit.distanceKm).toBeGreaterThan(3);
    expect(day1.events[0].arrivalMinutes).toBe(
      9 * 60 + 30 + morningTransit.durationMinutes
    );
  });
});

describe('projectRouteMarkers — geographic pin invariance on reorder', () => {
  it('keeps each stop anchored at its geographic coordinates when sequence order changes', () => {
    const stopA = evt('a', 0, 0, {
      location: { name: 'North-West', lat: 35.72, lng: 139.68 },
    });
    const stopB = evt('b', 0, 1, {
      location: { name: 'Center', lat: 35.68, lng: 139.73 },
    });
    const stopC = evt('c', 0, 2, {
      location: { name: 'South-East', lat: 35.64, lng: 139.78 },
    });

    const before = projectRouteMarkers([stopA, stopB, stopC]);
    const after = projectRouteMarkers([stopB, stopC, stopA]);

    const findPos = (list: typeof before, id: string) => {
      const m = list.find((item) => item.event.id === id)!;
      return { top: m.topPercent, left: m.leftPercent };
    };

    // Pin coordinates on the map stay identical for each location; only visit index changes
    expect(findPos(after, 'a')).toEqual(findPos(before, 'a'));
    expect(findPos(after, 'b')).toEqual(findPos(before, 'b'));
    expect(findPos(after, 'c')).toEqual(findPos(before, 'c'));

    // Visit sequence indices reflect the new route order
    expect(after.map((m) => [m.event.id, m.index])).toEqual([
      ['b', 1],
      ['c', 2],
      ['a', 3],
    ]);
  });
});
