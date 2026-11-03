import React, { useEffect, useId, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import {
  Train,
  Hotel,
  Utensils,
  Ticket,
  MapPin,
  Clock,
  DollarSign,
  FileText,
  Bookmark,
  Calendar,
} from 'lucide-react';
import { Dialog, Button, Input, Select, useToast } from '@shared/ui';
import type { PlaceEvent, EventCategory } from '@shared/types/models';
import {
  getEventDurationMinutes,
  formatDurationLabel,
} from '@entities/itinerary';
import {
  placeEventSchema,
  type PlaceEventFormData,
} from '@features/itinerary-management/model/placeEventSchema';
import { parseLocalDate, addDaysLocalDate, formatLocalDate } from '@shared/lib/date';
import { useCurrency } from '@shared/lib/useCurrency';
import styles from './PlaceEventModal.module.css';

/**
 * Props accepted by the `<PlaceEventModal />` dialog.
 */
export interface PlaceEventModalProps {
  /** Controls modal visibility */
  open: boolean;
  /** Visibility toggle callback */
  onOpenChange: (open: boolean) => void;
  /** Existing event instance when editing, or null/undefined when creating */
  eventToEdit?: PlaceEvent | null;
  /** Default zero-based day index to assign to the new stop */
  defaultDayIndex?: number;
  /** Default event category preset */
  defaultCategory?: EventCategory;
  /** Total number of days in the parent trip (used to render day selector options) */
  totalDays?: number;
  /** Start date string (YYYY-MM-DD) for date display hints */
  startDate?: string;
  /** Parent trip currency code */
  tripCurrency?: string;
  /** Asynchronous or synchronous submit handler */
  onSubmit: (data: PlaceEventFormData) => Promise<void> | void;
}

const CATEGORIES: Array<{
  key: EventCategory;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    key: 'dining',
    label: 'Food & Dining',
    icon: <Utensils size={18} color="var(--color-category-dining)" />,
  },
  {
    key: 'activities',
    label: 'Spot / Activity',
    icon: <Ticket size={18} color="var(--color-category-activities)" />,
  },
  {
    key: 'transport',
    label: 'Transit / Move',
    icon: <Train size={18} color="var(--color-category-transport)" />,
  },
  {
    key: 'lodging',
    label: 'Lodging / Stay',
    icon: <Hotel size={18} color="var(--color-category-lodging)" />,
  },
];

/**
 * Modal dialog for scheduling an itinerary event or activity stop.
 *
 * Provides:
 * - Category selector with specialized icons.
 * - Day assignment dropdown based on total trip calendar days.
 * - Time range inputs with start/end validation.
 * - Shared `<Input />` and `<Select />` primitives with automatic `aria-describedby` / `aria-invalid`.
 * - Location, GPS coordinate, cost, and booking reference fields.
 */
export const PlaceEventModal: React.FC<PlaceEventModalProps> = ({
  open,
  onOpenChange,
  eventToEdit,
  defaultDayIndex = 0,
  defaultCategory = 'activities',
  totalDays = 7,
  startDate,
  tripCurrency = 'USD',
  onSubmit,
}) => {
  const { toast } = useToast();
  const { currencies } = useCurrency();
  const notesId = useId();
  const notesErrorId = `${notesId}-error`;
  const categoryGroupId = useId();
  const categoryErrorId = `${categoryGroupId}-error`;

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof placeEventSchema>, unknown, z.output<typeof placeEventSchema>>({
    resolver: zodResolver(placeEventSchema),
    defaultValues: {
      title: '',
      category: defaultCategory,
      dayIndex: defaultDayIndex,
      startTime: '',
      endTime: '',
      durationMinutes: 60,
      cost: 0,
      currency: tripCurrency,
      locationName: '',
      address: '',
      lat: null,
      lng: null,
      notes: '',
      bookingRef: '',
    },
  });

  const selectedCategory = useWatch({ control, name: 'category' });
  const watchedDuration = Number(useWatch({ control, name: 'durationMinutes' })) || 60;

  useEffect(() => {
    if (open) {
      if (eventToEdit) {
        reset({
          title: eventToEdit.title,
          category: eventToEdit.category || 'activities',
          dayIndex: eventToEdit.dayIndex,
          startTime: eventToEdit.startTime || '',
          endTime: eventToEdit.endTime || '',
          durationMinutes: getEventDurationMinutes(eventToEdit),
          cost: eventToEdit.cost || 0,
          currency: eventToEdit.currency || tripCurrency,
          locationName: eventToEdit.location?.name || '',
          address: eventToEdit.location?.address || '',
          lat: eventToEdit.location?.lat ?? null,
          lng: eventToEdit.location?.lng ?? null,
          notes: eventToEdit.notes || '',
          bookingRef: eventToEdit.bookingRef || '',
        });
      } else {
        reset({
          title: '',
          category: defaultCategory,
          dayIndex: defaultDayIndex,
          startTime: '',
          endTime: '',
          durationMinutes: 60,
          cost: 0,
          currency: tripCurrency,
          locationName: '',
          address: '',
          lat: null,
          lng: null,
          notes: '',
          bookingRef: '',
        });
      }
    }
  }, [open, eventToEdit, defaultDayIndex, defaultCategory, tripCurrency, reset]);

  const onFormSubmit = async (data: PlaceEventFormData) => {
    try {
      await onSubmit(data);
      onOpenChange(false);
      toast({
        title: 'Success',
        description: eventToEdit ? 'Event updated' : 'Event added',
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save event',
        variant: 'destructive',
      });
    }
  };

  const dayOptions = useMemo(() => {
    const start = startDate ? parseLocalDate(startDate) : null;
    return Array.from({ length: Math.max(totalDays, 1) }, (_, idx) => {
      if (!start) return { value: idx, label: `Day ${idx + 1}` };
      const d = addDaysLocalDate(start, idx);
      const formatted = formatLocalDate(d, { month: 'short', day: 'numeric' });
      return { value: idx, label: `Day ${idx + 1} (${formatted})` };
    });
  }, [startDate, totalDays]);

  const currencyOptions = useMemo(() => {
    if (currencies.length > 0) {
      return currencies.map((c) => ({
        value: c.code,
        label: `${c.code} (${c.symbol})`,
      }));
    }
    return [{ value: tripCurrency, label: tripCurrency }];
  }, [currencies, tripCurrency]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={eventToEdit ? 'Edit Itinerary Stop' : 'Add Stop / Activity'}
      description="Plan and structure your trip timeline with timing, costs, and locations."
    >
      <form noValidate onSubmit={handleSubmit(onFormSubmit)} className={styles.form}>
        {/* Category Selector */}
        <div className={styles.categoryGroup}>
          <span id={categoryGroupId} className={styles.categoryLabel}>
            Activity Category
          </span>
          <div
            className={styles.categoryGrid}
            role="radiogroup"
            aria-labelledby={categoryGroupId}
            aria-describedby={errors.category ? categoryErrorId : undefined}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  data-cat={cat.key}
                  className={`${styles.categoryBtn} ${isSelected ? styles.categoryBtnActive : ''}`}
                  onClick={() => setValue('category', cat.key, { shouldValidate: true })}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
          {errors.category && (
            <span id={categoryErrorId} className={styles.errorText} role="alert">
              {errors.category.message}
            </span>
          )}
        </div>

        {/* Title */}
        <Input
          label="Activity / Place Name"
          required
          placeholder="e.g. Breakfast at Bills Omotesando"
          error={errors.title?.message}
          {...register('title')}
        />

        {/* Day, Stay Duration, Start/End Time */}
        <div className={styles.durationSection}>
          <div className={styles.row}>
            <Select
              label="Assigned Day"
              labelIcon={<Calendar size={14} />}
              options={dayOptions}
              error={errors.dayIndex?.message}
              {...register('dayIndex')}
            />

            <Input
              label="Stay Duration (min)"
              labelIcon={<Clock size={14} />}
              labelRight={
                <span className={styles.durationHintBadge}>
                  {formatDurationLabel(watchedDuration)}
                </span>
              }
              type="number"
              min="5"
              max="1440"
              step="5"
              error={errors.durationMinutes?.message}
              {...register('durationMinutes')}
            />
          </div>

          <div className={styles.durationPresets} aria-label="Stay duration quick presets">
            {[30, 60, 120, 240, 480].map((mins) => (
              <button
                key={mins}
                type="button"
                className={`${styles.durationChip} ${
                  watchedDuration === mins ? styles.durationChipActive : ''
                }`}
                onClick={() =>
                  setValue('durationMinutes', mins, { shouldValidate: true })
                }
              >
                {formatDurationLabel(mins)}
                {mins >= 480 ? ' (Overnight)' : ''}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.row}>
          <Input
            label="Start Time"
            labelIcon={<Clock size={14} />}
            type="time"
            helperText="Auto-calculated along route chain"
            error={errors.startTime?.message}
            {...register('startTime')}
          />

          <Input
            label="End Time"
            labelIcon={<Clock size={14} />}
            type="time"
            helperText="Auto-calculated from stay duration"
            error={errors.endTime?.message}
            {...register('endTime')}
          />
        </div>

        {/* Cost & Currency */}
        <div className={styles.row}>
          <Input
            label="Estimated Cost"
            labelIcon={<DollarSign size={14} />}
            type="number"
            step="any"
            min="0"
            placeholder="0.00"
            error={errors.cost?.message}
            {...register('cost')}
          />

          <Select
            label="Currency"
            options={currencyOptions}
            error={errors.currency?.message}
            {...register('currency')}
          />
        </div>

        {/* Location & Address */}
        <div className={styles.row}>
          <Input
            label="Location / Spot Area"
            labelIcon={<MapPin size={14} />}
            placeholder="e.g. Jingumae, Shibuya"
            error={errors.locationName?.message}
            {...register('locationName')}
          />

          <Input
            label="Specific Address"
            placeholder="e.g. 4-30-3 Jingumae, Shibuya, Tokyo"
            error={errors.address?.message}
            {...register('address')}
          />
        </div>

        {/* Coordinates (Optional lat/lng) */}
        <div className={styles.row}>
          <Input
            label="Latitude (Optional)"
            type="number"
            step="any"
            placeholder="e.g. 35.6672"
            error={errors.lat?.message}
            {...register('lat')}
          />

          <Input
            label="Longitude (Optional)"
            type="number"
            step="any"
            placeholder="e.g. 139.7061"
            error={errors.lng?.message}
            {...register('lng')}
          />
        </div>

        {/* Booking Reference & Notes */}
        <Input
          label="Booking Ref / Confirmation #"
          labelIcon={<Bookmark size={14} />}
          placeholder="e.g. Ref #HG-890211 or Ticket QR Slot 17:00"
          error={errors.bookingRef?.message}
          {...register('bookingRef')}
        />

        <div className={styles.field}>
          <label htmlFor={notesId} className={styles.label}>
            <FileText size={14} />
            <span>Notes, Tips &amp; Booking Details</span>
          </label>
          <textarea
            id={notesId}
            placeholder="e.g. Bring comfortable walking shoes, sake barrels photo spot, table reserved under Alex"
            className={`${styles.textarea} ${errors.notes ? styles.inputError : ''}`}
            aria-invalid={errors.notes ? true : undefined}
            aria-describedby={errors.notes ? notesErrorId : undefined}
            {...register('notes')}
          />
          {errors.notes && (
            <span id={notesErrorId} className={styles.errorText} role="alert">
              {errors.notes.message}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {eventToEdit ? 'Save Changes' : 'Add to Schedule'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
