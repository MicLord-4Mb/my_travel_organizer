import type { ExpenseCategory } from '@shared/types/models';

/**
 * Normalized canonical categories used in analytics, budgeting charts, and category pills.
 */
export type NormalizedExpenseCategory =
  | 'transport'
  | 'lodging'
  | 'dining'
  | 'activities'
  | 'shopping'
  | 'other';

/**
 * Supported sorting options for the expense transactions ledger.
 */
export type ExpenseSortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

/**
 * Visual styling and typography metadata for an expense category.
 */
export interface CategoryMeta {
  /** Canonical category identifier */
  key: NormalizedExpenseCategory;
  /** Full descriptive label */
  label: string;
  /** Condensed label for compact badges */
  shortLabel: string;
  /** Brand accent hex color */
  color: string;
  /** Semi-transparent tint color for pill backgrounds */
  bgLight: string;
  /** Name of the Lucide icon representing this category */
  iconName: 'Plane' | 'Hotel' | 'Utensils' | 'Ticket' | 'ShoppingBag' | 'CreditCard';
}

/**
 * Comprehensive visual configuration registry for all normalized expense categories.
 */
export const CATEGORY_CONFIG: Record<NormalizedExpenseCategory, CategoryMeta> = {
  transport: {
    key: 'transport',
    label: 'Flights & Transit',
    shortLabel: 'Transit',
    color: '#3B82F6',
    bgLight: 'rgba(59, 130, 246, 0.1)',
    iconName: 'Plane',
  },
  lodging: {
    key: 'lodging',
    label: 'Hotels & Lodging',
    shortLabel: 'Lodging',
    color: '#8B5CF6',
    bgLight: 'rgba(139, 92, 246, 0.1)',
    iconName: 'Hotel',
  },
  dining: {
    key: 'dining',
    label: 'Food & Dining',
    shortLabel: 'Dining',
    color: '#F59E0B',
    bgLight: 'rgba(245, 158, 11, 0.1)',
    iconName: 'Utensils',
  },
  activities: {
    key: 'activities',
    label: 'Tours & Activities',
    shortLabel: 'Activities',
    color: '#10B981',
    bgLight: 'rgba(16, 185, 129, 0.1)',
    iconName: 'Ticket',
  },
  shopping: {
    key: 'shopping',
    label: 'Shopping & Gear',
    shortLabel: 'Shopping',
    color: '#EC4899',
    bgLight: 'rgba(236, 72, 153, 0.1)',
    iconName: 'ShoppingBag',
  },
  other: {
    key: 'other',
    label: 'Other & Miscellaneous',
    shortLabel: 'Other',
    color: '#64748B',
    bgLight: 'rgba(100, 116, 139, 0.1)',
    iconName: 'CreditCard',
  },
};

/**
 * Maps arbitrary or legacy category strings (such as 'food' or 'accommodation')
 * into a canonical `NormalizedExpenseCategory`.
 *
 * @param {ExpenseCategory | string} category - Raw category identifier.
 * @returns {NormalizedExpenseCategory} Canonical category key.
 */
export function normalizeCategory(category: ExpenseCategory | string): NormalizedExpenseCategory {
  if (category === 'accommodation') return 'lodging';
  if (category === 'food') return 'dining';
  if (category === 'transport') return 'transport';
  if (category === 'lodging') return 'lodging';
  if (category === 'dining') return 'dining';
  if (category === 'activities') return 'activities';
  if (category === 'shopping') return 'shopping';
  return 'other';
}
