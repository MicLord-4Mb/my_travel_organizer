import React from 'react';
import { PlusCircle, Train, Hotel, Ticket, Utensils } from 'lucide-react';
import type { EventCategory } from '@shared/types/models';
import styles from './QuickAddBar.module.css';

export interface QuickAddBarProps {
  dayNumber: number;
  onAddGeneral: () => void;
  onAddCategory: (category: EventCategory) => void;
}

export const QuickAddBar: React.FC<QuickAddBarProps> = ({
  dayNumber,
  onAddGeneral,
  onAddCategory,
}) => {
  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.mainAddBtn}
        onClick={onAddGeneral}
      >
        <PlusCircle size={20} />
        <span>Add activity to Day {dayNumber}</span>
      </button>

      <div className={styles.quickRow}>
        <span className={styles.quickLabel}>Quick add:</span>

        <button
          type="button"
          className={`${styles.quickChip} ${styles.chipTransport}`}
          onClick={() => onAddCategory('transport')}
        >
          <Train size={13} />
          <span>+ Transport</span>
        </button>

        <button
          type="button"
          className={`${styles.quickChip} ${styles.chipLodging}`}
          onClick={() => onAddCategory('lodging')}
        >
          <Hotel size={13} />
          <span>+ Lodging</span>
        </button>

        <button
          type="button"
          className={`${styles.quickChip} ${styles.chipActivities}`}
          onClick={() => onAddCategory('activities')}
        >
          <Ticket size={13} />
          <span>+ Activity</span>
        </button>

        <button
          type="button"
          className={`${styles.quickChip} ${styles.chipDining}`}
          onClick={() => onAddCategory('dining')}
        >
          <Utensils size={13} />
          <span>+ Food</span>
        </button>
      </div>
    </div>
  );
};
