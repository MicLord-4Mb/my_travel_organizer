import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog (Radix AlertDialog)', () => {
  it('renders with role="alertdialog" and invokes onConfirm / onOpenChange', () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="Delete Trip Workspace"
        description="This action cannot be undone."
        confirmLabel="Delete Trip"
        cancelLabel="Keep Trip"
        onConfirm={onConfirm}
      />
    );

    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('Delete Trip Workspace')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Delete Trip' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Keep Trip' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

