import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, Input, Select, Button } from '@shared/ui';
import type { Trip } from '@shared/types/models';
import { tripSchema, type TripFormData } from '../model/tripSchema';
import styles from './TripFormModal.module.css';

const PRESET_COVERS = [
  {
    label: 'Tokyo',
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Alps',
    url: 'https://images.unsplash.com/photo-1502784444187-359ac186c5bb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Amalfi',
    url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Fjords',
    url: 'https://images.unsplash.com/photo-1507272931001-fc06c17e4f43?auto=format&fit=crop&w=1200&q=80',
  },
];

export interface TripFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripToEdit?: Trip | null;
  onSubmit: (data: TripFormData) => Promise<void> | void;
}

export const TripFormModal: React.FC<TripFormModalProps> = ({
  open,
  onOpenChange,
  tripToEdit,
  onSubmit,
}) => {
  const isEditing = Boolean(tripToEdit);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'planned',
      budgetLimit: 2000,
      currency: 'USD',
      coverImageUrl: PRESET_COVERS[0].url,
    },
  });

  const selectedCover = watch('coverImageUrl');

  useEffect(() => {
    if (open) {
      if (tripToEdit) {
        reset({
          title: tripToEdit.title,
          description: tripToEdit.description || '',
          location: tripToEdit.location || '',
          startDate: tripToEdit.startDate,
          endDate: tripToEdit.endDate,
          status: tripToEdit.status,
          budgetLimit: tripToEdit.budgetLimit || 0,
          currency: tripToEdit.currency || 'USD',
          coverImageUrl: tripToEdit.coverImageUrl || PRESET_COVERS[0].url,
        });
      } else {
        reset({
          title: '',
          description: '',
          location: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          status: 'planned',
          budgetLimit: 2000,
          currency: 'USD',
          coverImageUrl: PRESET_COVERS[0].url,
        });
      }
    }
  }, [open, tripToEdit, reset]);

  const handleFormSubmit = async (data: TripFormData) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit Journey' : 'Create New Journey'}
      description={
        isEditing
          ? 'Update the dates, budget, or destination metadata for this travel workspace.'
          : 'Plan your next adventure with structured timeline, budget, and checklists.'
      }
      maxWidth={560}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className={styles.form}>
        <Input
          label="Trip Title"
          placeholder="e.g., Autumn in Tokyo & Kyoto"
          required
          error={errors.title?.message}
          {...register('title')}
        />

        <div className={styles.row}>
          <Input
            label="Destination / Location"
            placeholder="e.g., Tokyo, Japan"
            required
            error={errors.location?.message}
            {...register('location')}
          />
          <Select
            label="Status"
            error={errors.status?.message}
            options={[
              { value: 'planned', label: 'Upcoming (Planned)' },
              { value: 'in_progress', label: 'Active Now' },
              { value: 'completed', label: 'Completed (Past)' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            {...register('status')}
          />
        </div>

        <div className={styles.row}>
          <Input
            type="date"
            label="Start Date"
            required
            error={errors.startDate?.message}
            {...register('startDate')}
          />
          <Input
            type="date"
            label="End Date"
            required
            error={errors.endDate?.message}
            {...register('endDate')}
          />
        </div>

        <Input
          label="Description / Subtitle"
          placeholder="e.g., 8 Days • High-speed Shinkansen & boutique ryokan stay"
          error={errors.description?.message}
          {...register('description')}
        />

        <div className={styles.row}>
          <Input
            type="number"
            label="Budget Limit"
            placeholder="e.g., 2000"
            error={errors.budgetLimit?.message}
            {...register('budgetLimit', { valueAsNumber: true })}
          />
          <Select
            label="Currency"
            error={errors.currency?.message}
            options={[
              { value: 'USD', label: 'USD ($)' },
              { value: 'EUR', label: 'EUR (€)' },
              { value: 'GBP', label: 'GBP (£)' },
              { value: 'JPY', label: 'JPY (¥)' },
              { value: 'ILS', label: 'ILS (₪)' },
            ]}
            {...register('currency')}
          />
        </div>

        <div className={styles.coverPicker}>
          <label className={styles.thumbnailLabel} style={{ position: 'static', background: 'none', color: 'inherit', textAlign: 'left' }}>
            Destination Cover Photo
          </label>
          <div className={styles.coverThumbnails}>
            {PRESET_COVERS.map((preset) => (
              <button
                key={preset.url}
                type="button"
                className={`${styles.thumbnailBtn} ${
                  selectedCover === preset.url ? styles.selected : ''
                }`}
                onClick={() => setValue('coverImageUrl', preset.url)}
              >
                <img
                  src={preset.url}
                  alt={preset.label}
                  className={styles.thumbnailImg}
                />
                <span className={styles.thumbnailLabel}>{preset.label}</span>
              </button>
            ))}
          </div>
          <Input
            label="Or Custom Cover URL"
            placeholder="https://..."
            error={errors.coverImageUrl?.message}
            {...register('coverImageUrl')}
            containerClassName="mt-2"
          />
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting
              ? 'Saving...'
              : isEditing
              ? 'Save Changes'
              : 'Create Journey'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
