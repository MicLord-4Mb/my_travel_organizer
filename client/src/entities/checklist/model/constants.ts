export const CHECKLIST_TYPE_OPTIONS = [
  { value: 'pretrip', label: 'Pre-Trip Tasks & Formalities' },
  { value: 'luggage', label: 'Luggage & Packing Inventory' },
] as const;

export const CHECKLIST_CATEGORIES_BY_TYPE = {
  pretrip: [
    { value: 'documents', label: 'Travel Documents' },
    { value: 'bookings', label: 'Bookings & Confirmations' },
    { value: 'insurance', label: 'Insurance & Health' },
    { value: 'tasks', label: 'General Pre-trip Tasks' },
  ],
  luggage: [
    { value: 'gear', label: 'Electronics & Gear' },
    { value: 'clothes', label: 'Clothing & Footwear' },
    { value: 'meds', label: 'Toiletries & Medicine' },
  ]
} as const;

export const CHECKLIST_PRIORITY_OPTIONS = [
  { value: 'normal', label: 'Normal Priority' },
  { value: 'high', label: 'High Priority (Crucial)' },
  { value: 'optional', label: 'Optional / Nice to have' },
] as const;
