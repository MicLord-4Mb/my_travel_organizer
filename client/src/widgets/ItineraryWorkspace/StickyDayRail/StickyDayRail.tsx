import React, { useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import type { DayInfo } from '@entities/itinerary';
import { useCurrency } from '@shared/lib/useCurrency';
import styles from './StickyDayRail.module.css';

export interface StickyDayRailProps {
  days: DayInfo[];
  activeDayIndex: number;
  onSelectDay: (dayIndex: number) => void;
  onAddDay: () => void;
}

export const StickyDayRail: React.FC<StickyDayRailProps> = ({
  days,
  activeDayIndex,
  onSelectDay,
  onAddDay,
}) => {
  const { format } = useCurrency();
  const containerRef = useRef<HTMLDivElement>(null);
  const activeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeBtnRef.current && containerRef.current) {
      activeBtnRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeDayIndex]);

  return (
    <div className={styles.railContainer} ref={containerRef}>
      {days.map((day) => {
        const isActive = day.dayIndex === activeDayIndex;
        return (
          <button
            key={day.dayIndex}
            ref={isActive ? activeBtnRef : undefined}
            type="button"
            className={`${styles.dayCard} ${isActive ? styles.dayCardActive : ''}`}
            onClick={() => onSelectDay(day.dayIndex)}
          >
            <div className={styles.topRow}>
              <span
                className={`${styles.dayBadge} ${
                  isActive ? styles.dayBadgeActive : ''
                }`}
              >
                {isActive && <span className={styles.pulseDot} />}
                DAY {day.dayIndex + 1} • {day.dateLabel}
              </span>
              <span
                className={`${styles.costTag} ${
                  isActive ? styles.costTagActive : ''
                }`}
              >
                {format(day.estimatedCost, day.currency)}
              </span>
            </div>
            <span
              className={`${styles.dayTitle} ${
                isActive ? styles.dayTitleActive : ''
              }`}
            >
              {day.title}
            </span>
          </button>
        );
      })}

      <button
        type="button"
        className={styles.addDayBtn}
        onClick={onAddDay}
        title="Add a new day to the trip schedule"
      >
        <Plus size={16} />
        <span>Add Day</span>
      </button>
    </div>
  );
};
