import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  type NormalizedExpenseCategory,
  type ExpenseSortOption,
  computeBudgetAnalytics,
  normalizeCategory
} from '@entities/expense';
import {
  useGetTripsQuery,
  useGetExpensesByTripIdQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} from '@shared/api/apiSlice';
import {
  BudgetHeader,
  FinancialKpiTicker,
  CategoryAllocations,
  TransactionsLedger,
} from '@widgets/BudgetTracker';
import { ExpenseModal, type ExpenseFormData } from '@features/expense-management';
import { useToast } from '@shared/ui';
import { useCurrency } from '@shared/lib/useCurrency';
import type { Expense, EntityId } from '@shared/types/models';
import { Wallet } from 'lucide-react';
import styles from './BudgetPage.module.css';

export const BudgetPage: React.FC = () => {
  const { id: routeTripId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currencies, rates, baseCurrency } = useCurrency();
  const { data: trips = [] } = useGetTripsQuery();
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  // Local state for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | NormalizedExpenseCategory>('ALL');
  const [dayFilter, setDayFilter] = useState<'ALL' | string>('ALL');
  const [sortBy, setSortBy] = useState<ExpenseSortOption>('date-desc');
  // User currency toggle override; when null, dynamically defaults to activeTrip.currency from store
  const [currencyOverride, setCurrencyOverride] = useState<string | null>(null);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  // Determine active trip directly from RTK Query store
  const activeTrip = useMemo(() => {
    if (!trips.length) return null;
    const targetId = routeTripId || selectedTripId;
    if (targetId) {
      const found = trips.find((t) => t.id === targetId);
      return found !== undefined ? found : undefined;
    }
    return trips[0];
  }, [trips, routeTripId, selectedTripId]);

  // Derived display currency directly from RTK Query active trip without useEffect synchronization
  const displayCurrency = currencyOverride ?? activeTrip?.currency ?? baseCurrency ?? 'USD';

  const activeTripId = activeTrip?.id;
  const { data: expenses = [] } = useGetExpensesByTripIdQuery(activeTripId ?? '', {
    skip: !activeTripId,
  });

  const [createExpense] = useCreateExpenseMutation();
  const [updateExpense] = useUpdateExpenseMutation();
  const [deleteExpense] = useDeleteExpenseMutation();

  const filteredExpenses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = expenses.filter((expense) => {
      if (q) {
        const titleMatch = expense.title.toLowerCase().includes(q);
        const notesMatch = expense.notes ? expense.notes.toLowerCase().includes(q) : false;
        const methodMatch = expense.paymentMethod ? expense.paymentMethod.toLowerCase().includes(q) : false;
        if (!titleMatch && !notesMatch && !methodMatch) return false;
      }

      if (categoryFilter !== 'ALL') {
        const norm = normalizeCategory(expense.category);
        if (norm !== categoryFilter) return false;
      }

      if (dayFilter !== 'ALL') {
        if (dayFilter === 'pre-trip') {
          if (expense.dayIndex !== undefined && expense.dayIndex !== null && expense.dayIndex >= 0) return false;
        } else {
          const targetDay = parseInt(dayFilter, 10);
          if (expense.dayIndex !== targetDay) return false;
        }
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });
  }, [expenses, searchQuery, categoryFilter, dayFilter, sortBy]);

  const budgetAnalytics = useMemo(() => {
    if (!activeTrip) return null;
    return computeBudgetAnalytics(expenses, activeTrip, rates, baseCurrency);
  }, [expenses, activeTrip, rates, baseCurrency]);

  // Handle trip change
  const handleSelectTrip = (newTripId: EntityId) => {
    setSelectedTripId(newTripId);
    setCurrencyOverride(null);
    if (routeTripId) {
      navigate(`/trips/${newTripId}/budget`);
    }
  };

  // Toggle display currency across available API currencies
  const handleToggleCurrency = () => {
    if (!currencies.length) return;
    const currentIndex = currencies.findIndex((c) => c.code === displayCurrency);
    const nextCode = currencies[(currentIndex + 1) % currencies.length].code;
    setCurrencyOverride(nextCode);
  };

  // Open Add modal
  const handleOpenAddModal = () => {
    setExpenseToEdit(null);
    setIsModalOpen(true);
  };

  // Open Edit modal
  const handleEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsModalOpen(true);
  };

  // Delete expense
  const handleDeleteExpense = async (expenseId: EntityId) => {
    try {
      await deleteExpense(String(expenseId)).unwrap();
      toast({
        title: 'Deleted',
        description: 'Expense successfully deleted',
        variant: 'success'
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete expense',
        variant: 'destructive'
      });
    }
  };

  // Handle form submit (both add and edit)
  const handleFormSubmit = async (data: ExpenseFormData) => {
    if (!activeTrip) return;

    if (expenseToEdit) {
      await updateExpense({
        id: expenseToEdit.id,
        payload: {
          title: data.title,
          amount: data.amount,
          currency: data.currency,
          category: data.category,
          date: data.date,
          placeEventId: data.placeEventId,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          dayIndex: data.dayIndex,
        },
      }).unwrap();
    } else {
      await createExpense({
        tripId: activeTrip.id,
        title: data.title,
        amount: data.amount,
        currency: data.currency,
        category: data.category,
        date: data.date,
        placeEventId: data.placeEventId,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        dayIndex: data.dayIndex,
      }).unwrap();
    }
  };

  if (activeTrip === undefined) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Wallet size={28} />
          </div>
          <h2 className={styles.emptyTitle}>404 - Trip Not Found</h2>
          <p>The trip you are looking for does not exist.</p>
          <button onClick={() => navigate('/')} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#0D9488', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Back to Trips
          </button>
        </div>
      </div>
    );
  }

  if (activeTrip === null || !budgetAnalytics) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Wallet size={28} />
          </div>
          <h2 className={styles.emptyTitle}>No Trip Selected</h2>
          <p>Please select a trip or plan a new one to track your budget.</p>
          <button onClick={() => navigate('/')} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#0D9488', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Go to Overview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* 1. Header with metadata, FX pill, CTA */}
      <BudgetHeader
        trip={activeTrip}
        allTrips={trips}
        onSelectTrip={handleSelectTrip}
        displayCurrency={displayCurrency}
        onToggleCurrency={handleToggleCurrency}
        onOpenExpenseModal={handleOpenAddModal}
      />

      {/* 2. Financial KPI Ticker (3 Cards + Warning banner) */}
      <FinancialKpiTicker
        analytics={budgetAnalytics}
        displayCurrency={displayCurrency}
        tripCurrency={activeTrip.currency || 'USD'}
      />

      {/* 3. Category Allocations (4 Cards + SVG Donut Split) */}
      <CategoryAllocations
        analytics={budgetAnalytics}
        displayCurrency={displayCurrency}
        tripCurrency={activeTrip.currency || 'USD'}
      />

      {/* 4. Transactions Ledger */}
      <TransactionsLedger
        expenses={filteredExpenses}
        allExpensesCount={budgetAnalytics.transactionCount}
        trip={activeTrip}
        displayCurrency={displayCurrency}
        tripCurrency={activeTrip.currency || 'USD'}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        dayFilter={dayFilter}
        onDayFilterChange={setDayFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        onOpenAddModal={handleOpenAddModal}
        onEditExpense={handleEditExpense}
        onDeleteExpense={handleDeleteExpense}
      />

      {/* 5. Add / Edit Expense Modal Dialog */}
      <ExpenseModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        expenseToEdit={expenseToEdit}
        trip={activeTrip}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
};

export default BudgetPage;
