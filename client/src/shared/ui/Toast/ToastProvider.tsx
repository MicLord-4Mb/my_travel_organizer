import React, { useState, useCallback, useMemo } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X } from 'lucide-react';
import { ToastContext, type ToastMessage } from './ToastContext';
import styles from './Toast.module.css';

/**
 * Global Toast Provider.
 *
 * Wraps Radix UI Toast primitives with an accessible notification queue,
 * auto-dismissal timeout (4000ms), and right-swipe dismissal gestures.
 *
 * @param {object} props - Component props containing children nodes.
 * @returns {React.ReactElement} Provider wrapping the toast viewport and child tree.
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback(({ title, description, variant = 'default' }: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, variant }]);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right" duration={4000}>
        {children}
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            className={`${styles.toastRoot} ${styles[t.variant || 'default']}`}
            onOpenChange={(open) => {
              if (!open) {
                setToasts((prev) => prev.filter((item) => item.id !== t.id));
              }
            }}
          >
            <div className={styles.toastContent}>
              <ToastPrimitive.Title className={styles.toastTitle}>{t.title}</ToastPrimitive.Title>
              {t.description && (
                <ToastPrimitive.Description className={styles.toastDescription}>
                  {t.description}
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close className={styles.toastClose} aria-label="Close">
              <X size={16} />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className={styles.toastViewport} />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
};
