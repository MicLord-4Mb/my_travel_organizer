/**
 * Predefined Checklist Templates and Presets for WanderFlow.
 *
 * Provides curated template sets allowing users to rapidly populate
 * flight carry-on bags, international journeys, or weekend trips.
 */

/**
 * Single item blueprint within a packing template.
 */
export interface ChecklistTemplateItem {
  /** Item title or description */
  title: string;
  /** Suggested category */
  category?: string;
  /** Priority level */
  priority?: 'high' | 'medium' | 'low';
}

/**
 * Named template group containing multiple checklist items.
 */
export interface ChecklistTemplate {
  /** Display title of the template */
  name: string;
  /** Explanatory description of who/what the template is tailored for */
  description: string;
  /** List of predefined items to generate */
  items: ChecklistTemplateItem[];
}

/**
 * Standard registry of available travel packing templates.
 */
export const CHECKLIST_TEMPLATES: Record<string, ChecklistTemplate> = {
  flight: {
    name: 'Flight Essentials',
    description: 'Must-haves in your carry-on luggage before boarding.',
    items: [
      { title: 'Passport & Visas', category: 'documents', priority: 'high' },
      { title: 'Boarding Passes & Booking Conf.', category: 'documents', priority: 'high' },
      { title: 'Noise-Canceling Headphones', category: 'gear', priority: 'medium' },
      { title: 'Power Bank & Charging Cables', category: 'gear', priority: 'high' },
      { title: 'Eye Mask & Earplugs', category: 'gear', priority: 'low' },
      { title: 'Hand Sanitizer & Disinfectant Wipes', category: 'meds', priority: 'medium' },
    ],
  },
  international: {
    name: 'International Travel',
    description: 'Crucial documents, adapters, and travel health prep.',
    items: [
      { title: 'International Driving Permit', category: 'documents', priority: 'medium' },
      { title: 'Universal Power Adapter', category: 'gear', priority: 'high' },
      { title: 'Credit Cards (No Foreign Transaction Fee)', category: 'documents', priority: 'high' },
      { title: 'Travel Health Insurance Copy', category: 'insurance', priority: 'high' },
      { title: 'First-Aid & Prescription Medicines', category: 'meds', priority: 'high' },
    ],
  },
  weekend: {
    name: 'Weekend Getaway',
    description: 'Lightweight setup for 2-3 days of stress-free travel.',
    items: [
      { title: 'Comfortable Walking Shoes', category: 'clothes', priority: 'high' },
      { title: 'Casual Outfits (x3)', category: 'clothes', priority: 'medium' },
      { title: 'Toiletry Bag (Travel Size)', category: 'meds', priority: 'medium' },
      { title: 'Phone Charger', category: 'gear', priority: 'high' },
    ],
  },
};
