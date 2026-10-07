import React from 'react';
import { Calendar, ArrowLeftRight, PlusCircle } from 'lucide-react';
import type { Trip, EntityId } from '@shared/types/models';
import { useCurrency } from '@shared/lib/useCurrency';
import styles from './BudgetHeader.module.css';

/**
 * Props for `<BudgetHeader />`.
 */
export interface BudgetHeaderProps {
  /** Active trip instance */
  trip: Trip;
  /** Available trips for switching context */
  allTrips?: Trip[];
  /** Callback fired when user selects a different trip */
  onSelectTrip?: (tripId: EntityId) => void;
  /** Active currency used for displaying budget aggregates */
  displayCurrency: string;
  /** Callback fired when user clicks to switch or cycle display currency */
  onToggleCurrency: () => void;
  /** Callback to trigger the expense logging modal */
  onOpenExpenseModal: () => void;
}

/**
 * Top contextual header for the Budget & Expense Tracking workspace.
 *
 * Displays trip breadcrumbs, trip selector dropdown, date range badge,
 * dynamic live FX exchange rate pill, and Primary CTA to log an expense.
 */
export const BudgetHeader: React.FC<BudgetHeaderProps> = ({
  trip,
  allTrips = [],
  onSelectTrip,
  displayCurrency,
  onToggleCurrency,
  onOpenExpenseModal,
}) => {
  const { currencies, rates, baseCurrency } = useCurrency();

  // Dynamic FX rate calculation relative to base currency
  const targetCurrency =
    displayCurrency === baseCurrency && trip.currency && trip.currency !== baseCurrency
      ? trip.currency
      : displayCurrency;
  const targetRate = rates[targetCurrency] ?? 1;
  const fxRateDisplay = `1 ${baseCurrency} = ${targetRate} ${targetCurrency}`;

  // Next currency in list for toggle hint
  const currentIndex = currencies.findIndex((c) => c.code === displayCurrency);
  const nextCurrency = currencies[(currentIndex + 1) % (currencies.length || 1)]?.code || 'USD';
  // Format date range
  const formattedDates = React.useMemo(() => {
    if (!trip.startDate) return '';
    const start = new Date(trip.startDate);
    const end = trip.endDate ? new Date(trip.endDate) : start;
    const diffDays = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );

    const startStr = start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const endStr = end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return `${startStr}–${endStr} (${diffDays} Days)`;
  }, [trip.startDate, trip.endDate]);

  return (
    <div className={styles.header}>
      <div className={styles.topRow}>
        <div>
          <div className={styles.breadcrumbs}>
            <span className={styles.breadcrumbTracker}>Budget Tracker</span>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbTrip}>{trip.title}</span>
          </div>

          <div className={styles.titleRow}>
            {allTrips.length > 1 ? (
              <select
                className={styles.tripSelect}
                value={trip.id}
                onChange={(e) => onSelectTrip?.(e.target.value)}
                aria-label="Select trip"
              >
                {allTrips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            ) : (
              <h1 className={styles.title}>{trip.title} Budget &amp; Expenses</h1>
            )}

            {formattedDates && (
              <span className={styles.datePill}>
                <Calendar size={14} className={styles.dateIcon} />
                {formattedDates}
              </span>
            )}
          </div>
        </div>

        <div className={styles.actionsRow}>
          {/* Live FX Converter Pill */}
          <div className={styles.fxPill}>
            <ArrowLeftRight size={16} className={styles.fxIcon} />
            <span className={styles.fxLabel}>FX Rate:</span>
            <span className={styles.fxRate}>{fxRateDisplay}</span>
            <button
              type="button"
              className={styles.fxToggleBtn}
              onClick={onToggleCurrency}
              title={`Switch display currency to ${nextCurrency}`}
            >
              Switch to {nextCurrency}
            </button>
          </div>

          {/* Primary CTA */}
          <button
            type="button"
            className={styles.logExpenseBtn}
            onClick={onOpenExpenseModal}
            id="open-expense-modal"
          >
            <PlusCircle size={18} />
            <span>Log Expense</span>
          </button>
        </div>
      </div>
    </div>
  );
};
