import React, { useEffect, useId } from 'react';
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
import { Dialog, Button, useToast } from '@shared/ui';
import type { PlaceEvent, EventCategory } from '@shared/types/models';
import {
  placeEventSchema,
  type PlaceEventFormData,
} from '../model/placeEventSchema';
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
  color: string;
}> = [
    {
      key: 'dining',
      label: 'Food & Dining',
      icon: <Utensils size={18} color="#F59E0B" />,
      color: '#F59E0B',
    },
    {
      key: 'activities',
      label: 'Spot / Activity',
      icon: <Ticket size={18} color="#10B981" />,
      color: '#10B981',
    },
    {
      key: 'transport',
      label: 'Transit / Move',
      icon: <Train size={18} color="#3B82F6" />,
      color: '#3B82F6',
    },
    {
      key: 'lodging',
      label: 'Lodging / Stay',
      icon: <Hotel size={18} color="#8B5CF6" />,
      color: '#8B5CF6',
    },
  ];

/**
 * Modal dialog for scheduling an itinerary event or activity stop.
 *
 * Provides:
 * - Category selector with specialized icons.
 * - Day assignment dropdown based on total trip calendar days.
 * - Time range inputs with start/end precedence checks.
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
  const titleId = useId();
  const dayIndexId = useId();
  const startTimeId = useId();
  const endTimeId = useId();
  const costId = useId();
  const currencyId = useId();
  const locationNameId = useId();
  const addressId = useId();
  const latId = useId();
  const lngId = useId();
  const bookingRefId = useId();
  const notesId = useId();

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

  useEffect(() => {
    if (open) {
      if (eventToEdit) {
        reset({
          title: eventToEdit.title,
          category: eventToEdit.category || 'activities',
          dayIndex: eventToEdit.dayIndex,
          startTime: eventToEdit.startTime || '',
          endTime: eventToEdit.endTime || '',
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
        variant: 'success'
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save event',
        variant: 'destructive'
      });
    }
  };

  const getDayLabel = (idx: number) => {
    if (!startDate) return `Day ${idx + 1}`;
    const start = parseLocalDate(startDate);
    if (!start) return `Day ${idx + 1}`;
    const d = addDaysLocalDate(start, idx);
    const formatted = formatLocalDate(d, {
      month: 'short',
      day: 'numeric',
    });
    return `Day ${idx + 1} (${formatted})`;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={eventToEdit ? 'Edit Itinerary Stop' : 'Add Stop / Activity'}
      description="Plan and structure your trip timeline with timing, costs, and locations."
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className={styles.form}>
        {/* Category Selector */}
        <div className={styles.categoryGroup}>
          <label className={styles.categoryLabel}>Activity Category</label>
          <div className={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  className={`${styles.categoryBtn} ${isSelected ? styles.categoryBtnActive : ''
                    }`}
                  style={{
                    color: isSelected ? cat.color : undefined,
                    borderColor: isSelected ? cat.color : undefined,
                  }}
                  onClick={() => setValue('category', cat.key)}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
          {errors.category && (
            <span className={styles.errorText}>{errors.category.message}</span>
          )}
        </div>

        {/* Title */}
        <div className={styles.field}>
          <label htmlFor={titleId} className={styles.label}>
            <span>Activity / Place Name</span>
            <span className={styles.required}>*</span>
          </label>
          <input
            id={titleId}
            type="text"
            placeholder="e.g. Breakfast at Bills Omotesando"
            className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
            {...register('title')}
          />
          {errors.title && (
            <span className={styles.errorText}>{errors.title.message}</span>
          )}
        </div>

        {/* Day, Start Time, End Time */}
        <div className={styles.rowThree}>
          <div className={styles.field}>
            <label htmlFor={dayIndexId} className={styles.label}>
              <Calendar size={14} />
              <span>Assigned Day</span>
            </label>
            <select id={dayIndexId} className={styles.select} {...register('dayIndex')}>
              {Array.from({ length: Math.max(totalDays, 1) }, (_, i) => (
                <option key={i} value={i}>
                  {getDayLabel(i)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor={startTimeId} className={styles.label}>
              <Clock size={14} />
              <span>Start Time</span>
            </label>
            <input
              id={startTimeId}
              type="time"
              className={`${styles.input} ${errors.startTime ? styles.inputError : ''
                }`}
              {...register('startTime')}
            />
            {errors.startTime && (
              <span className={styles.errorText}>{errors.startTime.message}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor={endTimeId} className={styles.label}>
              <Clock size={14} />
              <span>End Time</span>
            </label>
            <input
              id={endTimeId}
              type="time"
              className={`${styles.input} ${errors.endTime ? styles.inputError : ''
                }`}
              {...register('endTime')}
            />
            {errors.endTime && (
              <span className={styles.errorText}>{errors.endTime.message}</span>
            )}
          </div>
        </div>

        {/* Cost & Currency */}
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor={costId} className={styles.label}>
              <DollarSign size={14} />
              <span>Estimated Cost</span>
            </label>
            <input
              id={costId}
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              className={`${styles.input} ${errors.cost ? styles.inputError : ''}`}
              {...register('cost')}
            />
            {errors.cost && (
              <span className={styles.errorText}>{errors.cost.message}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor={currencyId} className={styles.label}>
              <span>Currency</span>
            </label>
            <select id={currencyId} className={styles.select} {...register('currency')}>
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location & Address */}
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor={locationNameId} className={styles.label}>
              <MapPin size={14} />
              <span>Location / Spot Area</span>
            </label>
            <input
              id={locationNameId}
              type="text"
              placeholder="e.g. Jingumae, Shibuya"
              className={styles.input}
              {...register('locationName')}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor={addressId} className={styles.label}>
              <span>Specific Address</span>
            </label>
            <input
              id={addressId}
              type="text"
              placeholder="e.g. 4-30-3 Jingumae, Shibuya, Tokyo"
              className={styles.input}
              {...register('address')}
            />
          </div>
        </div>

        {/* Coordinates (Optional lat/lng) */}
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor={latId} className={styles.label}>
              <span>Latitude (Optional)</span>
            </label>
            <input
              id={latId}
              type="number"
              step="any"
              placeholder="e.g. 35.6672"
              className={styles.input}
              {...register('lat')}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor={lngId} className={styles.label}>
              <span>Longitude (Optional)</span>
            </label>
            <input
              id={lngId}
              type="number"
              step="any"
              placeholder="e.g. 139.7061"
              className={styles.input}
              {...register('lng')}
            />
          </div>
        </div>

        {/* Booking Reference & Notes */}
        <div className={styles.field}>
          <label htmlFor={bookingRefId} className={styles.label}>
            <Bookmark size={14} />
            <span>Booking Ref / Confirmation #</span>
          </label>
          <input
            id={bookingRefId}
            type="text"
            placeholder="e.g. Ref #HG-890211 or Ticket QR Slot 17:00"
            className={styles.input}
            {...register('bookingRef')}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor={notesId} className={styles.label}>
            <FileText size={14} />
            <span>Notes, Tips & Booking Details</span>
          </label>
          <textarea
            id={notesId}
            placeholder="e.g. Bring comfortable walking shoes, sake barrels photo spot, table reserved under Alex"
            className={styles.textarea}
            {...register('notes')}
          />
          {errors.notes && (
            <span className={styles.errorText}>{errors.notes.message}</span>
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
