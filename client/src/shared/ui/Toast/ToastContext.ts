import { createContext, useContext } from 'react';

/**
 * Model representing an active toast notification item.
 */
export interface ToastMessage {
  /** Unique ephemeral toast identifier */
  id: string;
  /** Primary headline text */
  title: string;
  /** Optional body or secondary explanation text */
  description?: string;
  /** Visual presentation variant influencing colors and icon accents */
  variant?: 'default' | 'destructive' | 'success';
}

/**
 * Shape of the context dispatched to consuming components.
 */
export interface ToastContextValue {
  /**
   * Spawns a floating toast notification.
   *
   * @param {Omit<ToastMessage, 'id'>} message - Toast content and variant configuration.
   */
  toast: (message: Omit<ToastMessage, 'id'>) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/**
 * Hook to access the toast notification dispatcher.
 * Must be used within a component wrapped by `<ToastProvider>`.
 *
 * @returns {ToastContextValue} Dispatcher functions.
 * @throws {Error} If called outside of a `ToastProvider` tree.
 *
 * @example
 * const { toast } = useToast();
 * toast({ title: 'Trip Saved', variant: 'success' });
 */
export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
