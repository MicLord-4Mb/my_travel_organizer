import React from 'react';
import { PlaneTakeoff, Plus, Download } from 'lucide-react';
import { Button } from '@shared/ui';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  onCreateTrip: () => void;
  onImportItinerary?: () => void;
  title?: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onCreateTrip,
  onImportItinerary,
  title = 'Planning a new destination?',
  description = "Organize daily agendas, track accommodation costs, and curate interactive checklists in WanderFlow's minimalist space.",
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>
        <PlaneTakeoff size={32} />
      </div>

      <div className={styles.textArea}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
      </div>

      <div className={styles.buttonsGroup}>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus size={18} />}
          onClick={onCreateTrip}
        >
          Create your first trip
        </Button>

        {onImportItinerary && (
          <Button
            variant="secondary"
            size="md"
            leftIcon={<Download size={18} />}
            onClick={onImportItinerary}
          >
            Import itinerary (.ics / JSON)
          </Button>
        )}
      </div>
    </div>
  );
};
