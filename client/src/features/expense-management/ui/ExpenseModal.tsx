import React, { useEffect, useId, useState, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import {
  Plane,
  Hotel,
  Utensils,
  Ticket,
  ShoppingBag,
  CreditCard,
  Save,
  CheckCircle,
} from 'lucide-react';
import { Dialog, Button, Input, Select, useToast } from '@shared/ui';
import type { Expense, Trip, PlaceEvent } from '@shared/types/models';
import { expenseSchema, type ExpenseFormData } from '@features/expense-management/model/expenseSchema';
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
}> = [
  {
    key: 'transport',
    label: 'Transport',
    icon: <Plane size={20} color="var(--color-category-transport)" />,
  },
  {
    key: 'lodging',
    label: 'Lodging',
    icon: <Hotel size={20} color="var(--color-category-lodging)" />,
  },
  {
    key: 'dining',
    label: 'Dining',
    icon: <Utensils size={20} color="var(--color-category-dining)" />,
  },
  {
    key: 'activities',
    label: 'Activities',
    icon: <Ticket size={20} color="var(--color-category-activities)" />,
  },
  {
    key: 'shopping',
    label: 'Shopping',
    icon: <ShoppingBag size={20} color="var(--color-category-shopping)" />,
  },
  {
    key: 'other',
    label: 'Other',
    icon: <CreditCard size={20} color="var(--color-category-other)" />,
  },
];

/**
 * Dialog for creating or modifying financial expenses and receipts.
 *
 * Features:
 * - Category picker with color-coded iconography.
 * - Dynamic live FX currency converter preview.
 * - Association of expenses with specific itinerary events or trip days.
 * - Shared `<Input />` and `<Select />` primitives with automatic `aria-describedby` / `aria-invalid`.
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
  const categoryGroupId = useId();
  const categoryErrorId = `${categoryGroupId}-error`;

  const [initialDate] = useState(() => toDateInputValue(new Date()));

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof expenseSchema>, unknown, z.output<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: '',
      amount: 25.0,
      currency: trip.currency || 'USD',
      category: 'dining',
      date: initialDate,
      dayIndex: 0,
      paymentMethod: 'Credit Card',
      notes: '',
      placeEventId: '',
    },
  });

  const selectedCategory = useWatch({ control, name: 'category' });
  const selectedAmount = useWatch({ control, name: 'amount' });
  const selectedCurrencyWatch = useWatch({ control, name: 'currency' });
  const selectedCurrency = selectedCurrencyWatch || trip.currency || 'USD';

  // Calculate day list from trip dates
  const daysList = useMemo(() => {
    const list: Array<{ label: string; value: number }> = [
      { label: 'Pre-Trip Booking', value: -1 },
    ];
    if (trip.startDate) {
      const diffDays = inclusiveDayCount(trip.startDate, trip.endDate || trip.startDate);
      const start = parseLocalDate(trip.startDate);

      if (start) {
        for (let i = 0; i < diffDays; i++) {
          const d = addDaysLocalDate(start, i);
          const dateStr = formatLocalDate(d, { month: 'short', day: 'numeric' });
          const isToday = toDateInputValue(d) === initialDate;
          list.push({
            label: `Day ${i + 1} • ${dateStr}${isToday ? ' (Today)' : ''}`,
            value: i,
          });
        }
      }
    }
    return list;
  }, [trip.startDate, trip.endDate, initialDate]);

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
          dayIndex: 0,
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
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save expense',
        variant: 'destructive',
      });
    }
  };

  // Live conversion hint relative to trip's base currency
  const targetConversionCurrency = trip.currency || baseCurrency || 'USD';
  const isDifferentCurrency = selectedCurrency !== targetConversionCurrency;
  const approxConverted = isDifferentCurrency
    ? convert(Number(selectedAmount) || 0, selectedCurrency, targetConversionCurrency)
    : null;

  const currencyOptions = useMemo(() => {
    if (currencies.length > 0) {
      return currencies.map((c) => ({
        value: c.code,
        label: `${c.code} (${c.symbol}) - ${c.name}`,
      }));
    }
    return [{ value: selectedCurrency, label: selectedCurrency }];
  }, [currencies, selectedCurrency]);

  const placeOptions = useMemo(
    () => [
      { value: '', label: 'No linked place' },
      ...events.map((evt) => ({ value: evt.id, label: evt.title })),
    ],
    [events]
  );

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
        noValidate
        className={styles.form}
        onSubmit={handleSubmit(handleFormSubmit)}
      >
        {/* Description / Merchant */}
        <Input
          label="Description / Merchant"
          required
          placeholder="e.g., Dinner at Roppongi Robata or Shibuya Sky"
          error={errors.title?.message}
          labelRight={
            !errors.title ? (
              <span className={styles.validatedBadge}>
                <CheckCircle size={12} /> Validated
              </span>
            ) : undefined
          }
          {...register('title')}
        />

        {/* Amount & Currency */}
        <div className={styles.fieldGroup}>
          <div className={styles.amountGrid}>
            <Input
              label="Amount"
              required
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              leftIcon={
                <span className={styles.currencyPrefix}>
                  {symbols[selectedCurrency] || selectedCurrency}
                </span>
              }
              className={styles.amountInput}
              error={errors.amount?.message}
              {...register('amount')}
            />
            <Select
              label="Currency"
              options={currencyOptions}
              error={errors.currency?.message}
              {...register('currency')}
            />
          </div>
          {isDifferentCurrency && approxConverted !== null && (
            <div className={styles.fxHint}>
              <span>
                Approx. {format(approxConverted, targetConversionCurrency)}
              </span>
              <span>
                FX Rate: 1 {selectedCurrency} ={' '}
                {format(
                  convert(1, selectedCurrency, targetConversionCurrency),
                  targetConversionCurrency
                )}
              </span>
            </div>
          )}
        </div>

        {/* Category Picker (Interactive Cards) */}
        <div className={styles.fieldGroup}>
          <span id={categoryGroupId} className={styles.label}>
            Category <span className={styles.required}>*</span>
          </span>
          <div
            className={styles.categoryGrid}
            role="radiogroup"
            aria-labelledby={categoryGroupId}
            aria-describedby={errors.category ? categoryErrorId : undefined}
          >
            {CATEGORIES.map((cat, idx) => {
              const isSelected = selectedCategory === cat.key;
              return (
                <div
                  key={cat.key}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  data-cat={cat.key}
                  className={`${styles.categoryCard} ${isSelected ? styles.categoryCardActive : ''}`}
                  onClick={() => setValue('category', cat.key, { shouldValidate: true })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setValue('category', cat.key, { shouldValidate: true });
                    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                      e.preventDefault();
                      const next = CATEGORIES[(idx + 1) % CATEGORIES.length];
                      setValue('category', next.key, { shouldValidate: true });
                    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                      e.preventDefault();
                      const prev = CATEGORIES[(idx - 1 + CATEGORIES.length) % CATEGORIES.length];
                      setValue('category', prev.key, { shouldValidate: true });
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
            <span id={categoryErrorId} className={styles.errorText} role="alert">
              {errors.category.message}
            </span>
          )}
        </div>

        {/* Associated Day & Payment Method */}
        <div className={styles.twoColGrid}>
          <Select
            label="Associated Day"
            options={daysList}
            error={errors.dayIndex?.message}
            {...register('dayIndex')}
          />

          <Select
            label="Payment Method"
            options={PAYMENT_METHOD_OPTIONS}
            error={errors.paymentMethod?.message}
            {...register('paymentMethod')}
          />
        </div>

        {/* Date & Optional Place */}
        <div className={styles.twoColGrid}>
          <Input
            label="Transaction Date"
            type="date"
            error={errors.date?.message}
            {...register('date')}
          />

          {events.length > 0 && (
            <Select
              label="Linked Itinerary Place"
              options={placeOptions}
              error={errors.placeEventId?.message}
              {...register('placeEventId')}
            />
          )}
        </div>

        {/* Notes & Memo */}
        <Input
          label="Receipt & Notes"
          type="text"
          placeholder="Optional memo, booking reference or tax-free notes..."
          error={errors.notes?.message}
          {...register('notes')}
        />
      </form>
    </Dialog>
  );
};
