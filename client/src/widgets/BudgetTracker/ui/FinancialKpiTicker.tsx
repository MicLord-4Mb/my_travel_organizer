import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  PiggyBank,
  AlertTriangle,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useCurrency } from '@shared/lib/useCurrency';
import type { BudgetAnalytics } from '@entities/expense';
import styles from './FinancialKpiTicker.module.css';

export type BudgetAnalyticsData = BudgetAnalytics;

/**
 * Props accepted by `<FinancialKpiTicker />`.
 */
export interface FinancialKpiTickerProps {
  /** Precomputed budget analytics and pacing data */
  analytics: BudgetAnalyticsData;
  /** Currency selected for display formatting */
  displayCurrency: string;
  /** Base currency defined on the trip */
  tripCurrency: string;
}

/**
 * Budget KPI metrics bar and financial health ticker.
 *
 * Displays:
 * - Approved Budget vs Total Spent cards with progress meter bars.
 * - Remaining balance and daily burn allowance rate.
 * - Over-budget alert banner with dismissibility.
 * - Real-time currency conversions between trip base and display currencies.
 */
export const FinancialKpiTicker: React.FC<FinancialKpiTickerProps> = ({
  analytics,
  displayCurrency,
  tripCurrency,
}) => {
  const [showWarningBanner, setShowWarningBanner] = useState(true);
  const { convert, format } = useCurrency();

  const {
    approvedLimit,
    totalSpent,
    remaining,
    spentPercent,
    remainingPercent,
    categoryTotals,
    totalDays,
    elapsedDays,
    dailyAvg,
    remainingDailyAllowance,
    isNearLimit,
    isOverBudget,
  } = analytics;

  // Convert amounts dynamically using active API exchange rates
  const convertedLimit = convert(approvedLimit, tripCurrency, displayCurrency);
  const convertedSpent = convert(totalSpent, tripCurrency, displayCurrency);
  const convertedRemaining = convert(remaining, tripCurrency, displayCurrency);
  const convertedDailyAvg = convert(dailyAvg, tripCurrency, displayCurrency);
  const convertedAllowance = convert(remainingDailyAllowance, tripCurrency, displayCurrency);

  // Secondary cap preview dynamically formatted in trip base or display currency
  const secondaryCap =
    approvedLimit <= 0
      ? 'No budget limit set'
      : displayCurrency !== tripCurrency
      ? `${format(approvedLimit, tripCurrency)} in trip currency (${tripCurrency})`
      : `${format(convertedLimit, displayCurrency)} total budget`;

  const dayProgressLabel =
    totalDays === 0
      ? 'Trip dates not set'
      : elapsedDays === 0
      ? `Starts later · ${totalDays} days`
      : `Day ${elapsedDays} of ${totalDays}`;

  // Multi-segment percentage calculations
  const total = totalSpent > 0 ? totalSpent : 1;
  const pTransport = Math.round(((categoryTotals.transport || 0) / total) * 100);
  const pLodging = Math.round(((categoryTotals.lodging || 0) / total) * 100);
  const pDining = Math.round(((categoryTotals.dining || 0) / total) * 100);
  const pActivities = Math.round(((categoryTotals.activities || 0) / total) * 100);
  const pOther = Math.max(0, 100 - (pTransport + pLodging + pDining + pActivities));

  // Determine dining velocity warning (>50% of the dining cap spent early in the trip).
  // Only meaningful when a dining cap exists and the trip is under way.
  const diningCap = analytics.categoryCaps.dining;
  const diningSpent = categoryTotals.dining || 0;
  const isDiningFastPaced =
    diningCap > 0 &&
    totalDays > 0 &&
    elapsedDays > 0 &&
    diningSpent > diningCap * 0.5 &&
    elapsedDays <= Math.ceil(totalDays / 2);

  return (
    <div className={styles.container}>
      {/* Contextual Velocity Warning Banner */}
      {showWarningBanner && (isDiningFastPaced || isNearLimit || isOverBudget) && (
        <div
          className={styles.alertBanner}
          style={
            isOverBudget
              ? { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.4)' }
              : undefined
          }
        >
          <div className={styles.alertContent}>
            <div className={styles.alertIconBox}>
              <AlertTriangle size={18} />
            </div>
            <div className={styles.alertText}>
              <div className={styles.alertHeader}>
                <span className={styles.alertTitle}>
                  {isOverBudget
                    ? 'Total Budget Exceeded Warning'
                    : isNearLimit
                    ? 'Budget Limit Warning (>90% consumed)'
                    : 'Dining Velocity Warning'}
                </span>
                <span className={styles.alertBadge}>
                  {isOverBudget ? 'Critical' : 'Alert'}
                </span>
              </div>
              <p className={styles.alertDesc}>
                {isOverBudget ? (
                  <>
                    Total expenses have exceeded your limit by{' '}
                    <strong>{format(Math.abs(convertedRemaining), displayCurrency)}</strong>.
                    Consider adjusting category allocations.
                  </>
                ) : isNearLimit ? (
                  <>
                    You have consumed <strong>{spentPercent.toFixed(1)}%</strong> of your total approved limit.
                    Remaining allowance is {format(convertedAllowance, displayCurrency)}/day.
                  </>
                ) : (
                  <>
                    Dining is currently pacing <strong>fast</strong> ({format(diningSpent, tripCurrency)} of {format(diningCap, tripCurrency)} spent on Day {elapsedDays} of {totalDays}).
                    Recommended ceiling: {format(diningCap / (totalDays || 1), tripCurrency)}/day.
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.alertCloseBtn}
            onClick={() => setShowWarningBanner(false)}
            aria-label="Dismiss banner"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* 3 KPI Cards Grid */}
      <div className={styles.cardsGrid}>
        {/* KPI 1: Total Approved Limit */}
        <div className={styles.kpiCard}>
          <div className={styles.cardDecoration} />
          <div className={styles.cardHeader}>
            <div>
              <span className={styles.cardLabel}>Total Allocated Budget</span>
              <div className={styles.valueRow}>
                <span className={styles.largeValue}>
                  {format(convertedLimit, displayCurrency)}
                </span>
                <span className={styles.currencyLabel}>{displayCurrency}</span>
              </div>
            </div>
            <div className={`${styles.iconContainer} ${styles.iconBudget}`}>
              <Wallet size={20} />
            </div>
          </div>

          <div className={styles.fixedCeilingRow}>
            <span className={styles.ceilingIndicator}>
              <span className={styles.dotPrimary} /> Fixed ceiling
            </span>
            <span className={styles.secondaryCapText}>{secondaryCap}</span>
          </div>
        </div>

        {/* KPI 2: Total Spent / Actual */}
        <div className={styles.kpiCard}>
          <div className={styles.cardDecoration} />
          <div className={styles.cardHeader}>
            <div>
              <span className={styles.cardLabel}>Spent to Date</span>
              <div className={styles.valueRow}>
                <span className={styles.largeValue}>
                  {format(convertedSpent, displayCurrency)}
                </span>
                <span
                  className={
                    isOverBudget
                      ? styles.badgeDanger
                      : isNearLimit
                      ? styles.badgeWarning
                      : styles.badgeSuccess
                  }
                >
                  {spentPercent.toFixed(1)}%
                </span>
              </div>
            </div>
            <div
              className={`${styles.iconContainer} ${
                isOverBudget ? styles.iconSpentDanger : styles.iconSpent
              }`}
            >
              <TrendingUp size={20} />
            </div>
          </div>

          {/* Multi-segment linear progress bar */}
          <div className={styles.meterSection}>
            <div className={styles.multiProgressBar}>
              <div
                className={styles.segmentTransport}
                style={{ width: `${pTransport}%` }}
                title={`Transport: ${pTransport}%`}
              />
              <div
                className={styles.segmentLodging}
                style={{ width: `${pLodging}%` }}
                title={`Lodging: ${pLodging}%`}
              />
              <div
                className={styles.segmentDining}
                style={{ width: `${pDining}%` }}
                title={`Dining: ${pDining}%`}
              />
              <div
                className={styles.segmentActivities}
                style={{ width: `${pActivities}%` }}
                title={`Activities: ${pActivities}%`}
              />
              {pOther > 0 && (
                <div
                  className={styles.segmentOther}
                  style={{ width: `${pOther}%` }}
                  title={`Other: ${pOther}%`}
                />
              )}
            </div>

            <div className={styles.meterStatsRow}>
              <span>
                Daily avg:{' '}
                <strong className={styles.meterBold}>
                  {format(convertedDailyAvg, displayCurrency)}
                </strong>
              </span>
              <span>{dayProgressLabel}</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Remaining Balance */}
        <div
          className={`${styles.kpiCard} ${isOverBudget ? styles.dangerBorder : ''}`}
        >
          <div className={styles.cardDecoration} />
          <div className={styles.cardHeader}>
            <div>
              <span className={styles.cardLabel}>Remaining Balance</span>
              <div className={styles.valueRow}>
                <span
                  className={styles.largeValue}
                  style={isOverBudget ? { color: '#EF4444' } : undefined}
                >
                  {format(convertedRemaining, displayCurrency)}
                </span>
                <span
                  className={
                    isOverBudget
                      ? styles.badgeDanger
                      : isNearLimit
                      ? styles.badgeWarning
                      : styles.badgeTeal
                  }
                >
                  {isOverBudget
                    ? 'Over budget'
                    : `+${remainingPercent.toFixed(1)}% left`}
                </span>
              </div>
            </div>
            <div className={`${styles.iconContainer} ${styles.iconRemaining}`}>
              <PiggyBank size={20} />
            </div>
          </div>

          <div className={styles.allowanceBox}>
            <div className={styles.allowanceLeft}>
              {isOverBudget ? (
                <AlertCircle size={16} color="#EF4444" />
              ) : (
                <CheckCircle2 size={16} color="#10B981" />
              )}
              <span>Remaining daily allowance:</span>
            </div>
            <span className={styles.allowanceVal}>
              {format(convertedAllowance, displayCurrency)}/day
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
