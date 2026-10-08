import React, { useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plane,
  Hotel,
  Utensils,
  Ticket,
  ShoppingBag,
  CreditCard,
  Save,
  ChevronDown,
  CheckCircle,
} from 'lucide-react';
import { Dialog, Button, useToast } from '@shared/ui';
import type { Expense, Trip, PlaceEvent } from '@shared/types/models';
import { expenseSchema, type ExpenseFormData } from '../model/expenseSchema';
import { useCurrency } from '@shared/lib/useCurrency';
import { toDateInputValue, parseLocalDate, addDaysLocalDate, inclusiveDayCount, formatLocalDate } from '@shared/lib/date';
import { normalizeCategory, type NormalizedExpenseCategory, PAYMENT_METHOD_OPTIONS } from '@entities/expense';
import styles from './ExpenseModal.module.css';

/**
 * Props accepted by the `<ExpenseModal />` dialog.
 */
export interface ExpenseModalProps {
  /** Controls modal visibility */
  open: boolean;
  /** Callback fired when modal visibility toggles */
  onOpenChange: (open: boolean) => void;
  /** Existing expense object if in editing mode, or null/undefined if creating new */
  expenseToEdit?: Expense | null;
  /** Parent trip providing currency context and spending limits */
  trip: Trip;
  /** Optional itinerary stops list allowing the user to tag the expense to a place */
  events?: PlaceEvent[];
  /** Asynchronous or synchronous submit handler */
  onSubmit: (data: ExpenseFormData) => Promise<void> | void;
}

const CATEGORIES: Array<{
  key: NormalizedExpenseCategory;
  label: string;
  icon: React.ReactNode;
  color: string;
}> = [
    {
      key: 'transport',
      label: 'Transport',
      icon: <Plane size={20} color="#3B82F6" />,
      color: '#3B82F6',
    },
    {
      key: 'lodging',
      label: 'Lodging',
      icon: <Hotel size={20} color="#8B5CF6" />,
      color: '#8B5CF6',
    },
    {
      key: 'dining',
      label: 'Dining',
      icon: <Utensils size={20} color="#F59E0B" />,
      color: '#F59E0B',
    },
    {
      key: 'activities',
      label: 'Activities',
      icon: <Ticket size={20} color="#10B981" />,
      color: '#10B981',
    },
    {
      key: 'shopping',
      label: 'Shopping',
      icon: <ShoppingBag size={20} color="#EC4899" />,
      color: '#EC4899',
    },
    {
      key: 'other',
      label: 'Other',
      icon: <CreditCard size={20} color="#64748B" />,
      color: '#64748B',
    },
  ];

/**
 * Dialog for creating or modifying financial expenses and receipts.
 *
 * Features:
 * - Category picker with color-coded iconography.
 * - Dynamic live FX currency converter preview.
 * - Association of expenses with specific itinerary events or trip days.
 * - Toast feedback upon submission.
 */
export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  open,
  onOpenChange,
  expenseToEdit,
  trip,
  events = [],
  onSubmit,
}) => {
  const isEditing = Boolean(expenseToEdit);
  const { toast } = useToast();
  const { convert, format, currencies, symbols, baseCurrency } = useCurrency();
  const titleId = useId();
  const descId = useId();
  const amountId = useId();
  const notesId = useId();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      title: '',
      amount: 25.0,
      currency: trip.currency || 'USD',
      category: 'dining',
      date: toDateInputValue(new Date()),
      dayIndex: 1,
      paymentMethod: 'Credit Card',
      notes: '',
      placeEventId: '',
    },
  });

  const selectedCategory = watch('category');
  const selectedAmount = watch('amount');
  const selectedCurrency = watch('currency') || trip.currency || 'USD';

  // Calculate day list from trip dates
  const daysList: Array<{ label: string; value: number }> = [
    { label: 'Pre-Trip Booking', value: -1 },
  ];
  if (trip.startDate) {
    const diffDays = inclusiveDayCount(trip.startDate, trip.endDate || trip.startDate);
    const start = parseLocalDate(trip.startDate);
    const todayStr = toDateInputValue(new Date());

    if (start) {
      for (let i = 0; i < diffDays; i++) {
        const d = addDaysLocalDate(start, i);
        const dateStr = formatLocalDate(d, { month: 'short', day: 'numeric' });
        const isToday = toDateInputValue(d) === todayStr;
        daysList.push({
          label: `Day ${i + 1} • ${dateStr}${isToday ? ' (Today)' : ''}`,
          value: i,
        });
      }
    }
  }

  useEffect(() => {
    if (open) {
      if (expenseToEdit) {
        reset({
          title: expenseToEdit.title,
          amount: expenseToEdit.amount,
          currency: expenseToEdit.currency || trip.currency || 'USD',
          category: normalizeCategory(expenseToEdit.category),
          date: expenseToEdit.date ? expenseToEdit.date.split('T')[0] : toDateInputValue(new Date()),
          dayIndex: expenseToEdit.dayIndex !== undefined ? expenseToEdit.dayIndex : 0,
          paymentMethod: expenseToEdit.paymentMethod || 'Credit Card',
          notes: expenseToEdit.notes || '',
          placeEventId: expenseToEdit.placeEventId || '',
        });
      } else {
        reset({
          title: '',
          amount: 25.0,
          currency: trip.currency || 'USD',
          category: 'dining',
          date: toDateInputValue(new Date()),
          dayIndex: 1,
          paymentMethod: 'Credit Card',
          notes: '',
          placeEventId: '',
        });
      }
    }
  }, [open, expenseToEdit, trip, reset]);

  const handleFormSubmit = async (data: ExpenseFormData) => {
    try {
      await onSubmit(data);
      onOpenChange(false);
      toast({
        title: 'Success',
        description: isEditing ? 'Expense updated' : 'Expense logged',
        variant: 'success'
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save expense',
        variant: 'destructive'
      });
    }
  };

  // Live conversion hint relative to trip's base currency
  const targetConversionCurrency = trip.currency || baseCurrency || 'USD';
  const isDifferentCurrency = selectedCurrency !== targetConversionCurrency;
  const approxConverted = isDifferentCurrency
    ? convert(Number(selectedAmount) || 0, selectedCurrency, targetConversionCurrency)
    : null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit Expense' : 'Log New Expense'}
      description={
        isEditing
          ? 'Update transaction amount, category, or associated day'
          : `Add a receipt or transaction to your ${trip.title} itinerary`
      }
      maxWidth={540}
      footer={
        <div className={styles.footerActions}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="expense-form"
            variant="primary"
            leftIcon={<Save size={16} />}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Saving...'
              : isEditing
                ? 'Update Expense'
                : 'Save Expense'}
          </Button>
        </div>
      }
    >
      <form
        id="expense-form"
        className={styles.form}
        onSubmit={handleSubmit(handleFormSubmit)}
      >
        {/* Description / Merchant */}
        <div className={styles.fieldGroup}>
          <div className={styles.labelRow}>
            <label htmlFor={titleId} className={styles.label}>
              Description / Merchant <span className={styles.required}>*</span>
            </label>
            {!errors.title && (
              <span style={{ fontSize: 11, color: '#10B981', display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircle size={12} /> Validated
              </span>
            )}
          </div>
          <div className={styles.inputWrapper}>
            <input
              id={titleId}
              type="text"
              placeholder="e.g., Dinner at Roppongi Robata or Shibuya Sky"
              className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
              {...register('title')}
            />
          </div>
          {errors.title && <span className={styles.errorText}>{errors.title.message}</span>}
        </div>

        {/* Amount & Currency */}
        <div className={styles.fieldGroup}>
          <label htmlFor={amountId} className={styles.label}>
            Amount &amp; Currency <span className={styles.required}>*</span>
          </label>
          <div className={styles.amountGrid}>
            <div className={styles.inputWrapper}>
              <span className={styles.currencyPrefix}>
                {symbols[selectedCurrency] || selectedCurrency}
              </span>
              <input
                id={amountId}
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className={`${styles.input} ${styles.amountInput} ${errors.amount ? styles.inputError : ''}`}
                {...register('amount')}
              />
            </div>
            <div className={styles.selectWrapper}>
              <select className={styles.select} {...register('currency')}>
                {currencies.map(c => (
                  <option key={c.code} value={c.code}>{c.code} ({c.symbol}) - {c.name}</option>
                ))}
              </select>
              <span className={styles.selectChevron}>
                <ChevronDown size={16} />
              </span>
            </div>
          </div>
          {errors.amount && <span className={styles.errorText}>{errors.amount.message}</span>}
          {isDifferentCurrency && approxConverted !== null && (
            <div className={styles.fxHint}>
              <span>
                Approx. {format(approxConverted, targetConversionCurrency)}
              </span>
              <span>
                FX Rate: 1 {selectedCurrency} = {format(convert(1, selectedCurrency, targetConversionCurrency), targetConversionCurrency)}
              </span>
            </div>
          )}
        </div>

        {/* Category Picker (Interactive Cards) */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            Category <span className={styles.required}>*</span>
          </label>
          <div className={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              return (
                <div
                  key={cat.key}
                  role="button"
                  tabIndex={0}
                  data-cat={cat.key}
                  className={`${styles.categoryCard} ${isSelected ? styles.categoryCardActive : ''}`}
                  onClick={() => setValue('category', cat.key, { shouldValidate: true })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setValue('category', cat.key, { shouldValidate: true });
                    }
                  }}
                >
                  <div className={styles.categoryIcon}>{cat.icon}</div>
                  <span className={styles.categoryName}>{cat.label}</span>
                </div>
              );
            })}
          </div>
          {errors.category && (
            <span className={styles.errorText}>{errors.category.message}</span>
          )}
        </div>

        {/* Associated Day & Payment Method */}
        <div className={styles.twoColGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor={descId}>
              Associated Day
            </label>
            <div className={styles.selectWrapper}>
              <select id={descId} className={styles.select} {...register('dayIndex')}>
                {daysList.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              <span className={styles.selectChevron}>
                <ChevronDown size={16} />
              </span>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Payment Method</label>
            <div className={styles.selectWrapper}>
              <select className={styles.select} {...register('paymentMethod')}>
                {PAYMENT_METHOD_OPTIONS.map((pm) => (
                  <option key={pm.value} value={pm.value}>
                    {pm.label}
                  </option>
                ))}
              </select>
              <span className={styles.selectChevron}>
                <ChevronDown size={16} />
              </span>
            </div>
          </div>
        </div>

        {/* Date & Optional Place */}
        <div className={styles.twoColGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Transaction Date</label>
            <input
              type="date"
              className={styles.input}
              {...register('date')}
            />
            {errors.date && <span className={styles.errorText}>{errors.date.message}</span>}
          </div>

          {events.length > 0 && (
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Linked Itinerary Place</label>
              <div className={styles.selectWrapper}>
                <select className={styles.select} {...register('placeEventId')}>
                  <option value="">No linked place</option>
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.title}
                    </option>
                  ))}
                </select>
                <span className={styles.selectChevron}>
                  <ChevronDown size={16} />
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Notes & Memo */}
        <div className={styles.fieldGroup}>
          <label htmlFor={notesId} className={styles.label}>
            Receipt &amp; Notes
          </label>
          <div className={styles.noteInputRow}>
            <input
              id={notesId}
              type="text"
              placeholder="Optional memo, booking reference or tax-free notes..."
              className={styles.input}
              {...register('notes')}
            />
          </div>
          {errors.notes && <span className={styles.errorText}>{errors.notes.message}</span>}
        </div>
      </form>
    </Dialog>
  );
};
