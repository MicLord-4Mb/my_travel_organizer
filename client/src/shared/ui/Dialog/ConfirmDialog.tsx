import React from 'react';
import * as RadixAlertDialog from '@radix-ui/react-alert-dialog';
import { Button } from '@shared/ui/Button';
import styles from './Dialog.module.css';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'destructive';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
}

/**
 * Accessible confirmation modal built on `@radix-ui/react-alert-dialog`.
 *
 * Renders with `role="alertdialog"`, traps keyboard focus, and requires an
 * explicit user action (Cancel or Confirm) for irreversible operations.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'destructive',
  isLoading = false,
  onConfirm,
}) => {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <RadixAlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixAlertDialog.Portal>
        <RadixAlertDialog.Overlay className={styles.overlay} />
        <RadixAlertDialog.Content
          className={styles.content}
          style={{ maxWidth: 440 }}
        >
          <div className={styles.header}>
            <div className={styles.titleArea}>
              <RadixAlertDialog.Title className={styles.title}>
                {title}
              </RadixAlertDialog.Title>
              <RadixAlertDialog.Description className={styles.description}>
                {description}
              </RadixAlertDialog.Description>
            </div>
          </div>

          <div className={styles.footer}>
            <RadixAlertDialog.Cancel asChild>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {cancelLabel}
              </Button>
            </RadixAlertDialog.Cancel>
            <RadixAlertDialog.Action asChild>
              <Button
                type="button"
                variant={variant}
                onClick={(e) => {
                  e.preventDefault();
                  void handleConfirm();
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : confirmLabel}
              </Button>
            </RadixAlertDialog.Action>
          </div>
        </RadixAlertDialog.Content>
      </RadixAlertDialog.Portal>
    </RadixAlertDialog.Root>
  );
};
