import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@shared/lib/test-utils';
import { TimelineItem } from './TimelineItem';
import type { PlaceEvent } from '@shared/types/models';

const mockEvent: PlaceEvent = {
  id: 'evt-tokyo-1',
  tripId: 'trip-1',
  dayIndex: 0,
  order: 0,
  title: 'Meiji Jingu Shrine',
  category: 'activities',
  startTime: '09:00',
  endTime: '11:00',
  cost: 15,
  currency: 'USD',
  location: { name: 'Shibuya, Tokyo' },
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
};

describe('TimelineItem semantic keyboard accessibility & actions', () => {
  it('supports keyboard selection via Enter and Space without invalid nested buttons', () => {
    const onSelect = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    renderWithProviders(
      <TimelineItem
        event={mockEvent}
        isSelected={false}
        onSelect={onSelect}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    const card = screen.getByRole('button', { name: 'Select stop Meiji Jingu Shrine' });
    expect(card).toHaveAttribute('tabIndex', '0');
    expect(card).toHaveAttribute('aria-pressed', 'false');

    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(card, { key: ' ' });
    expect(onSelect).toHaveBeenCalledTimes(2);

    // Clicking nested Edit or Delete buttons does not bubble to onSelect
    fireEvent.click(screen.getByRole('button', { name: 'Edit Meiji Jingu Shrine' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole('button', { name: 'Delete Meiji Jingu Shrine' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledTimes(2);
  });
});

