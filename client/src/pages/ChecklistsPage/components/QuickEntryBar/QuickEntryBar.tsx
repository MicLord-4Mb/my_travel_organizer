import React, { useState } from 'react';
import { ListPlus, Plus } from 'lucide-react';
import { Button } from '@shared/ui';
import type { ChecklistCategory, ChecklistPriority, ChecklistType } from '@shared/types/models';
import styles from './QuickEntryBar.module.css';

export interface QuickEntryBarProps {
  onAddItem: (item: {
    title: string;
    type: ChecklistType;
    category: ChecklistCategory;
    priority: ChecklistPriority;
  }) => Promise<void> | void;
}

export const QuickEntryBar: React.FC<QuickEntryBarProps> = ({ onAddItem }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ChecklistType>('pretrip');
  const [priority, setPriority] = useState<ChecklistPriority>('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      const category: ChecklistCategory = type === 'pretrip' ? 'documents' : 'gear';
      await onAddItem({
        title: trimmed,
        type,
        category,
        priority,
      });
      setTitle('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.barContainer} aria-label="Quick item entry">
      <div className={styles.inner}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputWrapper}>
            <span className={styles.inputIcon}>
              <ListPlus size={18} />
            </span>
            <input
              type="text"
              placeholder="+ Add task or baggage item (Press Enter to log)..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.controls}>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ChecklistType)}
              className={styles.select}
              aria-label="Section"
            >
              <option value="pretrip">Pre-Trip Tasks</option>
              <option value="luggage">Luggage Inventory</option>
            </select>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as ChecklistPriority)}
              className={styles.select}
              aria-label="Priority"
            >
              <option value="normal">Normal</option>
              <option value="high">High Priority</option>
              <option value="optional">Optional</option>
            </select>

            <Button
              type="submit"
              variant="primary"
              size="md"
              leftIcon={<Plus size={16} />}
              disabled={isSubmitting}
            >
              Add Item
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
