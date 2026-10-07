import React from 'react';
import { Compass, Wallet, CheckSquare, PlusCircle } from 'lucide-react';
import { Button } from '@shared/ui';
import { useCurrency } from '@shared/lib/useCurrency';
import styles from './KpiTicker.module.css';

export interface KpiTickerProps {
  destinationsCount: number;
  spentBudget: number;
  totalBudget: number;
  /** ISO currency code `spentBudget` and `totalBudget` are expressed in. */
  currency: string;
  /** `null` when no checklist items exist yet. */
  readinessPercentage: number | null;
  onCreateNewJourney: () => void;
}

export const KpiTicker: React.FC<KpiTickerProps> = ({
  destinationsCount,
  spentBudget,
  totalBudget,
  currency,
  readinessPercentage,
  onCreateNewJourney,
}) => {
  const { format } = useCurrency();
  return (
    <section className={styles.ticker} aria-label="Trip key performance indicators">
      <div className={styles.metricsGroup}>
        {/* Metric 1: Active Itinerary */}
        <div className={styles.metricItem}>
          <div className={`${styles.iconBox} ${styles.iconTeal}`}>
            <Compass size={22} />
          </div>
          <div className={styles.metricText}>
            <span className={styles.metricLabel}>Active Itinerary</span>
            <span className={styles.metricValue}>
              {destinationsCount} {destinationsCount === 1 ? 'Destination' : 'Destinations'}
            </span>
          </div>
        </div>

        <div className={styles.divider} aria-hidden="true" />

        {/* Metric 2: Allocated Budget */}
        <div className={styles.metricItem}>
          <div className={`${styles.iconBox} ${styles.iconAmber}`}>
            <Wallet size={22} />
          </div>
          <div className={styles.metricText}>
            <span className={styles.metricLabel}>Allocated Budget</span>
            <span className={`${styles.metricValue} tabular-nums`}>
              {format(spentBudget, currency, { hideDecimals: true })}{' '}
              <span className={styles.metricTotal}>
                / {format(totalBudget, currency, { hideDecimals: true })}
              </span>
            </span>
          </div>
        </div>

        <div className={styles.divider} aria-hidden="true" />

        {/* Metric 3: Readiness Score */}
        <div className={styles.metricItem}>
          <div className={`${styles.iconBox} ${styles.iconEmerald}`}>
            <CheckSquare size={22} />
          </div>
          <div className={styles.metricText}>
            <span className={styles.metricLabel}>Readiness Score</span>
            <span className={`${styles.metricValue} tabular-nums`}>
              {readinessPercentage === null ? 'No checklist yet' : `${readinessPercentage}% Prepared`}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.rightAction}>
        <Button
          variant="primary"
          size="md"
          leftIcon={<PlusCircle size={20} />}
          onClick={onCreateNewJourney}
          fullWidth
        >
          Create New Journey
        </Button>
      </div>
    </section>
  );
};
