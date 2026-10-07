import React from 'react';
import {
  Search,
  X,
  Download,
  Plus,
  Pencil,
  Trash2,
  Plane,
  Hotel,
  Utensils,
  Ticket,
  ShoppingBag,
  CreditCard,
  DollarSign,
  Smartphone,
  Wallet,
  ChevronDown,
} from 'lucide-react';
import { Badge, Button } from '@shared/ui';
import type { Expense, Trip, EntityId } from '@shared/types/models';
import { useCurrency } from '@shared/lib/useCurrency';
import {
  normalizeCategory,
  type NormalizedExpenseCategory,
  type ExpenseSortOption,
} from '@entities/expense';
import styles from './TransactionsLedger.module.css';

export interface TransactionsLedgerProps {
  expenses: Expense[];
  allExpensesCount: number;
  trip: Trip;
  displayCurrency: string;
  tripCurrency: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categoryFilter: 'ALL' | NormalizedExpenseCategory;
  onCategoryFilterChange: (cat: 'ALL' | NormalizedExpenseCategory) => void;
  dayFilter: 'ALL' | string;
  onDayFilterChange: (day: 'ALL' | string) => void;
  sortBy: ExpenseSortOption;
  onSortByChange: (sort: ExpenseSortOption) => void;
  onOpenAddModal: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: EntityId) => void;
}

const CATEGORY_TABS: Array<{ key: 'ALL' | NormalizedExpenseCategory; label: string }> = [
  { key: 'ALL', label: 'All Categories' },
  { key: 'transport', label: 'Transit' },
  { key: 'lodging', label: 'Lodging' },
  { key: 'dining', label: 'Dining' },
  { key: 'activities', label: 'Activities' },
  { key: 'shopping', label: 'Shopping' },
  { key: 'other', label: 'Other' },
];

export const TransactionsLedger: React.FC<TransactionsLedgerProps> = ({
  expenses,
  allExpensesCount,
  trip,
  displayCurrency,
  tripCurrency,
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  dayFilter,
  onDayFilterChange,
  sortBy,
  onSortByChange,
  onOpenAddModal,
  onEditExpense,
  onDeleteExpense,
}) => {
  const { convert, format, sum } = useCurrency();

  // Days options calculation
  const dayOptions: Array<{ label: string; value: string }> = [
    { label: 'All Days', value: 'ALL' },
    { label: 'Pre-Trip Booking', value: 'pre-trip' },
  ];

  if (trip.startDate) {
    const startDate = new Date(trip.startDate);
    const endDate = trip.endDate ? new Date(trip.endDate) : startDate;
    const diffDays = Math.max(
      1,
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );

    for (let i = 0; i < diffDays; i++) {
      dayOptions.push({
        label: `Day ${i + 1}`,
        value: String(i),
      });
    }
  }

  // Calculate filtered sum converting each expense using live exchange rates
  const convertedFilteredSum = sum(expenses, displayCurrency);

  // Export CSV handler
  const handleExportCSV = () => {
    if (expenses.length === 0) return;
    const headers = ['Date', 'Title', 'Category', 'Amount', 'Currency', 'Payment Method', 'Day', 'Notes'];
    const rows = expenses.map((e) => [
      `"${e.date}"`,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.category}"`,
      e.amount,
      `"${e.currency}"`,
      `"${e.paymentMethod || ''}"`,
      e.dayIndex !== undefined ? (e.dayIndex < 0 ? 'Pre-Trip' : `Day ${e.dayIndex + 1}`) : '',
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${trip.title.replace(/\s+/g, '_')}_expenses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Category Icon helper
  const renderCategoryIcon = (category: string) => {
    const norm = normalizeCategory(category);
    switch (norm) {
      case 'transport':
        return <Plane size={16} color="#3B82F6" />;
      case 'lodging':
        return <Hotel size={16} color="#8B5CF6" />;
      case 'dining':
        return <Utensils size={16} color="#F59E0B" />;
      case 'activities':
        return <Ticket size={16} color="#10B981" />;
      case 'shopping':
        return <ShoppingBag size={16} color="#EC4899" />;
      default:
        return <CreditCard size={16} color="#64748B" />;
    }
  };

  // Payment Method Icon helper
  const renderPaymentIcon = (method?: string) => {
    if (!method) return <CreditCard size={15} />;
    const m = method.toLowerCase();
    if (m.includes('apple') || m.includes('pay') || m.includes('contactless')) {
      return <Smartphone size={15} />;
    }
    if (m.includes('cash')) {
      return <DollarSign size={15} />;
    }
    return <CreditCard size={15} />;
  };

  return (
    <div className={styles.ledgerContainer}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.topFilterRow}>
          {/* Search Input */}
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search transactions, merchants, notes..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={styles.searchInput}
              id="transaction-search"
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.clearSearchBtn}
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Controls: Day filter, Sort, Export, CTA */}
          <div className={styles.controlsGroup}>
            {/* Day Filter */}
            <div className={styles.selectWrapper}>
              <select
                className={styles.selectInput}
                value={dayFilter}
                onChange={(e) => onDayFilterChange(e.target.value)}
                aria-label="Filter by itinerary day"
              >
                {dayOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className={styles.selectChevron} />
            </div>

            {/* Sort Selector */}
            <div className={styles.selectWrapper}>
              <select
                className={styles.selectInput}
                value={sortBy}
                onChange={(e) => onSortByChange(e.target.value as ExpenseSortOption)}
                aria-label="Sort transactions"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-desc">Amount: High to Low</option>
                <option value="amount-asc">Amount: Low to High</option>
              </select>
              <ChevronDown size={14} className={styles.selectChevron} />
            </div>

            <div className={styles.toolbarActions}>
              <button
                type="button"
                className={styles.iconBtn}
                title="Export CSV"
                onClick={handleExportCSV}
                disabled={expenses.length === 0}
              >
                <Download size={16} />
              </button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                leftIcon={<Plus size={16} />}
                onClick={onOpenAddModal}
              >
                Log Expense
              </Button>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs / Chips */}
        <div className={styles.categoryTabsRow}>
          {CATEGORY_TABS.map((tab) => {
            const isActive = categoryFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                className={`${styles.tabChip} ${isActive ? styles.tabChipActive : ''}`}
                onClick={() => onCategoryFilterChange(tab.key)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Responsive Ledger Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th className={styles.th}>Date</th>
              <th className={styles.th}>Transaction / Merchant</th>
              <th className={styles.th}>Category</th>
              <th className={styles.th}>Payment Method</th>
              <th className={styles.th}>Associated Day</th>
              <th className={`${styles.th} ${styles.thRight}`}>Amount</th>
              <th className={`${styles.th} ${styles.thRight}`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                      <Wallet size={24} />
                    </div>
                    <div className={styles.emptyTitle}>No transactions found</div>
                    <p className={styles.emptyDesc}>
                      {searchQuery || categoryFilter !== 'ALL' || dayFilter !== 'ALL'
                        ? 'Try clearing or relaxing your search and filter criteria.'
                        : 'No expenses have been recorded yet for this trip.'}
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Plus size={16} />}
                      onClick={onOpenAddModal}
                    >
                      Log First Expense
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              expenses.map((expense) => {
                const normCat = normalizeCategory(expense.category);
                const originalCurrency = expense.currency || tripCurrency;
                const convertedPrimary = convert(
                  Number(expense.amount) || 0,
                  originalCurrency,
                  displayCurrency
                );

                // Secondary currency formatting: display original billed currency if different from displayCurrency, otherwise trip base
                const isDifferentFromDisplay = originalCurrency !== displayCurrency;
                const secondaryCurrency = isDifferentFromDisplay
                  ? originalCurrency
                  : displayCurrency !== tripCurrency
                  ? tripCurrency
                  : 'USD';
                const convertedSecondary = isDifferentFromDisplay
                  ? Number(expense.amount) || 0
                  : convert(Number(expense.amount) || 0, originalCurrency, secondaryCurrency);

                const dateFormatted = new Date(expense.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <tr key={expense.id} className={styles.tr}>
                    {/* Date */}
                    <td className={`${styles.td} ${styles.tdDate}`}>{dateFormatted}</td>

                    {/* Merchant / Description */}
                    <td className={styles.td}>
                      <div className={styles.merchantCell}>
                        <div
                          className={styles.categoryIconBox}
                          style={{
                            backgroundColor:
                              normCat === 'transport'
                                ? 'rgba(59, 130, 246, 0.1)'
                                : normCat === 'lodging'
                                ? 'rgba(139, 92, 246, 0.1)'
                                : normCat === 'dining'
                                ? 'rgba(245, 158, 11, 0.1)'
                                : normCat === 'activities'
                                ? 'rgba(16, 185, 129, 0.1)'
                                : 'rgba(100, 116, 139, 0.1)',
                          }}
                        >
                          {renderCategoryIcon(normCat)}
                        </div>
                        <div className={styles.merchantInfo}>
                          <span className={styles.merchantTitle} title={expense.title}>
                            {expense.title}
                          </span>
                          {expense.notes && (
                            <span className={styles.merchantNotes} title={expense.notes}>
                              {expense.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className={styles.td}>
                      <Badge
                        variant={
                          normCat === 'transport'
                            ? 'transport'
                            : normCat === 'lodging'
                            ? 'lodging'
                            : normCat === 'dining'
                            ? 'dining'
                            : normCat === 'activities'
                            ? 'activities'
                            : 'neutral'
                        }
                      >
                        {normCat.charAt(0).toUpperCase() + normCat.slice(1)}
                      </Badge>
                    </td>

                    {/* Payment Method */}
                    <td className={styles.td}>
                      <div className={styles.paymentMethodCell}>
                        {renderPaymentIcon(expense.paymentMethod)}
                        <span>{expense.paymentMethod || 'Credit Card'}</span>
                      </div>
                    </td>

                    {/* Associated Day */}
                    <td className={styles.td}>
                      <span className={styles.dayChip}>
                        {expense.dayIndex !== undefined && expense.dayIndex !== null
                          ? expense.dayIndex < 0
                            ? 'Pre-Trip'
                            : `Day ${expense.dayIndex + 1}`
                          : 'Pre-Trip'}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className={`${styles.td} ${styles.thRight}`}>
                      <div className={styles.amountCell}>
                        <span className={styles.amountPrimary}>
                          -{format(convertedPrimary, displayCurrency)}
                        </span>
                        <span className={styles.amountSecondary}>
                          {format(convertedSecondary, secondaryCurrency, {
                            hideDecimals: secondaryCurrency === 'JPY',
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className={`${styles.td} ${styles.thRight}`}>
                      <div className={styles.actionCell}>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          title="Edit Expense"
                          onClick={() => onEditExpense(expense)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                          title="Delete Expense"
                          onClick={() => {
                            if (window.confirm(`Delete expense "${expense.title}"?`)) {
                              onDeleteExpense(expense.id);
                            }
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Summary */}
      <div className={styles.footer}>
        <div className={styles.footerSumText}>
          Filtered sum:{' '}
          <strong className={styles.footerBold}>
            -{format(convertedFilteredSum, displayCurrency)}
          </strong>{' '}
          ({expenses.length} of {allExpensesCount} items shown)
        </div>
      </div>
    </div>
  );
};
