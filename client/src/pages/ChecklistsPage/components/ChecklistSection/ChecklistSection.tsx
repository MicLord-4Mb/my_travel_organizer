import React from 'react';
import type { ChecklistItem } from '@shared/types/models';
import { ChecklistRow } from '@entities/checklist';
import styles from './ChecklistSection.module.css';

export interface ChecklistSectionProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconVariant?: 'primary' | 'luggage' | 'dining' | 'activities' | 'lodging';
  items: ChecklistItem[];
  onToggle: (id: string, isCompleted: boolean) => void;
  onDelete: (id: string) => void;
}

export const ChecklistSection: React.FC<ChecklistSectionProps> = ({
  title,
  subtitle,
  icon,
  iconVariant = 'primary',
  items,
  onToggle,
  onDelete,
}) => {
  const completedCount = items.filter((i) => i.isCompleted).length;
  const totalCount = items.length;

  const getIconClass = () => {
    switch (iconVariant) {
      case 'luggage':
        return styles.iconLuggage;
      case 'dining':
        return styles.iconDining;
      case 'activities':
        return styles.iconActivities;
      case 'lodging':
        return styles.iconLodging;
      default:
        return '';
    }
  };

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div className={styles.titleArea}>
          <div className={`${styles.iconBox} ${getIconClass()}`}>{icon}</div>
          <div className={styles.titles}>
            <h3 className={styles.title}>{title}</h3>
            {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
          </div>
        </div>

        <span className={styles.doneBadge}>
          {completedCount}/{totalCount} Done
        </span>
      </div>

      <div className={styles.itemsList}>
        {items.length > 0 ? (
          items.map((item) => (
            <ChecklistRow
              key={item.id}
              item={item}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))
        ) : (
          <div className={styles.emptyHint}>No items yet in this category</div>
        )}
      </div>
    </div>
  );
};
