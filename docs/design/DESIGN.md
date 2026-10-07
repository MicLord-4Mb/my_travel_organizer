---
name: Nordic Travel Workspace
colors:
  surface: '#FFFFFF'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3d4947'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6d7a77'
  outline-variant: '#bcc9c6'
  surface-tint: '#006a61'
  primary: '#00685f'
  on-primary: '#ffffff'
  primary-container: '#008378'
  on-primary-container: '#f4fffc'
  inverse-primary: '#6bd8cb'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#6b38d4'
  on-tertiary: '#ffffff'
  tertiary-container: '#8455ef'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#89f5e7'
  primary-fixed-dim: '#6bd8cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#005049'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d0bcff'
  on-tertiary-fixed: '#23005c'
  on-tertiary-fixed-variant: '#5516be'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  canvas-bg: '#F8F9FA'
  text-primary: '#1E293B'
  text-secondary: '#64748B'
  border-subtle: '#E2E8F0'
  primary-hover: '#0F766E'
  category-transport: '#3B82F6'
  category-lodging: '#8B5CF6'
  category-activities: '#10B981'
  category-dining: '#F59E0B'
  status-danger: '#EF4444'
  status-success: '#10B981'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.025em
  display-title:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  display-title-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  section-header:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-medium:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 21px
  body-regular:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 21px
  numeric-currency:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  caption-micro:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  badge-label:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

The design system embodies Scandinavian functional minimalism tailored for a high-utility travel organizer and itinerary workspace. It communicates clarity, calm precision, and deliberate utility, stripping away ornamental clutter in favor of structured space, crisp hierarchy, and scannable visual anchors.

The target audience consists of detail-oriented travelers, remote workers, and itinerary planners who require glanceable scheduling, expense management, and real-time logistics tracking without cognitive overload. The emotional tone is reassuringly grounded, serene, and capable.

The design movement combines **Minimalism** with **Modern Corporate Utility**:
- Restful, pale neutral canvas backgrounds (`#F8F9FA`) paired with crisp white card containers (`#FFFFFF`).
- Tactical information density balancing expansive whitespace with tight tabular data.
- Intentional functional color accents to segment logistical categories (transit, lodging, activities, dining) against an otherwise monochromatic, tranquil substrate.

## Colors

The color system is organized around a dual-level hierarchy: a monochromatic structural base complemented by a strict semantic category palette.

### Structural Base
- **Canvas Background (`#F8F9FA`)**: An ultra-soft, low-glare foundation that provides gentle contrast against interactive modules.
- **Surface (`#FFFFFF`)**: Pure white reserved for cards, drawers, toolbars, and input containers to establish foreground focus.
- **Text Primary (`#1E293B`)**: Deep slate providing optimal WCAG AAA contrast without the harshness of pure black.
- **Text Secondary (`#64748B`)**: Balanced cool slate used for timestamps, metadata, helper text, and inactive icons.
- **Border Subtle (`#E2E8F0`)**: Hairline dividers and container outlines maintaining structure without heavy line weight.

### Semantic & Categorical Colors
- **Primary Brand Accent (`#0D9488`)**: A focused teal reserved for primary CTAs, active selection tabs, and keyboard focus halos. Hover transitions strictly to `#0F766E`.
- **Category Accents**: Used on badges, timeline markers, and card accents to encode travel verticals at a glance:
  - **Transport (`#3B82F6`)**: Flight, train, rental car, and transit nodes.
  - **Lodging (`#8B5CF6`)**: Hotels, apartments, and check-in events.
  - **Activities (`#10B981`)**: Excursions, tours, and museum entries (also shared by `status-success`).
  - **Dining (`#F59E0B`)**: Reservations, culinary markers, and food stops.
  - **Danger / Over-budget (`#EF4444`)**: Unresolved schedule conflicts, cancellation flags, and budget alerts.

## Typography

The typographic hierarchy utilizes **Inter** across all roles to maintain a unified, rational aesthetic. Tight tracking on display sizes conveys modern, editorial refinement, while open tracking and balanced optical metrics preserve high legibility across small UI labels.

Key functional rules:
- **Tabular Numerals**: Apply OpenType feature `"tnum" 1` (`font-variant-numeric: tabular-nums`) to all financial metrics, flight times, currency conversions, and duration calculations. This prevents horizontal jitter and ensures strict vertical column alignment.
- **Hierarchy Separation**: Primary emphasis is achieved via font weight (`500` vs `600`) and value shifts from `#1E293B` to `#64748B`, rather than exaggerated scale leaps.

## Layout & Spacing

The layout is built upon an 8px rhythmic grid with a 4px sub-grid for tight inline alignments (such as icon-to-label gaps). 

### Grid & Breakpoints
- **Mobile (< 768px)**: 4-column layout, `1rem` outer margins, `1rem` gutters. Content stacks into a single fluid vertical stream. Navigation relies on sticky bottom utility bars or sheet drawers.
- **Tablet (768px – 1024px)**: 8-column layout, `1.5rem` outer margins, `1.25rem` gutters. Accommodates two-pane views (collapsible itinerary index + schedule details).
- **Desktop (>= 1024px)**: 12-column layout with a maximum content container width of `1440px`, centered. `2.5rem` margins and `1.5rem` gutters. Enables a persistent left navigation rail (64px or 240px expanded), an itinerary stream (spans 7 columns), and an interactive contextual inspect panel/map (spans 5 columns).

### Spacing Tokens
- `space-xs` (4px): Micro gaps between icons and badge labels.
- `space-sm` (8px): Padding within compact chips, form input row gaps, and list item spacing.
- `space-md` (16px): Standard component padding inside cards and table cells.
- `space-lg` (24px): Gap between distinct section blocks and layout modules.
- `space-xl` (32px): Primary separation between day-by-day itinerary clusters.
- `space-2xl` (48px): Page-level top/bottom canvas padding.

## Elevation & Depth

Visual depth is achieved through **low-contrast outlines** paired with **ambient micro-shadows**, strictly preserving a flat Scandinavian ethos rather than heavy skeuomorphism.

- **Level 0 (Canvas Base)**: Plain `#F8F9FA` background; no border or shadow.
- **Level 1 (Cards & Workspaces)**: `#FFFFFF` surface with a crisp `1px solid #E2E8F0` border and a faint ambient shadow: `0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02)`.
- **Level 2 (Hovered Cards & Contextual Menus)**: `#FFFFFF` surface, border transitions to `rgba(203, 213, 225, 0.8)`, elevated with `0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)`.
- **Level 3 (Modals, Overlays, Floating Toolbars)**: `#FFFFFF` surface, elevated above a dimming backdrop (`rgba(15, 23, 42, 0.3)`), using `0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)`.

## Shapes

The geometric vocabulary balances clean architectural lines with gentle ergonomic softening:
- **Base Components (Inputs, Buttons, Dropdowns)**: `8px` (`0.5rem`) corner radius.
- **Cards & Data Panels**: `12px` (`0.75rem`) corner radius.
- **Modals, Floating Sheets, & Flyouts**: `16px` (`1rem`) corner radius.
- **Category Chips, Status Badges, & Avatars**: `9999px` (Pill shape) to provide immediate semantic contrast against rectilinear content blocks.

## Components

### Buttons
- **Primary**: Background `#0D9488`, text `#FFFFFF`, border none, 8px radius. Hover: `#0F766E`. Active: `#115E59`. Focus ring: 2px offset with `#0D9488` at 40% alpha.
- **Secondary / Subtle**: Background `#FFFFFF`, text `#1E293B`, border `1px solid #E2E8F0`, 8px radius. Hover: `#F8F9FA` with border color `#CBD5E1`.
- **Ghost**: Background transparent, text `#64748B`, 8px radius. Hover: Background `#F1F5F9`, text `#1E293B`.
- **Destructive**: Background `#EF4444`, text `#FFFFFF`. Hover: `#DC2626`.

### Chips & Badges
- **Pill Badges (`rounded: 9999px`)**: 
  - Height 22px, padding 2px 8px. Font size 11px semi-bold uppercase tracking.
  - Subdued background tint (10% opacity) matching the semantic category with 100% solid category text. Example: Transport badge uses `rgba(59, 130, 246, 0.1)` background with `#2563EB` text.
- **Interactive Filter Chips**: 
  - Base: `#FFFFFF` background, `1px solid #E2E8F0`, text `#64748B`.
  - Selected: `#0D9488` background, text `#FFFFFF`, border color `#0D9488`.

### Input Fields
- Container: Background `#FFFFFF`, border `1px solid #E2E8F0`, 8px radius, height 38px, padding `0 12px`.
- Text: 14px Regular `#1E293B`, placeholder `#94A3B8`.
- Focus state: Border color `#0D9488`, outline `2px solid rgba(13, 148, 136, 0.2)`.
- Error state: Border color `#EF4444`, outline `2px solid rgba(239, 68, 68, 0.2)`.

### Cards & Itinerary Items
- **Card Base**: `#FFFFFF` background, 12px radius, `1px solid #E2E8F0` border, `space-md` (16px) internal padding.
- **Timeline Card Variant**: Left accent border `3px solid [Category Color]` to delineate transport, lodging, activities, or dining at a glance.

### Checkboxes & Radio Buttons
- 16px square (checkbox, 4px radius) or 16px circle (radio).
- Border `1.5px solid #CBD5E1`. Checked state: Background `#0D9488` with white checkmark/dot.

### Specialized Workspace Components
- **Currency Metric Display**: Numeric values styled with `numeric-currency` token, right-aligned, displaying ISO currency codes (e.g., `USD`, `EUR`) in 11px muted slate.
- **Timeline Bar**: 2px vertical guide in `#E2E8F0` connecting event nodes, with 10px circular node markers tinted with the respective category color.
