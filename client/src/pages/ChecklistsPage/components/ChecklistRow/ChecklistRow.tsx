import React from 'react';
import { Trash2 } from 'lucide-react';
import { Checkbox } from '@shared/ui';
import type { ChecklistItem } from '@shared/types/models';
import styles from './ChecklistRow.module.css';

export interface ChecklistRowProps {
  item: ChecklistItem;
  onToggle: (id: string, isCompleted: boolean) => void;
  onDelete: (id: string) => void;
}

export const ChecklistRow: React.FC<ChecklistRowProps> = ({
  item,
  onToggle,
  onDelete,
}) => {
  return (
    <div className={styles.row}>
      <div className={styles.leftArea}>
        <Checkbox
          checked={item.isCompleted}
          onCheckedChange={(checked) => onToggle(item.id, checked)}
          id={`check-${item.id}`}
          aria-label={item.title}
        />

        <div className={styles.contentWrapper}>
          <span
            className={`${styles.title} ${item.isCompleted ? styles.completed : ''}`}
            onClick={() => onToggle(item.id, !item.isCompleted)}
          >
            {item.title}
          </span>

          {item.priority === 'high' && (
            <span className={styles.priorityHigh}>High Priority</span>
          )}

          {item.priority === 'optional' && (
            <span className={styles.priorityOptional}>Optional</span>
          )}

          {item.quantity && item.quantity > 1 && (
            <span className={styles.quantityBadge}>x{item.quantity}</span>
          )}
        </div>
      </div>

      <button
        type="button"
        className={styles.deleteBtn}
        onClick={() => onDelete(item.id)}
        aria-label="Delete task"
        title="Delete item"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};
