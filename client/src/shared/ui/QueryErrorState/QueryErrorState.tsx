import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@shared/ui/Button';
import styles from './QueryErrorState.module.css';

export interface QueryErrorStateProps {
  /** Heading shown above the message. */
  title?: string;
  /** Explanation of what went wrong and what the user can do. */
  description?: string;
  /** Retry trigger, typically the `refetch` function of the failed query. */
  onRetry?: () => void;
}

/**
 * Shared error placeholder for failed data queries.
 *
 * Prevents network / server failures from being rendered as empty states
 * ("No trips yet") and offers a one-click retry.
 */
export const QueryErrorState: React.FC<QueryErrorStateProps> = ({
  title = 'Something went wrong',
  description = 'We could not load your data. Check your connection or that the server is running, then try again.',
  onRetry,
}) => (
  <div className={styles.container} role="alert">
    <div className={styles.iconWrapper} aria-hidden="true">
      <AlertTriangle size={28} />
    </div>
    <div className={styles.textArea}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
    </div>
    {onRetry && (
      <Button type="button" variant="primary" onClick={onRetry}>
        <RefreshCw size={16} aria-hidden="true" /> Retry
      </Button>
    )}
  </div>
);

