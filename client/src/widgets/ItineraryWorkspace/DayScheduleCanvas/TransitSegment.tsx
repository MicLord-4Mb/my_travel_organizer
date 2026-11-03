import React from 'react';
import { Footprints, Train } from 'lucide-react';
import type { PlaceEvent } from '@shared/types/models';
import { estimateTransitSegment } from '@entities/itinerary';
import styles from './TransitSegment.module.css';

export interface TransitSegmentProps {
  fromEvent: PlaceEvent;
  toEvent: PlaceEvent;
  mode?: 'walk' | 'transit';
}

export const TransitSegment: React.FC<TransitSegmentProps> = ({
  fromEvent,
  toEvent,
  mode = 'walk',
}) => {
  const estimate = estimateTransitSegment(
    fromEvent.location,
    toEvent.location,
    mode,
    toEvent.category
  );

  return (
    <div className={styles.transitRow}>
      <div className={styles.spacer} />
      <div className={styles.transitPill}>
        <span className={styles.transitIcon}>
          {estimate.isTransit ? <Train size={13} /> : <Footprints size={13} />}
        </span>
        <span className={styles.transitText}>{estimate.label}</span>
      </div>
    </div>
  );
};
