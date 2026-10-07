import React from 'react';
import { Footprints, Train } from 'lucide-react';
import type { PlaceEvent } from '@shared/types/models';
import { getCoordinatesDistanceKm } from '../lib/itineraryUtils';
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
  const dist = getCoordinatesDistanceKm(
    fromEvent.location?.lat,
    fromEvent.location?.lng,
    toEvent.location?.lat,
    toEvent.location?.lng
  );

  const isTransit = mode === 'transit' || toEvent.category === 'transport';

  // Distance is null when either stop has no coordinates: then show a plain, number-free label.
  let label: string;
  if (dist === null) {
    label = isTransit ? 'Transit to next stop' : 'Walk to next stop';
  } else if (isTransit) {
    label = `~${Math.max(6, Math.round(dist * 6))} min transit (${dist} km)`;
  } else {
    const strollMinutes = Math.max(5, Math.round(dist * 14));
    label = `~${strollMinutes} min stroll (${dist} km)`;
  }

  return (
    <div className={styles.transitRow}>
      <div className={styles.spacer} />
      <div className={styles.transitPill}>
        <span className={styles.transitIcon}>
          {isTransit ? <Train size={13} /> : <Footprints size={13} />}
        </span>
        <span className={styles.transitText}>{label}</span>
      </div>
    </div>
  );
};
