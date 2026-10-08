import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetTripsQuery,
  useGetChecklistsByTripIdQuery,
  useCreateChecklistItemMutation,
  useUpdateChecklistItemMutation,
  useDeleteChecklistItemMutation,
} from '@shared/api/apiSlice';
import {
  AddChecklistItemModal,
  ApplyTemplateModal,
  type ChecklistItemFormData,
} from '@features/checklist-management';
import { ChecklistHeader } from './components/ChecklistHeader/ChecklistHeader';
import { ChecklistSection } from './components/ChecklistSection/ChecklistSection';
import { QuickEntryBar } from './components/QuickEntryBar/QuickEntryBar';
import {
  FileText,
  BookmarkCheck,
  Cpu,
  Shirt,
  HeartPulse,
  ClipboardList,
  Luggage,
} from 'lucide-react';
import { useToast } from '@shared/ui';
import styles from './ChecklistsPage.module.css';

export const ChecklistsPage: React.FC = () => {
  const { id: routeTripId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: trips = [] } = useGetTripsQuery();

  // Selected Trip state
  const [userSelectedTripId, setUserSelectedTripId] = useState<string>('');

  // UI Filter & Tab states
  const [filterUnchecked, setFilterUnchecked] = useState(false);
  const [mobileTab, setMobileTab] = useState<'pretrip' | 'luggage'>('pretrip');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);

  // Fetch trips on mount if not loaded automatically by RTK Query

  const effectiveTripId = useMemo(() => {
    if (routeTripId) return routeTripId;
    if (userSelectedTripId) return userSelectedTripId;
    if (trips.length > 0) {
      const defaultTrip =
        trips.find((t) => t.status === 'in_progress') ||
        trips.find((t) => t.status === 'planned') ||
        trips[0];
      return defaultTrip.id;
    }
    return undefined; // use undefined to distinguish from empty string
  }, [routeTripId, userSelectedTripId, trips]);

  // Fetch checklist for selected trip
  const { data: allItems = [], isLoading } = useGetChecklistsByTripIdQuery(effectiveTripId ?? '', {
    skip: !effectiveTripId,
  });
  const checklistStatus = isLoading ? 'loading' : 'succeeded';

  const [createChecklistItem] = useCreateChecklistItemMutation();
  const [updateChecklistItem] = useUpdateChecklistItemMutation();
  const [deleteChecklistItem] = useDeleteChecklistItemMutation();

  const currentTrip = useMemo(() => {
    if (!effectiveTripId && trips.length === 0) return null;
    const found = trips.find((t) => t.id === effectiveTripId);
    return found !== undefined ? found : undefined;
  }, [trips, effectiveTripId]);

  // Filter items by selected trip
  const tripItems = useMemo(() => {
    return allItems;
  }, [allItems]);

  // Apply unchecked-only filter
  const displayedItems = useMemo(() => {
    if (!filterUnchecked) return tripItems;
    return tripItems.filter((i) => !i.isCompleted);
  }, [tripItems, filterUnchecked]);

  // Metrics
  const totalCount = tripItems.length;
  const completedCount = tripItems.filter((i) => i.isCompleted).length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Pre-trip items
  const pretripItems = useMemo(() => {
    return displayedItems.filter((i) => i.type === 'pretrip');
  }, [displayedItems]);

  const pretripTotal = tripItems.filter((i) => i.type === 'pretrip').length;
  const pretripDone = tripItems.filter((i) => i.type === 'pretrip' && i.isCompleted).length;

  const docsAndInsuranceItems = useMemo(() => {
    return pretripItems.filter(
      (i) => i.category === 'documents' || i.category === 'insurance'
    );
  }, [pretripItems]);

  const bookingsAndTasksItems = useMemo(() => {
    return pretripItems.filter(
      (i) => i.category === 'bookings' || i.category === 'tasks'
    );
  }, [pretripItems]);

  // Luggage items
  const luggageItems = useMemo(() => {
    return displayedItems.filter((i) => i.type === 'luggage');
  }, [displayedItems]);

  const luggageTotal = tripItems.filter((i) => i.type === 'luggage').length;
  const luggageDone = tripItems.filter((i) => i.type === 'luggage' && i.isCompleted).length;

  const gearItems = useMemo(() => {
    return luggageItems.filter((i) => i.category === 'gear');
  }, [luggageItems]);

  const clothesItems = useMemo(() => {
    return luggageItems.filter((i) => i.category === 'clothes');
  }, [luggageItems]);

  const medsItems = useMemo(() => {
    return luggageItems.filter((i) => i.category === 'meds');
  }, [luggageItems]);

  // Handlers
  const handleToggleItem = async (id: string, isCompleted: boolean) => {
    try {
      await updateChecklistItem({ id, payload: { isCompleted } }).unwrap();
    } catch {
      toast({ title: 'Error', description: 'Failed to update item', variant: 'destructive' });
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteChecklistItem(id).unwrap();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete item', variant: 'destructive' });
    }
  };

  const handleMarkAllCompleted = async () => {
    if (effectiveTripId) {
      try {
        await Promise.all(
          tripItems
            .filter(i => !i.isCompleted)
            .map(i => updateChecklistItem({ id: i.id, payload: { isCompleted: true } }).unwrap())
        );
        toast({ title: 'Success', description: 'All items marked as completed', variant: 'success' });
      } catch {
        toast({ title: 'Error', description: 'Failed to update some items', variant: 'destructive' });
      }
    }
  };

  const handleResetChecklist = async () => {
    if (effectiveTripId) {
      try {
        await Promise.all(
          tripItems
            .filter(i => i.isCompleted)
            .map(i => updateChecklistItem({ id: i.id, payload: { isCompleted: false } }).unwrap())
        );
        toast({ title: 'Success', description: 'Checklist reset successfully', variant: 'success' });
      } catch {
        toast({ title: 'Error', description: 'Failed to reset checklist', variant: 'destructive' });
      }
    }
  };

  const handleApplyTemplate = async (_templateId: string) => {
    toast({
      title: 'Not Implemented',
      description: 'Templates require backend support in Stage 2 REST API. Skipped for local json-server.',
      variant: 'default'
    });
  };

  const handleAddItemModalSubmit = async (data: ChecklistItemFormData) => {
    if (effectiveTripId) {
      try {
        await createChecklistItem({
          tripId: effectiveTripId,
          title: data.title,
          type: data.type,
          category: data.category,
          priority: data.priority,
          quantity: data.quantity || 1,
          isCompleted: false,
        }).unwrap();
        toast({ title: 'Success', description: 'Item added successfully', variant: 'success' });
      } catch {
        toast({ title: 'Error', description: 'Failed to add item', variant: 'destructive' });
      }
    }
  };

  const handleQuickAdd = async (item: {
    title: string;
    type: 'pretrip' | 'luggage';
    category: 'documents' | 'bookings' | 'insurance' | 'clothes' | 'gear' | 'meds' | 'tasks';
    priority: 'high' | 'normal' | 'optional';
  }) => {
    if (effectiveTripId) {
      try {
        await createChecklistItem({
          tripId: effectiveTripId,
          title: item.title,
          type: item.type,
          category: item.category,
          priority: item.priority,
          quantity: 1,
          isCompleted: false,
        }).unwrap();
        toast({ title: 'Success', description: 'Item added successfully', variant: 'success' });
      } catch {
        toast({ title: 'Error', description: 'Failed to add item', variant: 'destructive' });
      }
    }
  };

  const handleSelectTrip = (tripId: string) => {
    setUserSelectedTripId(tripId);
    if (routeTripId) {
      navigate(`/trips/${tripId}/checklists`);
    }
  };

  if (currentTrip === undefined) {
    return (
      <div className={styles.page}>
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <h2>404 - Trip Not Found</h2>
          <p>The trip you are looking for does not exist.</p>
          <button onClick={() => navigate('/')} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#0D9488', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Back to Trips
          </button>
        </div>
      </div>
    );
  }

  if (currentTrip === null) {
    return (
      <div className={styles.page}>
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <h2>No Trips Available</h2>
          <p>Please return to the overview and create a trip.</p>
          <button onClick={() => navigate('/')} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#0D9488', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Go to Overview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* Header Summary & Actions */}
        <ChecklistHeader
          currentTrip={currentTrip}
          trips={trips}
          onSelectTrip={handleSelectTrip}
          totalItems={totalCount}
          completedItems={completedCount}
          percentage={percentage}
          filterUnchecked={filterUnchecked}
          onToggleFilterUnchecked={() => setFilterUnchecked(!filterUnchecked)}
          onMarkAllCompleted={handleMarkAllCompleted}
          onResetChecklist={handleResetChecklist}
          onOpenTemplates={() => setIsTemplatesModalOpen(true)}
          onOpenAddItem={() => setIsAddModalOpen(true)}
        />

        {/* Mobile Tab Switcher (<768px) */}
        <div className={styles.mobileSwitcher} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === 'pretrip'}
            className={`${styles.mobileTab} ${mobileTab === 'pretrip' ? styles.active : ''}`}
            onClick={() => setMobileTab('pretrip')}
          >
            Pre-Trip ({pretripDone}/{pretripTotal})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === 'luggage'}
            className={`${styles.mobileTab} ${mobileTab === 'luggage' ? styles.active : ''}`}
            onClick={() => setMobileTab('luggage')}
          >
            Luggage ({luggageDone}/{luggageTotal})
          </button>
        </div>

        {/* Loading State */}
        {checklistStatus === 'loading' && tripItems.length === 0 ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p>Loading checklist items...</p>
          </div>
        ) : (
          /* Main 2-Column Section Grid */
          <div className={styles.columnsGrid}>
            {/* COLUMN 1: Pre-Trip Tasks & Formalities */}
            <section
              className={styles.column}
              style={{
                display:
                  typeof window !== 'undefined' && window.innerWidth < 768 && mobileTab !== 'pretrip'
                    ? 'none'
                    : 'flex',
              }}
              aria-label="Pre-trip formalities"
            >
              <div className={styles.columnHeaderCard}>
                <div className={styles.columnHeaderLeft}>
                  <div className={styles.columnHeaderIcon}>
                    <ClipboardList size={20} />
                  </div>
                  <div>
                    <h2 className={styles.columnHeaderTitle}>Pre-Trip Tasks &amp; Formalities</h2>
                    <p className={styles.columnHeaderDesc}>
                      Mandatory paperwork, entry logistics, and bookings
                    </p>
                  </div>
                </div>
                <span className={styles.columnHeaderStat}>
                  {pretripDone}/{pretripTotal} Done
                </span>
              </div>

              {/* Subgroup 1: Travel Documents & Insurance */}
              <ChecklistSection
                title="Travel Documents & Insurance"
                subtitle="Sub-group A"
                icon={<FileText size={18} />}
                iconVariant="lodging"
                items={docsAndInsuranceItems}
                onToggle={handleToggleItem}
                onDelete={handleDeleteItem}
              />

              {/* Subgroup 2: Bookings & Confirmations */}
              <ChecklistSection
                title="Bookings & Confirmations"
                subtitle="Sub-group B"
                icon={<BookmarkCheck size={18} />}
                iconVariant="primary"
                items={bookingsAndTasksItems}
                onToggle={handleToggleItem}
                onDelete={handleDeleteItem}
              />
            </section>

            {/* COLUMN 2: Luggage & Packing Inventory */}
            <section
              className={styles.column}
              style={{
                display:
                  typeof window !== 'undefined' && window.innerWidth < 768 && mobileTab !== 'luggage'
                    ? 'none'
                    : 'flex',
              }}
              aria-label="Luggage inventory"
            >
              <div className={styles.columnHeaderCard}>
                <div className={styles.columnHeaderLeft}>
                  <div className={styles.columnHeaderIcon}>
                    <Luggage size={20} />
                  </div>
                  <div>
                    <h2 className={styles.columnHeaderTitle}>Luggage &amp; Packing Inventory</h2>
                    <p className={styles.columnHeaderDesc}>
                      Suitcase compartmentalization and gear audit
                    </p>
                  </div>
                </div>
                <span className={styles.columnHeaderStat}>
                  {luggageDone}/{luggageTotal} Done
                </span>
              </div>

              {/* Subgroup 1: Electronics & Gear */}
              <ChecklistSection
                title="Electronics & Gear"
                subtitle="Sub-group A"
                icon={<Cpu size={18} />}
                iconVariant="dining"
                items={gearItems}
                onToggle={handleToggleItem}
                onDelete={handleDeleteItem}
              />

              {/* Subgroup 2: Clothing & Footwear */}
              <ChecklistSection
                title="Clothing & Footwear"
                subtitle="Sub-group B"
                icon={<Shirt size={18} />}
                iconVariant="activities"
                items={clothesItems}
                onToggle={handleToggleItem}
                onDelete={handleDeleteItem}
              />

              {/* Subgroup 3: Toiletries & Medicine */}
              <ChecklistSection
                title="Toiletries & Medicine"
                subtitle="Sub-group C"
                icon={<HeartPulse size={18} />}
                iconVariant="primary"
                items={medsItems}
                onToggle={handleToggleItem}
                onDelete={handleDeleteItem}
              />
            </section>
          </div>
        )}
      </div>

      {/* Sticky Quick-Entry Bar at Bottom */}
      <QuickEntryBar onAddItem={handleQuickAdd} />

      {/* Modal: Add Item */}
      <AddChecklistItemModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        defaultType={mobileTab === 'luggage' ? 'luggage' : 'pretrip'}
        onSubmit={handleAddItemModalSubmit}
      />

      {/* Modal: Templates */}
      <ApplyTemplateModal
        open={isTemplatesModalOpen}
        onOpenChange={setIsTemplatesModalOpen}
        onApply={handleApplyTemplate}
      />
    </div>
  );
};

export default ChecklistsPage;
