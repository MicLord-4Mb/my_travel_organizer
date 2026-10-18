import React, { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, Input, Select, Button } from '@shared/ui';
import { CHECKLIST_TYPE_OPTIONS, CHECKLIST_CATEGORIES_BY_TYPE, CHECKLIST_PRIORITY_OPTIONS } from '@entities/checklist';
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
    control,
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

  const selectedType = useWatch({ control, name: 'type' });
  const selectedCategory = useWatch({ control, name: 'category' });

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
            options={CHECKLIST_TYPE_OPTIONS}
            {...register('type')}
          />

          <Select
            label="Category"
            error={errors.category?.message}
            options={
              selectedType === 'pretrip'
                ? CHECKLIST_CATEGORIES_BY_TYPE.pretrip
                : CHECKLIST_CATEGORIES_BY_TYPE.luggage
            }
            {...register('category')}
          />
        </div>

        <div className={styles.row}>
          <Select
            label="Priority Level"
            error={errors.priority?.message}
            options={CHECKLIST_PRIORITY_OPTIONS}
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
