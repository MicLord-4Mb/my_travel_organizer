import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetChecklistsByTripIdQuery } from '@shared/api/apiSlice';
import { useActiveTrip } from '@entities/trip';
import {
  AddChecklistItemModal,
  ApplyTemplateModal,
  useChecklistBatchActions,
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
import { Button, QueryErrorState } from '@shared/ui';
import styles from './ChecklistsPage.module.css';

export const ChecklistsPage: React.FC = () => {
  const { id: routeTripId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Selected Trip state
  const [userSelectedTripId, setUserSelectedTripId] = useState<string | null>(null);
  const {
    activeTrip: currentTrip,
    status: tripStatus,
    allTrips: trips,
    refetch: refetchTrips,
  } = useActiveTrip(userSelectedTripId);
  const effectiveTripId = currentTrip?.id;

  // UI Filter & Tab states
  const [filterUnchecked, setFilterUnchecked] = useState(false);
  const [mobileTab, setMobileTab] = useState<'pretrip' | 'luggage'>('pretrip');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);

  // Fetch checklist for selected trip
  const { data: allItems = [], isLoading } = useGetChecklistsByTripIdQuery(effectiveTripId ?? '', {
    skip: !effectiveTripId,
  });
  const checklistStatus = isLoading ? 'loading' : 'succeeded';

  const {
    toggleItem: handleToggleItem,
    deleteItem: handleDeleteItem,
    markAllCompleted: handleMarkAllCompleted,
    resetChecklist: handleResetChecklist,
    addItem,
    applyTemplate: handleApplyTemplate,
  } = useChecklistBatchActions(effectiveTripId, allItems);

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

  // Pre-trip items (including items without an explicit luggage type whose category belongs to pretrip)
  const isPretripItem = (i: (typeof displayedItems)[number]) =>
    i.type === 'pretrip' ||
    (!i.type &&
      (i.category === 'documents' ||
        i.category === 'insurance' ||
        i.category === 'bookings' ||
        i.category === 'tasks'));

  const pretripItems = useMemo(() => {
    return displayedItems.filter(isPretripItem);
  }, [displayedItems]);

  const pretripTotal = tripItems.filter(isPretripItem).length;
  const pretripDone = tripItems.filter((i) => isPretripItem(i) && i.isCompleted).length;

  const docsAndInsuranceItems = useMemo(() => {
    return pretripItems.filter(
      (i) => i.category === 'documents' || i.category === 'insurance'
    );
  }, [pretripItems]);

  const bookingsAndTasksItems = useMemo(() => {
    return pretripItems.filter(
      (i) => i.category !== 'documents' && i.category !== 'insurance'
    );
  }, [pretripItems]);

  // Luggage items
  const isLuggageItem = (i: (typeof displayedItems)[number]) => !isPretripItem(i);

  const luggageItems = useMemo(() => {
    return displayedItems.filter(isLuggageItem);
  }, [displayedItems]);

  const luggageTotal = tripItems.filter(isLuggageItem).length;
  const luggageDone = tripItems.filter((i) => isLuggageItem(i) && i.isCompleted).length;

  const gearItems = useMemo(() => {
    return luggageItems.filter(
      (i) => i.category !== 'clothes' && i.category !== 'meds'
    );
  }, [luggageItems]);

  const clothesItems = useMemo(() => {
    return luggageItems.filter((i) => i.category === 'clothes');
  }, [luggageItems]);

  const medsItems = useMemo(() => {
    return luggageItems.filter((i) => i.category === 'meds');
  }, [luggageItems]);

  // Handlers
  const handleAddItemModalSubmit = async (data: ChecklistItemFormData) => {
    await addItem(data);
  };

  const handleQuickAdd = async (item: {
    title: string;
    type: 'pretrip' | 'luggage';
    category: 'documents' | 'bookings' | 'insurance' | 'clothes' | 'gear' | 'meds' | 'tasks';
    priority: 'high' | 'normal' | 'optional';
  }) => {
    await addItem(item);
  };

  const handleSelectTrip = (tripId: string) => {
    setUserSelectedTripId(tripId);
    if (routeTripId) {
      navigate(`/trips/${tripId}/checklists`);
    }
  };

  if (tripStatus === 'loading') {
    return (
      <div className={styles.page}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <span>Loading checklist workspace...</span>
        </div>
      </div>
    );
  }

  if (tripStatus === 'error') {
    return (
      <div className={styles.page}>
        <QueryErrorState title="Could not load your checklists" onRetry={refetchTrips} />
      </div>
    );
  }

  if (tripStatus === 'not_found' || (!currentTrip && routeTripId)) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyContainer}>
          <h2>404 - Trip Not Found</h2>
          <p>The trip you are looking for does not exist.</p>
          <Button variant="primary" onClick={() => navigate('/')}>
            Back to Trips
          </Button>
        </div>
      </div>
    );
  }

  if (tripStatus === 'no_trips' || !currentTrip) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyContainer}>
          <h2>No Trips Available</h2>
          <p>Please return to the overview and create a trip.</p>
          <Button variant="primary" onClick={() => navigate('/')}>
            Go to Overview
          </Button>
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
              className={`${styles.column} ${mobileTab !== 'pretrip' ? styles.columnHiddenMobile : ''}`}
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
                subtitle="Passports, visas, permits & health coverage"
                icon={<FileText size={18} />}
                iconVariant="lodging"
                items={docsAndInsuranceItems}
                onToggle={handleToggleItem}
                onDelete={handleDeleteItem}
              />

              {/* Subgroup 2: Bookings & Confirmations */}
              <ChecklistSection
                title="Bookings & Confirmations"
                subtitle="Flights, hotels, transit passes & reservations"
                icon={<BookmarkCheck size={18} />}
                iconVariant="primary"
                items={bookingsAndTasksItems}
                onToggle={handleToggleItem}
                onDelete={handleDeleteItem}
              />
            </section>

            {/* COLUMN 2: Luggage & Packing Inventory */}
            <section
              className={`${styles.column} ${mobileTab !== 'luggage' ? styles.columnHiddenMobile : ''}`}
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
                subtitle="Chargers, adapters, cameras & power banks"
                icon={<Cpu size={18} />}
                iconVariant="luggage"
                items={gearItems}
                onToggle={handleToggleItem}
                onDelete={handleDeleteItem}
              />

              {/* Subgroup 2: Clothing & Footwear */}
              <ChecklistSection
                title="Clothing & Footwear"
                subtitle="Weather-appropriate layers & walking shoes"
                icon={<Shirt size={18} />}
                iconVariant="activities"
                items={clothesItems}
                onToggle={handleToggleItem}
                onDelete={handleDeleteItem}
              />

              {/* Subgroup 3: Toiletries & Medicine */}
              <ChecklistSection
                title="Toiletries & Medicine"
                subtitle="First-aid kit, prescriptions & travel-size essentials"
                icon={<HeartPulse size={18} />}
                iconVariant="dining"
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
