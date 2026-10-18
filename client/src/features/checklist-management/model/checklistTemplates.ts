/**
 * Predefined Checklist Templates and Presets for WanderFlow.
 *
 * Provides curated template sets allowing users to rapidly populate
 * flight carry-on bags, international journeys, or weekend trips.
 */

import type {ChecklistCategory, ChecklistPriority, ChecklistType} from "@shared/types/models";

/**
 * Single item blueprint within a packing template.
 */
export interface ChecklistTemplateItem {
  /** Item title or description */
  title: string;
  type: ChecklistType;
  /** Suggested category */
  category: ChecklistCategory;
  /** Priority level */
  priority: ChecklistPriority;
  quantity?: number;
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
      { title: 'Passport & Visas', type: 'pretrip', category: 'documents', priority: 'high' },
      { title: 'Boarding Passes & Booking Conf.', type: 'pretrip', category: 'bookings', priority: 'high' },
      { title: 'Noise-Canceling Headphones', type: 'luggage', category: 'gear', priority: 'normal' },
      { title: 'Power Bank & Charging Cables', type: 'luggage', category: 'gear', priority: 'high' },
      { title: 'Eye Mask & Earplugs', type: 'luggage', category: 'gear', priority: 'optional' },
      { title: 'Hand Sanitizer & Disinfectant Wipes', type: 'luggage', category: 'meds', priority: 'normal' },
    ],
  },
  international: {
    name: 'International Travel',
    description: 'Crucial documents, adapters, and travel health prep.',
    items: [
      { title: 'International Driving Permit', type: 'pretrip', category: 'documents', priority: 'normal' },
      { title: 'Universal Power Adapter', type: 'luggage', category: 'gear', priority: 'high' },
      { title: 'Credit Cards (No Foreign Transaction Fee)', type: 'pretrip', category: 'documents', priority: 'high' },
      { title: 'Travel Health Insurance Copy', type: 'pretrip', category: 'insurance', priority: 'high' },
      { title: 'First-Aid & Prescription Medicines', type: 'luggage', category: 'meds', priority: 'high' },
    ],
  },
  weekend: {
    name: 'Weekend Getaway',
    description: 'Lightweight setup for 2-3 days of stress-free travel.',
    items: [
      { title: 'Comfortable Walking Shoes', type: 'luggage', category: 'clothes', priority: 'high' },
      { title: 'Casual Outfits', type: 'luggage', category: 'clothes', priority: 'normal', quantity: 3 },
      { title: 'Toiletry Bag (Travel Size)', type: 'luggage', category: 'meds', priority: 'normal' },
      { title: 'Phone Charger', type: 'luggage', category: 'gear', priority: 'high' },
    ],
  },
};