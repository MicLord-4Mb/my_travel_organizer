import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@shared/lib/test-utils';
import { PlaceEventModal } from './PlaceEventModal';

describe('PlaceEventModal validation, accessibility & overnight support', () => {
  it('wires aria-invalid and aria-describedby on invalid submission and rejects equal start/end times', async () => {
    const onSubmit = vi.fn();

    renderWithProviders(
      <PlaceEventModal
        open
        onOpenChange={vi.fn()}
        startDate="2026-10-15"
        totalDays={5}
        tripCurrency="USD"
        onSubmit={onSubmit}
      />
    );

    const titleInput = screen.getByLabelText(/Activity \/ Place Name/i);
    fireEvent.change(titleInput, { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/Start Time/i), { target: { value: '14:00' } });
    fireEvent.change(screen.getByLabelText(/End Time/i), { target: { value: '14:00' } });

    fireEvent.click(screen.getByRole('button', { name: /Add to Schedule/i }));

    await waitFor(() => {
      expect(titleInput).toHaveAttribute('aria-invalid', 'true');
    });

    const endTimeInput = screen.getByLabelText(/End Time/i);
    expect(endTimeInput).toHaveAttribute('aria-invalid', 'true');
    const errorId = endTimeInput.getAttribute('aria-describedby');
    expect(errorId).toBeTruthy();
    expect(document.getElementById(errorId!)?.textContent).toBe(
      'End time must differ from start time'
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('accepts overnight events (23:30 -> 06:15) and submits validated payload', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();

    renderWithProviders(
      <PlaceEventModal
        open
        onOpenChange={onOpenChange}
        startDate="2026-10-15"
        totalDays={5}
        tripCurrency="USD"
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(screen.getByLabelText(/Activity \/ Place Name/i), {
      target: { value: 'Sunrise Express Sleeper Train' },
    });
    fireEvent.change(screen.getByLabelText(/Start Time/i), { target: { value: '23:30' } });
    fireEvent.change(screen.getByLabelText(/End Time/i), { target: { value: '06:15' } });

    fireEvent.click(screen.getByRole('button', { name: /Add to Schedule/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      title: 'Sunrise Express Sleeper Train',
      startTime: '23:30',
      endTime: '06:15',
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

