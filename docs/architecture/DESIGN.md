## DESIGN SYSTEM & ARCHITECTURE SPECIFICATION

### 1. Brand Identity & Aesthetic Principles
- **Application:** WanderFlow — Travel Organizer & Planning Workspace.
- **Aesthetic Direction:** Scandinavian functional minimalism. High glanceability, tactical information density, calm neutral surfaces with high-contrast functional accents.
- **Surface & Elevation:** Pure white interactive surfaces (`#FFFFFF`) over warm neutral canvas background (`#F8F9FA`).
- **Border Radius Scale:**
  - Base interactive controls: `8px` (`--radius-md`)
  - Content cards: `12px` (`--radius-lg`)
  - Modals & sheets: `16px` (`--radius-xl`)
  - Badges & chips: `9999px` (`--radius-full`)

---

### 2. Design Tokens & Color Palette
Referenced globally from [client/src/index.css](file:///c:/Users/miclo/WebstormProjects/TelRan/TwoProjects/my_travel_organizer/client/src/index.css):

| Token | CSS Variable | Hex Value | Purpose |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `--color-background` | `#F8F9FA` | Page body background |
| **Surface Base** | `--color-surface` | `#FFFFFF` | Cards, panels, modals |
| **Text Primary** | `--color-text-primary` | `#1E293B` | High-contrast body & headers |
| **Text Secondary** | `--color-text-secondary` | `#64748B` | Captions, hints, icons |
| **Border Subtle** | `--color-border-subtle` | `#E2E8F0` | Dividers and field outlines |
| **Primary Accent** | `--color-primary` | `#0D9488` | Main actions, active pills, indicators |
| **Primary Hover** | `--color-primary-hover` | `#0F766E` | Hover & active click state |
| **Category Transit** | `--color-cat-transport` | `#3B82F6` | Flights, trains, car rental |
| **Category Lodging** | `--color-cat-lodging` | `#8B5CF6` | Hotels, boutique ryokans, villas |
| **Category Activities**| `--color-cat-activities`| `#10B981` | Sightseeing, tickets, walks |
| **Category Dining** | `--color-cat-dining` | `#F59E0B` | Restaurants, cafes, food tours |
| **Status Danger** | `--color-danger` | `#EF4444` | Budget overflow, delete actions |
| **Status Success** | `--color-success` | `#10B981` | Completed tasks, saved changes |

---

### 3. Typography System
- **Font Family:** Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif
- **Display Title:** `24px` / `1.3`, Semi-Bold (600), letter-spacing `-0.02em`
- **Section Header:** `18px` / `1.35`, Semi-Bold (600), letter-spacing `-0.01em`
- **Body Medium:** `14px` / `1.5`, Medium (500)
- **Body Regular:** `14px` / `1.5`, Regular (400)
- **Caption / Micro:** `12px` / `1.4`, Regular (400), color `var(--color-text-secondary)`
- **Numeric / Currency:** `13px` / `1.4`, Medium (500), Tabular figures (`font-variant-numeric: tabular-nums`)

---

### 4. Component Architecture & UI Strategy
- **Core Library Choice:** Radix UI Primitives (Headless accessible dialogs, dropdowns, checkboxes, tabs) + CSS Modules.
  - Ensures 100% WCAG a11y compliance (keyboard navigation, focus traps, ARIA roles).
  - Keeps CSS styling modular and scoped without external Tailwind runtime overhead.
- **Drag-and-Drop:** `@dnd-kit/core` and `@dnd-kit/sortable` with custom pointer sensors and keyboard accessibility handles.
- **State Architecture:** Redux Toolkit + RTK Query (`apiSlice`) with dev-isolated logging and optimistic caching.
- **Responsive Layout Breakpoints:**
  - **Desktop (>= 1024px):** 3-column / split-view canvas with sticky day rails and route inspector.
  - **Tablet (768px - 1023px):** 2-column workspace with tabbed contexts.
  - **Mobile (< 768px):** Single-column stack with bottom navigation bar and full-width dialog sheets.
