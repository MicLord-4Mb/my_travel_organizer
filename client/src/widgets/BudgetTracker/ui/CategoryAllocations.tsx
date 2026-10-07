import React from 'react';
import { Plane, Hotel, Utensils, Ticket } from 'lucide-react';
import { useCurrency } from '@shared/lib/useCurrency';
import type { BudgetAnalyticsData } from './FinancialKpiTicker';
import styles from './CategoryAllocations.module.css';

export interface CategoryAllocationsProps {
  analytics: BudgetAnalyticsData;
  displayCurrency: string;
  tripCurrency: string;
}

interface CategoryCardItem {
  id: 'transport' | 'lodging' | 'dining' | 'activities';
  title: string;
  shortLabel: string;
  icon: React.ReactNode;
  color: string;
  bgTint: string;
  spent: number;
  cap: number;
  percentage: number;
  isFastPaced?: boolean;
}

export const CategoryAllocations: React.FC<CategoryAllocationsProps> = ({
  analytics,
  displayCurrency,
  tripCurrency,
}) => {
  const { convert, format } = useCurrency();
  const { categoryTotals, categoryCaps, totalSpent, transactionCount } = analytics;

  const percentOfCap = (spent: number, cap: number) =>
    cap > 0 ? Math.min(100, Math.round((spent / cap) * 1000) / 10) : 0;

  // Prepare 4 categories (cap === 0 means "no cap set for this category")
  const cards: CategoryCardItem[] = [
    {
      id: 'transport',
      title: 'Flights & Transit',
      shortLabel: 'Transit',
      icon: <Plane size={18} color="#3B82F6" />,
      color: '#3B82F6',
      bgTint: 'rgba(59, 130, 246, 0.12)',
      spent: categoryTotals.transport || 0,
      cap: categoryCaps.transport,
      percentage: percentOfCap(categoryTotals.transport || 0, categoryCaps.transport),
    },
    {
      id: 'lodging',
      title: 'Hotels & Lodging',
      shortLabel: 'Lodging',
      icon: <Hotel size={18} color="#8B5CF6" />,
      color: '#8B5CF6',
      bgTint: 'rgba(139, 92, 246, 0.12)',
      spent: categoryTotals.lodging || 0,
      cap: categoryCaps.lodging,
      percentage: percentOfCap(categoryTotals.lodging || 0, categoryCaps.lodging),
    },
    {
      id: 'dining',
      title: 'Food & Dining',
      shortLabel: 'Dining',
      icon: <Utensils size={18} color="#F59E0B" />,
      color: '#F59E0B',
      bgTint: 'rgba(245, 158, 11, 0.12)',
      spent: categoryTotals.dining || 0,
      cap: categoryCaps.dining,
      percentage: percentOfCap(categoryTotals.dining || 0, categoryCaps.dining),
      isFastPaced: categoryCaps.dining > 0 && (categoryTotals.dining || 0) > categoryCaps.dining * 0.5,
    },
    {
      id: 'activities',
      title: 'Tours & Activities',
      shortLabel: 'Activities',
      icon: <Ticket size={18} color="#10B981" />,
      color: '#10B981',
      bgTint: 'rgba(16, 185, 129, 0.12)',
      spent: categoryTotals.activities || 0,
      cap: categoryCaps.activities,
      percentage: percentOfCap(categoryTotals.activities || 0, categoryCaps.activities),
    },
  ];

  // SVG Donut metrics calculation
  // Circumference for r=14 is 2 * PI * 14 = 87.9645
  const circumference = 87.9645;
  const safeTotal = totalSpent > 0 ? totalSpent : 1;

  const ratios = {
    transport: (categoryTotals.transport || 0) / safeTotal,
    lodging: (categoryTotals.lodging || 0) / safeTotal,
    dining: (categoryTotals.dining || 0) / safeTotal,
    activities: (categoryTotals.activities || 0) / safeTotal,
  };

  const lenTransport = ratios.transport * circumference;
  const lenLodging = ratios.lodging * circumference;
  const lenDining = ratios.dining * circumference;
  const lenActivities = ratios.activities * circumference;

  const offsetTransport = 0;
  const offsetLodging = -lenTransport;
  const offsetDining = -(lenTransport + lenLodging);
  const offsetActivities = -(lenTransport + lenLodging + lenDining);

  const convertedTotalSpent = convert(totalSpent, tripCurrency, displayCurrency);

  return (
    <div className={styles.section}>
      {/* 4 Category Allocation Progress Gauges */}
      <div className={styles.allocationsCard}>
        <div className={styles.headerRow}>
          <div className={styles.titleArea}>
            <h2 className={styles.sectionTitle}>Category Allocations</h2>
            <span className={styles.countBadge}>4 Categories</span>
          </div>
          <span className={styles.subtitle}>Spent vs. Target</span>
        </div>

        <div className={styles.categoriesGrid}>
          {cards.map((item) => {
            const convertedSpent = convert(item.spent, tripCurrency, displayCurrency);
            const convertedCap = convert(item.cap, tripCurrency, displayCurrency);
            const hasCap = item.cap > 0;

            return (
              <div
                key={item.id}
                className={`${styles.categoryItem} ${
                  item.isFastPaced ? styles.categoryItemCaution : ''
                }`}
              >
                <div className={styles.catTopRow}>
                  <div className={styles.catInfo}>
                    <div
                      className={styles.catIconBox}
                      style={{ backgroundColor: item.bgTint }}
                    >
                      {item.icon}
                    </div>
                    <span className={styles.catName}>{item.title}</span>
                  </div>

                  <span
                    className={styles.catPill}
                    style={{
                      backgroundColor: item.isFastPaced ? 'rgba(239, 68, 68, 0.1)' : item.bgTint,
                      color: item.isFastPaced ? '#EF4444' : item.color,
                    }}
                  >
                    {hasCap ? `${item.percentage.toFixed(1)}%` : 'No cap'}
                    {item.isFastPaced ? ' (Fast Pace)' : ''}
                  </span>
                </div>

                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressBarFill}
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>

                <div className={styles.catAmountsRow}>
                  <span>
                    Spent:{' '}
                    <strong className={styles.spentBold}>
                      {format(convertedSpent, displayCurrency)}
                    </strong>
                  </span>
                  <span>
                    Cap: {hasCap ? format(convertedCap, displayCurrency) : 'not set'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Donut Breakdown Visual & Legend */}
      <div className={styles.donutCard}>
        <div className={styles.headerRow}>
          <h2 className={styles.sectionTitle}>Expense Split</h2>
          <span className={styles.subtitle} style={{ fontFamily: 'monospace' }}>
            100% Normalized
          </span>
        </div>

        <div className={styles.donutContainer}>
          <div className={styles.donutWrapper}>
            <svg viewBox="0 0 36 36" className={styles.donutSvg}>
              {/* Background ring */}
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="var(--color-surface-container)"
                strokeWidth="3.5"
              />

              {/* Transport Segment */}
              {lenTransport > 0 && (
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="3.5"
                  strokeDasharray={`${lenTransport} ${circumference}`}
                  strokeDashoffset={offsetTransport}
                />
              )}

              {/* Lodging Segment */}
              {lenLodging > 0 && (
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="3.5"
                  strokeDasharray={`${lenLodging} ${circumference}`}
                  strokeDashoffset={offsetLodging}
                />
              )}

              {/* Dining Segment */}
              {lenDining > 0 && (
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="3.5"
                  strokeDasharray={`${lenDining} ${circumference}`}
                  strokeDashoffset={offsetDining}
                />
              )}

              {/* Activities Segment */}
              {lenActivities > 0 && (
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3.5"
                  strokeDasharray={`${lenActivities} ${circumference}`}
                  strokeDashoffset={offsetActivities}
                />
              )}
            </svg>

            <div className={styles.donutCenter}>
              <span className={styles.donutCenterLabel}>Total Spent</span>
              <span className={styles.donutCenterValue}>
                {format(convertedTotalSpent, displayCurrency, { hideDecimals: true })}
              </span>
              <span className={styles.donutCenterCount}>
                {transactionCount} Logged
              </span>
            </div>
          </div>
        </div>

        {/* Mini Visual Legend Grid */}
        <div className={styles.legendGrid}>
          {cards.map((item) => {
            const ratioPct = Math.round((ratios[item.id] || 0) * 100);
            return (
              <div key={item.id} className={styles.legendItem}>
                <span
                  className={styles.legendColorBox}
                  style={{ backgroundColor: item.color }}
                />
                <span className={styles.legendLabel}>
                  {item.shortLabel} {ratioPct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
