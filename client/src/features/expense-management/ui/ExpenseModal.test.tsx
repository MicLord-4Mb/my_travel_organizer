import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@shared/lib/test-utils';
import { ExpenseModal } from './ExpenseModal';
import type { Trip } from '@shared/types/models';

const mockTrip: Trip = {
  id: 'trip-1',
  title: 'Tokyo Adventure',
  startDate: '2026-10-15',
  endDate: '2026-10-20',
  status: 'in_progress',
  budgetLimit: 2500,
  currency: 'USD',
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
};

describe('ExpenseModal validation, accessibility & submission', () => {
  it('links validation errors via aria-invalid and aria-describedby when submitted with empty title', async () => {
    const onSubmit = vi.fn();

    renderWithProviders(
      <ExpenseModal
        open
        onOpenChange={vi.fn()}
        trip={mockTrip}
        onSubmit={onSubmit}
      />
    );

    const titleInput = screen.getByLabelText(/Description \/ Merchant/i);
    fireEvent.change(titleInput, { target: { value: '' } });

    fireEvent.click(screen.getByRole('button', { name: /Save Expense/i }));

    await waitFor(() => {
      expect(titleInput).toHaveAttribute('aria-invalid', 'true');
    });

    const describedById = titleInput.getAttribute('aria-describedby');
    expect(describedById).toBeTruthy();
    const errorEl = document.getElementById(describedById!);
    expect(errorEl).toHaveAttribute('role', 'alert');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits valid expense form data and closes modal', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();

    renderWithProviders(
      <ExpenseModal
        open
        onOpenChange={onOpenChange}
        trip={mockTrip}
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(screen.getByLabelText(/Description \/ Merchant/i), {
      target: { value: 'Ramen Ichiran' },
    });
    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: '18.5' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Save Expense/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      title: 'Ramen Ichiran',
      amount: 18.5,
      currency: 'USD',
      category: 'dining',
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

