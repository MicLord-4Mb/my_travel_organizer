import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, Input, Select, Button } from '@shared/ui';
import {
  checklistItemSchema,
  type ChecklistItemFormData,
} from '../model/checklistItemSchema';
import styles from './AddChecklistItemModal.module.css';

export interface AddChecklistItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: 'pretrip' | 'luggage';
  onSubmit: (data: ChecklistItemFormData) => Promise<void> | void;
}

export const AddChecklistItemModal: React.FC<AddChecklistItemModalProps> = ({
  open,
  onOpenChange,
  defaultType = 'pretrip',
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ChecklistItemFormData>({
    resolver: zodResolver(checklistItemSchema),
    defaultValues: {
      title: '',
      type: defaultType,
      category: defaultType === 'pretrip' ? 'documents' : 'gear',
      priority: 'normal',
      quantity: 1,
    },
  });

  const selectedType = watch('type');
  const selectedCategory = watch('category');

  useEffect(() => {
    if (selectedType === 'luggage' && selectedCategory === 'documents') {
      setValue('category', 'gear');
    }
  }, [selectedType, selectedCategory, setValue]);

  useEffect(() => {
    if (open) {
      reset({
        title: '',
        type: defaultType,
        category: defaultType === 'pretrip' ? 'documents' : 'gear',
        priority: 'normal',
        quantity: 1,
      });
    }
  }, [open, defaultType, reset]);

  const handleFormSubmit = async (data: ChecklistItemFormData) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add Checklist Item"
      description="Add a task or luggage item to ensure smooth preparation for your journey."
      maxWidth={500}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className={styles.form}>
        <Input
          label="Item / Task Title"
          placeholder="e.g., Check passport validity, Pack power bank"
          required
          error={errors.title?.message}
          {...register('title')}
        />

        <div className={styles.row}>
          <Select
            label="List Section"
            error={errors.type?.message}
            options={[
              { value: 'pretrip', label: 'Pre-Trip Tasks & Formalities' },
              { value: 'luggage', label: 'Luggage & Packing Inventory' },
            ]}
            {...register('type')}
          />

          <Select
            label="Category"
            error={errors.category?.message}
            options={
              selectedType === 'pretrip'
                ? [
                    { value: 'documents', label: 'Travel Documents' },
                    { value: 'bookings', label: 'Bookings & Confirmations' },
                    { value: 'insurance', label: 'Insurance & Health' },
                    { value: 'tasks', label: 'General Pre-trip Tasks' },
                  ]
                : [
                    { value: 'gear', label: 'Electronics & Gear' },
                    { value: 'clothes', label: 'Clothing & Footwear' },
                    { value: 'meds', label: 'Toiletries & Medicine' },
                  ]
            }
            {...register('category')}
          />
        </div>

        <div className={styles.row}>
          <Select
            label="Priority Level"
            error={errors.priority?.message}
            options={[
              { value: 'normal', label: 'Normal Priority' },
              { value: 'high', label: 'High Priority (Crucial)' },
              { value: 'optional', label: 'Optional / Nice to have' },
            ]}
            {...register('priority')}
          />

          <Input
            type="number"
            label="Quantity (Optional)"
            placeholder="1"
            min={1}
            max={99}
            error={errors.quantity?.message}
            {...register('quantity', { valueAsNumber: true })}
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
            {isSubmitting ? 'Adding...' : 'Add to Checklist'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
