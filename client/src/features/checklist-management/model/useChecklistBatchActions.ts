import { useCallback } from 'react';
import {
  useCreateChecklistItemMutation,
  useUpdateChecklistItemMutation,
  useDeleteChecklistItemMutation,
} from '@shared/api/apiSlice';
import type { ChecklistItem } from '@shared/types/models';
import { useToast } from '@shared/ui';
import { CHECKLIST_TEMPLATES } from './checklistTemplates';

/** Fields required to create a checklist item inside the active trip. */
export type NewChecklistItem = Pick<ChecklistItem, 'title' | 'category'> &
  Partial<Pick<ChecklistItem, 'type' | 'priority' | 'quantity'>>;

/**
 * Checklist write operations for a single trip (toggle, delete, batch mark/reset,
 * template application and item creation) including user feedback toasts.
 *
 * Keeps `ChecklistsPage` a pure composition container.
 *
 * @param tripId - Active trip ID; all actions are no-ops while it is undefined.
 * @param items - Current checklist items of the trip (used for batch operations/dedup).
 */
export function useChecklistBatchActions(tripId: string | undefined, items: ChecklistItem[]) {
  const { toast } = useToast();
  const [createChecklistItem] = useCreateChecklistItemMutation();
  const [updateChecklistItem] = useUpdateChecklistItemMutation();
  const [deleteChecklistItem] = useDeleteChecklistItemMutation();

  const toggleItem = useCallback(
    async (id: string, isCompleted: boolean) => {
      try {
        await updateChecklistItem({ id, tripId, payload: { isCompleted } }).unwrap();
      } catch {
        toast({ title: 'Error', description: 'Failed to update item', variant: 'destructive' });
      }
    },
    [updateChecklistItem, tripId, toast]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      if (!tripId) return;
      try {
        await deleteChecklistItem({ id, tripId }).unwrap();
      } catch {
        toast({ title: 'Error', description: 'Failed to delete item', variant: 'destructive' });
      }
    },
    [deleteChecklistItem, tripId, toast]
  );

  const setAllCompleted = useCallback(
    async (isCompleted: boolean) => {
      if (!tripId) return;
      try {
        await Promise.all(
          items
            .filter((i) => i.isCompleted !== isCompleted)
            .map((i) =>
              updateChecklistItem({ id: i.id, tripId, payload: { isCompleted } }).unwrap()
            )
        );
        toast({
          title: 'Success',
          description: isCompleted ? 'All items marked as completed' : 'Checklist reset successfully',
          variant: 'success',
        });
      } catch {
        toast({
          title: 'Error',
          description: isCompleted ? 'Failed to update some items' : 'Failed to reset checklist',
          variant: 'destructive',
        });
      }
    },
    [items, tripId, updateChecklistItem, toast]
  );

  const markAllCompleted = useCallback(() => setAllCompleted(true), [setAllCompleted]);
  const resetChecklist = useCallback(() => setAllCompleted(false), [setAllCompleted]);

  const addItem = useCallback(
    async (item: NewChecklistItem) => {
      if (!tripId) return;
      try {
        await createChecklistItem({
          tripId,
          title: item.title,
          type: item.type,
          category: item.category,
          priority: item.priority,
          quantity: item.quantity || 1,
          isCompleted: false,
        }).unwrap();
        toast({ title: 'Success', description: 'Item added successfully', variant: 'success' });
      } catch {
        toast({ title: 'Error', description: 'Failed to add item', variant: 'destructive' });
      }
    },
    [createChecklistItem, tripId, toast]
  );

  const applyTemplate = useCallback(
    async (templateId: string) => {
      const template = CHECKLIST_TEMPLATES[templateId];
      if (!tripId || !template) return;

      const existingTitles = new Set(items.map((i) => i.title.toLowerCase()));
      const newItems = template.items.filter(
        (item) => !existingTitles.has(item.title.toLowerCase())
      );

      if (newItems.length === 0) {
        toast({
          title: 'Already Applied',
          description: `All items from "${template.name}" are already in your checklist.`,
        });
        return;
      }

      try {
        await Promise.all(
          newItems.map((item) =>
            createChecklistItem({
              tripId,
              title: item.title,
              type: item.type,
              category: item.category,
              priority: item.priority,
              quantity: item.quantity ?? 1,
              isCompleted: false,
            }).unwrap()
          )
        );
        toast({
          title: 'Template Applied',
          description: `Added ${newItems.length} items from "${template.name}".`,
          variant: 'success',
        });
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to apply template items',
          variant: 'destructive',
        });
      }
    },
    [items, tripId, createChecklistItem, toast]
  );

  return { toggleItem, deleteItem, markAllCompleted, resetChecklist, addItem, applyTemplate };
}

