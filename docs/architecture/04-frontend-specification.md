# 04. Frontend Development Specification (Iteration 1 — Mock JSON MVP)

## 1. Executive Summary & Iteration 1 Scope

This specification defines the engineering architecture, functional requirements, component contracts, data flow, and implementation roadmap for **Iteration 1** of the **WanderFlow Travel Organizer** frontend application.

### 1.1 Iteration 1 Objectives
- Deliver a complete, interactive Single-Page Application (SPA) covering all four core product workspaces:
  1. **Trips Catalog & Dashboard** (Macro-planning)
  2. **Itinerary Workspace — Day-by-Day Timeline with Drag-and-Drop** (Micro-planning)
  3. **Budget & Expenses Tracker** (Financial control)
  4. **Checklists & Packing Management** (Pre-trip readiness)
- Operate against a structured mock JSON dataset (`db.json`) served via `json-server` (`http://localhost:3001`) and consumed exclusively through **Redux Toolkit Query (RTK Query)**.
- Enforce strict architectural boundaries (Feature-Sliced Design), zero `any` typing, accessible headless UI primitives (**Radix UI + CSS Modules**), and declarative form validation (**React Hook Form + Zod**).

---

## 2. Technology Stack & Architectural Decisions

| Layer / Concern | Selected Technology | Architectural Rationale |
| :--- | :--- | :--- |
| **Core Framework** | React 19+, TypeScript (Strict Mode), Vite | Fast HMR, strict type safety, zero `any` policy. |
| **Routing** | React Router v8 (Data Mode) | Declarative nested layouts, URL-synchronized trip workspaces. |
| **Server Cache & API** | RTK Query (`createApi`, `fetchBaseQuery`) | Abstracts data fetching over `json-server` (`db.json`), handles tag-based cache invalidation and optimistic UI updates. |
| **Client UI State** | Redux Toolkit (`createSlice`, `createEntityAdapter`) | Manages transient UI state (filters, active day, modals) and normalized client-side projections. |
| **UI Primitives** | Radix UI Primitives (Headless) | 100% WAI-ARIA compliance (focus traps, keyboard nav, screen-reader attributes) without Tailwind runtime conflicts. |
| **Styling System** | Native CSS Modules (`*.module.css`) + CSS Variables | Scoped styling aligned with `DESIGN.md` tokens and Radix `[data-state]` selectors. |
| **Drag-and-Drop** | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` | Hardware-accelerated transforms, custom pointer/touch sensors, explicit drag handles, and keyboard sorting accessibility. |
| **Forms & Validation** | `react-hook-form` + `zod` + `@hookform/resolvers` | Schema-driven validation with field-level accessible error reporting. |
| **Testing** | Vitest + React Testing Library | Unit testing for selectors/validators and integration testing for interactive flows. |

### 2.1 Immutable Engineering Rules
1. **No Direct Storage / Fetch Calls in Components:** Components must never call `fetch`, `axios`, or `localStorage` directly. All data access goes through RTK Query hooks (`@shared/api/*`) or typed storage adapters (`@shared/api/storage/*`).
2. **Strict Path Aliases:** All cross-layer imports must use path aliases (`@app/*`, `@pages/*`, `@widgets/*`, `@features/*`, `@entities/*`, `@shared/*`). Parent-traversing relative imports (`../`) are prohibited.
3. **Strict Domain Typing:** All entities and payloads must conform to contracts in `docs/architecture/02-domain-models.md` exported from `@shared/types`.
4. **No Tailwind / shadcn Conflict:** All components use scoped `*.module.css` bound to global CSS variables defined in `DESIGN.md`.

---

## 3. Feature-Sliced Design (Light-FSD) Directory Structure

```text
client/src/
├── app/
│   ├── providers/
│   │   ├── StoreProvider.tsx         # Redux store provider
│   │   └── RouterProvider.tsx        # React Router configuration
│   ├── store/
│   │   └── store.ts                  # configureStore (apiSlice + uiSlice + feature slices)
│   ├── styles/
│   │   ├── tokens.css                # CSS Custom Properties from DESIGN.md
│   │   ├── reset.css                 # Modern CSS reset
│   │   └── index.css                 # Global typography & base styles
│   └── App.tsx
├── pages/
│   ├── TripsCatalogPage/             # Screen 1: Macro catalog (/trips)
│   ├── TripWorkspacePage/            # Screens 2, 3, 4 container (/trips/:tripId)
│   └── NotFoundPage/                 # 404 fallback
├── widgets/
│   ├── TopNavbar/                    # Brand header, global search, "+ Plan New Trip" CTA
│   ├── BottomNavBar/                 # Mobile (<768px) 4-tab bar + central FAB
│   ├── WorkspaceHeader/              # Trip title, date range, budget badge, quick actions
│   ├── StickyDayRail/                # Horizontal/sidebar day switcher with daily cost preview
│   ├── ItineraryTimelineWidget/      # Screen 2: Sortable vertical timeline canvas
│   ├── BudgetDashboardWidget/        # Screen 3: KPI cards, category breakdown, transaction ledger
│   └── ChecklistBoardWidget/         # Screen 4: Readiness bar, dual-column pre-trip & luggage lists
├── features/
│   ├── trip-filters/                 # Search input (debounced), status pills, sort select, view toggle
│   ├── trip-form/                    # Create / Edit Trip modal (React Hook Form + Zod)
│   ├── trip-actions/                 # Context menu: Edit, Duplicate, Delete (with 2-step confirmation)
│   ├── event-dnd/                    # @dnd-kit SortableContext, sensors, optimistic reorder logic
│   ├── event-form/                   # Create / Edit PlaceEvent modal
│   ├── expense-form/                 # Create / Edit Expense modal + category/day filters
│   └── checklist-actions/            # Quick-entry input bar, toggle item, "Mark all completed"
├── entities/
│   ├── trip/
│   │   ├── model/                    # Selectors, status/duration calculators
│   │   └── ui/TripCard/              # Grid & Compact List card variants
│   ├── itinerary/
│   │   ├── model/                    # Day grouping utilities (startDate + dayIndex)
│   │   └── ui/EventCard/             # Timeline card with grip handle & category strip
│   ├── expense/
│   │   ├── model/                    # Budget ratio & category aggregation helpers
│   │   └── ui/ExpenseRow/            # Ledger row & KPI summary card
│   └── checklist/
│       ├── model/                    # Readiness percentage calculators
│       └── ui/ChecklistItemRow/      # Accessible checkbox row with priority badge
└── shared/
    ├── api/
    │   ├── apiSlice.ts               # Base RTK Query API configuration
    │   ├── tripsApi.ts               # Injected endpoints for Trips
    │   ├── eventsApi.ts              # Injected endpoints for PlaceEvents
    │   ├── expensesApi.ts            # Injected endpoints for Expenses
    │   └── checklistsApi.ts          # Injected endpoints for ChecklistItems
    ├── ui/                           # Radix UI + CSS Modules atomic components
    │   ├── Button/
    │   ├── Input/
    │   ├── Dialog/                   # Responsive Modal (Desktop) / Bottom Sheet (Mobile)
    │   ├── AlertDialog/              # Two-step destructive action confirmation
    │   ├── DropdownMenu/
    │   ├── Select/
    │   ├── Tabs/
    │   ├── Checkbox/
    │   ├── Badge/
    │   ├── ProgressBar/
    │   └── EmptyState/
    ├── lib/
    │   ├── date/                     # Duration, dayIndex -> ISO date, formatting
    │   ├── currency/                 # Intl.NumberFormat tabular formatters
    │   └── validation/               # Shared Zod primitives
    └── types/
        └── domain.ts                 # Strict interfaces from 02-domain-models.md
```

---

## 4. Mock Data Architecture (`db.json`) & RTK Query Specification

### 4.1 Mock JSON Structure (`client/db.json`)
`json-server` serves four top-level collections on `http://localhost:3001`:

```json
{
  "trips": [
    {
      "id": "trip-tokyo-2026",
      "title": "Tokyo Exploration",
      "description": "Autumn cultural and culinary journey across Tokyo neighborhoods.",
      "startDate": "2026-10-12",
      "endDate": "2026-10-20",
      "coverImageUrl": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80",
      "status": "planned",
      "budgetLimit": 2500,
      "currency": "USD",
      "location": "Tokyo, Japan",
      "createdAt": "2026-09-01T10:00:00.000Z",
      "updatedAt": "2026-09-15T14:30:00.000Z"
    }
  ],
  "events": [
    {
      "id": "evt-101",
      "tripId": "trip-tokyo-2026",
      "dayIndex": 0,
      "order": 0,
      "title": "Arrival at Narita Express (N'EX)",
      "category": "transport",
      "startTime": "09:30",
      "endTime": "10:45",
      "location": {
        "name": "Narita Airport Terminal 1",
        "address": "1-1 Furugome, Narita, Chiba"
      },
      "cost": 35,
      "currency": "USD",
      "notes": "Reserved car 4, seat 12A",
      "bookingRef": "JR-88412",
      "createdAt": "2026-09-02T10:00:00.000Z",
      "updatedAt": "2026-09-02T10:00:00.000Z"
    }
  ],
  "expenses": [
    {
      "id": "exp-201",
      "tripId": "trip-tokyo-2026",
      "amount": 850,
      "currency": "USD",
      "category": "transport",
      "title": "Round-trip Flight Tickets",
      "date": "2026-10-12",
      "dayIndex": 0,
      "paymentMethod": "Card",
      "notes": "ANA direct flight",
      "createdAt": "2026-09-02T11:00:00.000Z",
      "updatedAt": "2026-09-02T11:00:00.000Z"
    }
  ],
  "checklists": [
    {
      "id": "chk-301",
      "tripId": "trip-tokyo-2026",
      "title": "Register Visit Japan Web QR Code",
      "type": "pretrip",
      "category": "documents",
      "isCompleted": true,
      "priority": "high",
      "quantity": 1,
      "createdAt": "2026-09-03T09:00:00.000Z",
      "updatedAt": "2026-09-05T09:00:00.000Z"
    }
  ]
}
```

### 4.2 Seed Dataset Requirements for Iteration 1
To enable immediate testing of all UI states without manual entry, `db.json` must include at least **4 realistic trips**:
1. **Upcoming Trip (`status: 'planned'`):** "Tokyo Exploration" (8 days, normal budget ~72% spent, 68% packed, rich multi-day itinerary).
2. **Active Trip (`status: 'in_progress'`):** "Swiss Alps Scenic Rail" (5 days, warning budget ~93% spent, active daily events).
3. **Over-Budget Trip (`status: 'planned'`):** "Amalfi Coast Getaway" (exceeded budget >105% to demonstrate the Crimson Red `#EF4444` Over-Budget Alert state).
4. **Completed Trip (`status: 'completed'`):** "Reykjavik Northern Lights" (past dates, 100% checklist completion).

### 4.3 RTK Query Endpoints & Cache Tag Strategy

Base URL: `import.meta.env.VITE_API_URL || 'http://localhost:3001'`
Cache Tags: `['Trip', 'Event', 'Expense', 'Checklist']`

| Domain | Endpoint Name | HTTP Method & Path | Cache Tags (Provides / Invalidates) | Special Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Trips** | `getTrips` | `GET /trips` | Provides `['Trip']` | Supports client-side search, filter, and sort selectors. |
| **Trips** | `getTripById` | `GET /trips/:id` | Provides `[{ type: 'Trip', id }]` | Used by `TripWorkspacePage`. |
| **Trips** | `createTrip` | `POST /trips` | Invalidates `['Trip']` | Generates UUID & ISO timestamps. |
| **Trips** | `updateTrip` | `PATCH /trips/:id` | Invalidates `[{ type: 'Trip', id }, 'Trip']` | Updates `updatedAt`. |
| **Trips** | `deleteTrip` | `DELETE /trips/:id` | Invalidates `['Trip']` | Triggered only after `AlertDialog` confirmation. |
| **Trips** | `duplicateTrip` | `POST /trips` (+ child clones) | Invalidates `['Trip', 'Event', 'Checklist']` | Copies trip metadata (appending `" (Copy)"`), template events, and reset checklist items. |
| **Events** | `getEventsByTripId` | `GET /events?tripId=:tripId` | Provides `[{ type: 'Event', id: tripId }]` | Sorted by `dayIndex ASC, order ASC`. |
| **Events** | `createEvent` | `POST /events` | Invalidates `[{ type: 'Event', id: tripId }]` | Assigns next `order` index in target day. |
| **Events** | `updateEvent` | `PATCH /events/:id` | Invalidates `[{ type: 'Event', id: tripId }]` | Updates event details. |
| **Events** | `reorderEvents` | Batch `PATCH /events/:id` | Optimistic update via `onQueryStarted` | Immediately updates cached `order` & `dayIndex` via `arrayMove` before persisting to `json-server`. |
| **Events** | `deleteEvent` | `DELETE /events/:id` | Invalidates `[{ type: 'Event', id: tripId }]` | Removes stop from timeline. |
| **Expenses** | `getExpensesByTripId` | `GET /expenses?tripId=:tripId` | Provides `[{ type: 'Expense', id: tripId }, 'Trip']` | Sorted by `date DESC`. |
| **Expenses** | `createExpense` | `POST /expenses` | Invalidates `[{ type: 'Expense', id: tripId }, 'Trip']` | Recalculates trip spent total. |
| **Expenses** | `updateExpense` | `PATCH /expenses/:id` | Invalidates `[{ type: 'Expense', id: tripId }, 'Trip']` | Updates expense record. |
| **Expenses** | `deleteExpense` | `DELETE /expenses/:id` | Invalidates `[{ type: 'Expense', id: tripId }, 'Trip']` | Removes transaction. |
| **Checklists** | `getChecklistsByTripId`| `GET /checklists?tripId=:tripId`| Provides `[{ type: 'Checklist', id: tripId }, 'Trip']` | Grouped by `type` and `category`. |
| **Checklists** | `createChecklistItem` | `POST /checklists` | Invalidates `[{ type: 'Checklist', id: tripId }, 'Trip']` | Supports rapid Enter creation. |
| **Checklists** | `toggleChecklistItem` | `PATCH /checklists/:id` | Optimistic update via `onQueryStarted` | Instant checkbox toggle & strike-through animation. |
| **Checklists** | `markAllCompleted` | Batch `PATCH /checklists/:id` | Invalidates `[{ type: 'Checklist', id: tripId }, 'Trip']` | Sets `isCompleted: true` for all items in trip. |
| **Checklists** | `deleteChecklistItem` | `DELETE /checklists/:id` | Invalidates `[{ type: 'Checklist', id: tripId }, 'Trip']` | Deletes checklist entry. |

> [!NOTE]
> **Aggregated Metrics Synchronization:** Because `json-server` does not execute relational SQL joins or triggers, trip card summary metrics (`spentBudget`, `packedCount`, `totalChecklistCount`) are computed dynamically via memoized selectors combining `getTrips` with `expenses` and `checklists` queries (or updated alongside mutations) so that catalog cards always reflect real-time progress.

---

## 5. Detailed Functional Specifications by Screen

### 5.1 Screen 1: Trips Catalog & Dashboard (`/trips`)
**Objective:** Macro-level navigation, spatial-temporal orientation, filtering, and trip lifecycle management.

1. **Top Navigation Bar (`TopNavbar`):**
   - Brand identity ("WanderFlow" logo + icon).
   - Global search input (`"Search trips, places..."`) with 300ms debounce filtering by `title`, `location`, and `description`.
   - Primary CTA button `"+ Plan New Trip"` (`#0D9488`, hover `#0F766E`).
2. **Filter & Sort Toolbar:**
   - **Status Filter Pills:** `All`, `Upcoming` (`planned`), `Active` (`in_progress`), `Past` (`completed`).
   - **Sort Selector:** `By Date` (`startDate`), `By Budget` (`budgetLimit`), `Alphabetical` (`title`), plus Asc/Desc toggle.
   - **View Toggle:** `Grid View` (3 columns on Desktop `>=1024px`, 2 columns on Tablet `768–1023px`, 1 column on Mobile `<768px`) vs `Compact List View`.
3. **Trip Card (`TripCard`):**
   - **Visual Anchor:** Cover photo (`16:9` desktop, `3:2` mobile) with fallback gradient, overlaid with Destination Badge (`location`) and Duration Tag (`"Oct 12–20, 2026 • 8 Days"`).
   - **Metrics:**
     - Packing readiness progress bar (`"8/12 items packed"`).
     - Financial progress bar (`"$1,450 / $2,000 spent"` in `tabular-nums`), shifting to warning amber at `>=90%` and danger red (`#EF4444`) at `>100%`.
   - **Context Menu (`@radix-ui/react-dropdown-menu`):** Three-dots trigger offering `Edit`, `Duplicate`, and `Delete` (opening a two-step `@radix-ui/react-alert-dialog` confirmation).
4. **Empty State (`EmptyState`):**
   - Displayed when no trips exist or no trips match the active search/filter criteria.
   - Includes minimalist illustration, `"No journeys planned yet"` message, and `"+ Create your first trip"` CTA button.

---

### 5.2 Screen 2: Itinerary Workspace — Day-by-Day Timeline (`/trips/:tripId`)
**Objective:** Chronological day-by-day route planning and tactile Drag-and-Drop event reordering.

1. **Workspace Header (`WorkspaceHeader`):**
   - Back link to `/trips`, inline or modal-editable trip title, formatted date range subtitle, total budget status badge, and workspace tab/panel switchers.
2. **Sticky Day Ribbon (`StickyDayRail`):**
   - Automatically generates day slots (`Day 1 • Oct 12`, `Day 2 • Oct 13`, ... `Day N`) from `trip.startDate` and `trip.endDate`.
   - Displays each day's aggregated estimated event cost (`sum(events.cost)`).
   - Active day is highlighted with `#0D9488` border/indicator. Clicking a day scrolls to or filters that day's timeline.
3. **Timeline Canvas & Draggable Event Cards (`ItineraryTimelineWidget`):**
   - Left vertical chronological axis with circular timestamp nodes (`startTime`).
   - **Event Card Anatomy (`EventCard`):**
     - **Drag Handle:** Explicit 6-dot `GripVertical` icon on the left edge (`cursor: grab`, `cursor: grabbing` when active). Drag listeners attach strictly to this handle so text selection and action buttons remain unobstructed.
     - **Category Color Strip:** 4px left accent border + semantic icon badge:
       - `transport`: `#3B82F6` (Vibrant Blue)
       - `lodging`: `#8B5CF6` (Purple)
       - `activities`: `#10B981` (Emerald Green)
       - `dining`: `#F59E0B` (Warm Amber)
     - **Data Fields:** Time tag (`"09:30 - 10:45"`), bold title, location name/address with pin icon, booking reference badge (if present), tabular cost badge (`"$35.00"`), and expandable notes preview.
   - **Drag-and-Drop Interaction (`@dnd-kit`):**
     - Active dragged card renders via `DragOverlay` with elevated box-shadow and subtle `2deg` rotation (`transform: rotate(2deg)`).
     - Drop destination displays a prominent `2–3px` horizontal teal insertion line (`#0D9488`) or ghost placeholder preserving card geometry.
     - Mobile touch sensor requires either dragging the explicit grip handle or a `200ms` long-press delay to prevent scroll conflicts.
     - Full keyboard accessibility (`Space`/`Enter` to lift, `ArrowUp`/`ArrowDown` to move, `aria-live="assertive"` announcements).
   - **Inline Action:** Dashed container `"+ Add activity to Day X"` at the bottom of each day's list opening the `EventFormModal` pre-populated with that `dayIndex`.

---

### 5.3 Screen 3: Budget & Expenses Tracker
**Objective:** Real-time financial monitoring, category distribution analysis, and transaction logging.

1. **KPI Overview Row (3 Cards):**
   - **Total Budget:** Approved trip `budgetLimit` formatted in trip `currency`.
   - **Spent to Date:** Sum of all `Expense.amount` for the trip + linear progress bar:
     $$R = \frac{\sum E_i}{B_{\text{total}}} \times 100\%$$
     - $R < 90\%$: Emerald/Teal normal indicator (`#10B981` / `#0D9488`).
     - $90\% \le R \le 100\%$: Warm Amber warning indicator (`#F59E0B`).
     - $R > 100\%$: Crimson Red (`#EF4444`) with an explicit **Over-Budget Alert** banner.
   - **Remaining Balance:** $B_{\text{total}} - \sum E_i$ (displays negative deficit in `#EF4444` when over budget).
2. **Category Breakdown Panel:**
   - Horizontal progress meters showing percentage and monetary share per `ExpenseCategory` (`transport`, `lodging`, `dining`, `activities`, `shopping`, `insurance`, `other`) using semantic category colors.
3. **Transaction Ledger:**
   - Filter bar: text search by `title`/`notes`, category dropdown filter, and day filter (`All Days`, `Pre-Trip`, `Day 1..N`).
   - Responsive table/list displaying: Date, Transaction Title, Color-coded Category Badge, Associated Day tag, Payment Method (`Card`, `Cash`, `Apple Pay`), and bold tabular monospace amount (`font-variant-numeric: tabular-nums`).
   - Row actions: Edit and Delete expense.
4. **"Add / Edit Expense" Modal Dialog (`ExpenseFormModal`):**
   - Fields: Description (`title`), Amount (`amount`), Currency (`currency` defaulted to trip currency), Category picker (`category`), Associated Day (`dayIndex`), Date (`date`), Payment Method (`paymentMethod`), and Receipt Notes (`notes`).

---

### 5.4 Screen 4: Checklists & Packing Management
**Objective:** Eliminate forgotten items and unfulfilled pre-trip tasks via structured dual-column checklists.

1. **Summary Readiness Header:**
   - Displays overall completion metric (`"68% Packed & Ready — 15 of 22 items completed"`).
   - Full-width linear progress bar (`#0D9488` / `#10B981`).
   - Batch action button: `"Mark all completed"` (disabled when 100% complete).
   - Status filter pills: `All`, `Pending`, `Completed`.
2. **Dual-Column Workspace (2 Columns on Desktop, Segmented Tabs on Mobile):**
   - **Column 1 — Pre-Trip Tasks (`type: 'pretrip'`):** Grouped by `documents`, `bookings`, `insurance`, `tasks`.
   - **Column 2 — Luggage & Packing (`type: 'luggage'`):** Grouped by `clothes`, `gear`, `meds`.
3. **Checklist Item Anatomy (`ChecklistItemRow`):**
   - Accessible `@radix-ui/react-checkbox` control styled via `[data-state="checked"]`.
   - Item title + optional quantity badge (`"x3"`); when `isCompleted === true`, applies `text-decoration: line-through` and muted color `#94A3B8`.
   - Priority badge:
     - `high`: `"High Priority"` in soft crimson background (`#FEF2F2`, text `#EF4444`).
     - `normal`: subtle neutral badge.
     - `optional`: `"Optional"` in soft slate (`#F1F5F9`, text `#64748B`).
   - Delete icon button on hover/focus.
4. **Quick Entry Bar:**
   - Sticky/inline bottom input `"+ Add task or baggage item (Press Enter)"` with quick selectors for `type` (`pretrip` / `luggage`), `category`, and `priority`.

---

## 6. Form Validation Contracts (Zod Schemas)

All forms use `react-hook-form` with `zodResolver`. Validation errors render immediately below inputs with `role="alert"` and `aria-describedby`.

1. **`tripFormSchema`:**
   - `title`: `z.string().trim().min(2, 'Title must be at least 2 characters').max(100)`
   - `location`: `z.string().trim().min(2, 'Destination is required').max(100)`
   - `startDate`: `z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid start date required')`
   - `endDate`: `z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid end date required')`
   - Cross-field `.refine((data) => new Date(data.endDate) >= new Date(data.startDate), { message: 'End date cannot be earlier than start date', path: ['endDate'] })`
   - `budgetLimit`: `z.coerce.number().min(0, 'Budget must be 0 or greater')`
   - `currency`: `z.string().length(3, 'Use 3-letter ISO currency code (e.g. USD, EUR, ILS)')`
   - `coverImageUrl`: `z.string().url('Must be a valid URL').optional().or(z.literal(''))`
2. **`eventFormSchema`:**
   - `title`: `z.string().trim().min(2, 'Activity title is required').max(120)`
   - `category`: `z.enum(['transport', 'lodging', 'activities', 'dining'])`
   - `dayIndex`: `z.coerce.number().int().min(0)`
   - `startTime` / `endTime`: optional `HH:mm` regex; if both provided, `endTime >= startTime`.
   - `cost`: `z.coerce.number().min(0, 'Cost cannot be negative').optional()`
3. **`expenseFormSchema`:**
   - `title`: `z.string().trim().min(2, 'Description is required').max(120)`
   - `amount`: `z.coerce.number().positive('Amount must be greater than 0')`
   - `category`: `z.enum(['transport', 'lodging', 'dining', 'activities', 'shopping', 'insurance', 'other', 'accommodation', 'food'])`
   - `date`: `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)`
4. **`checklistItemSchema`:**
   - `title`: `z.string().trim().min(1, 'Item name is required').max(120)`
   - `type`: `z.enum(['pretrip', 'luggage'])`
   - `category`: `z.enum(['documents', 'bookings', 'insurance', 'clothes', 'gear', 'meds', 'tasks'])`
   - `priority`: `z.enum(['high', 'normal', 'optional']).default('normal')`
   - `quantity`: `z.coerce.number().int().min(1).max(99).default(1)`

---

## 7. Responsive Layout & Adaptive Behavior

| Viewport | Breakpoint | Layout Composition | Navigation Pattern | Dialog / Form Pattern |
| :--- | :--- | :--- | :--- | :--- |
| **Desktop** | `>= 1024px` | Split-View / 3-Column Workspace: Left Day Rail, Center Timeline/Main View, Right Context Panel (Budget/Checklist summary or tabbed workspace). | Top Navigation Bar + Left Sticky Rail | Centered Radix Dialog Modal (`max-width: 520px`, `--radius-xl: 16px`). |
| **Tablet** | `768px – 1023px` | 2-Column Workspace: Collapsible Icon/Day Rail + Tabbed Main Content (`Itinerary` \| `Budget` \| `Checklist`). | Top Navigation Bar + Workspace Tabs | Centered Modal (`max-width: 480px`). |
| **Mobile** | `< 768px` | Single-Column Stack (`100%` width, 8px spacing grid). | Fixed Bottom Navigation Bar (4 tabs: `Trips`, `Itinerary`, `Budget`, `Tasks` + central `+ FAB`). | Full-width Bottom Sheet (`border-radius: 16px 16px 0 0`, slide-up animation). |

---

## 8. Implementation Roadmap (Iteration 1 Phases)

### Phase 1: Foundation, Design Tokens & Mock API Setup
- Configure path aliases (`@app/*`, `@pages/*`, `@widgets/*`, `@features/*`, `@entities/*`, `@shared/*`) in `tsconfig` and `vite.config.ts`.
- Define global CSS tokens (`tokens.css`) matching `docs/architecture/DESIGN.md`.
- Populate `client/db.json` with comprehensive seed data (4 trips, multi-day events, expenses, checklists) and verify `json-server` script on port `3001`.
- Export strict TypeScript contracts in `@shared/types/domain.ts` and Zod schemas in `@shared/lib/validation`.

### Phase 2: Shared UI Kit (Radix UI Primitives + CSS Modules)
- Implement atomic components in `@shared/ui`: `Button`, `Input`, `Select`, `Dialog` (responsive modal/bottom-sheet), `AlertDialog`, `DropdownMenu`, `Tabs`, `Checkbox`, `Badge`, `ProgressBar`, `EmptyState`.
- Bind all interactive states (`[data-state="open"]`, `[data-state="checked"]`, `[data-disabled]`, `:focus-visible`) in `*.module.css`.

### Phase 3: RTK Query Data Layer & Store Configuration
- Configure `apiSlice` (`@shared/api/apiSlice.ts`) and inject domain endpoints (`tripsApi`, `eventsApi`, `expensesApi`, `checklistsApi`) with optimistic updates for event reordering and checklist toggling.
- Implement `uiSlice` for catalog filters, active workspace tab, active `dayIndex`, and modal controllers.

### Phase 4: Screen 1 — Trips Catalog & CRUD Flows
- Build `TripsCatalogPage`, `TopNavbar`, `TripFilterToolbar`, `TripCard` (Grid & List variants), `TripFormModal`, and two-step delete `AlertDialog`.

### Phase 5: Screen 2 — Itinerary Workspace & `@dnd-kit` Timeline
- Build `TripWorkspacePage`, `WorkspaceHeader`, `StickyDayRail`, `ItineraryTimelineWidget`, `EventCard` with explicit 6-dot drag handle, `@dnd-kit` sortable context with `DragOverlay`, and `EventFormModal`.

### Phase 6: Screen 3 & Screen 4 — Budget Tracker & Checklists
- Build `BudgetDashboardWidget` (KPI cards with Over-Budget Alert state, Category Breakdown bars, Transaction Ledger, `ExpenseFormModal`).
- Build `ChecklistBoardWidget` (Readiness header, "Mark all completed" action, Dual-Column Pre-Trip & Luggage lists, `ChecklistItemRow`, Quick Entry Bar).

### Phase 7: Responsive Polish, Accessibility & Testing
- Verify mobile Bottom Navigation Bar (`<768px`), keyboard Drag-and-Drop announcements (`aria-live`), tabular numeral alignment, and write Vitest + React Testing Library tests for critical flows.

