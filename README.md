# WanderFlow — Travel Organizer & Itinerary Planner

A modern, full-featured travel planning, cascaded itinerary scheduling, multi-currency budget tracking, and packing checklist application built with **React 19**, **TypeScript 6**, **Vite 8**, **Redux Toolkit (RTK Query)**, and **Feature-Sliced Design (FSD)**.

> [!WARNING]
> **Docker and Production Status:**
> The Docker configuration (`docker-compose.yml`) and production deployment pipelines are **currently unverified and not tested**. Please run the application using the local two-terminal development setup described below.

---

## Key Features

### 1. Trip Catalog & Lifecycle Management
- **Dynamic Date-Derived Statuses:** Trip lifecycle states (`planned`, `in_progress`, `completed`) are automatically derived from local calendar dates (`startDate` / `endDate`), while `cancelled` acts as an explicit manual override.
- **URL-Synchronized Catalog:** Search query, status filter, date range bounds, sort field/direction, and pagination are synchronized with URL query parameters (`?q=`, `?status=`, `?from=`, `?to=`, `?sort=`, `?dir=`, `?page=`) for bookmarkable and shareable views.
- **Transactional Operations:** Deep trip cloning (`useDuplicateTrip`) includes compensating rollback if child entity duplication fails, and cascade deletion (`useDeleteTrip`) removes child events, expenses, and checklist items before deleting the parent trip.

### 2. Interactive Itinerary Workspace & Cascaded Timeline Engine
- **Configurable Day Time Windows:** Each trip day has its own customizable **Day Start** (default `08:00`) and **Target End** (default `22:00`) bounds persisted in `Trip.daySchedules`, with real-time estimated finish calculation and overrun warnings.
- **Cascaded Sequential Scheduling:** Users configure the **stay duration (`durationMinutes`)** for each stop, while the engine automatically calculates travel distance and transit time (`walk` or `transit` mode) between consecutive stops using Haversine GPS geometry.
- **Accessible Drag-and-Drop Reordering:** Powered by `@dnd-kit` with keyboard and pointer support and a per-trip serialized write queue. Reordering stops preserves each stop's user-configured stay duration while immediately recalculating inter-stop transit legs and arrival/departure times along the entire chain.
- **Overnight Carry-Over Mechanics:** Stops that cross midnight (`departure > 24:00`) automatically produce a **Continued from Day N** carry-over banner at the top of Day $N+1$, shift Day $N+1$'s effective start time when the overnight activity ends after the planned morning start, and use the overnight stop's coordinates as the geographic origin for Day $N+1$'s first transit leg.
- **Geographic Route Graph & Optimization:** The route map projects real `(lat, lng)` coordinates into relative geographic positions on the viewport and renders a directed SVG route graph (`svgSegments` with arrowheads) that dynamically re-wires as cards are reordered. Includes a nearest-neighbor **Optimize Route** action to minimize total travel distance.

### 3. Multi-Currency Budget & Financial Analytics
- **Live Currency Conversion:** Supports multi-currency expenses converted into the trip's base currency (`USD`, `EUR`, `GBP`, `JPY`, `AUD`, etc.).
- **Uncapped Budget States:** Tracks `ok`, `warning` ($\ge 80\%$), `over` ($> 100\%$), and `unconstrained` states without masking over-budget deficits, alongside daily burn-rate metrics, category allocations, and CSV ledger export.

### 4. Preparation & Packing Checklists
- **Dual-Track Organization:** Separate `pretrip` preparation tasks and `luggage` packing lists grouped by category (`documents`, `bookings`, `insurance`, `clothes`, `gear`, `meds`, `tasks`).
- **Optimistic Updates & Resilient Batch Actions:** Instant checkbox toggles with automatic rollback on network error, plus `Promise.allSettled` batch operations (check all, uncheck all, template import, clear completed).

### 5. Accessibility & Engineering Quality
- **Accessible UI Primitives:** Built on `@radix-ui/react-dialog`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tabs`, `@radix-ui/react-checkbox`, and `@radix-ui/react-toast`, with `useId()`-linked form controls (`aria-invalid`, `aria-describedby`, `role="alert"`).
- **Strict Static Analysis & Test Coverage:** Zero-warning/zero-error enforcement via `oxlint` (including `typescript/no-explicit-any: error`) and 25 unit/component test suites powered by Vitest and React Testing Library.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Runtime & Bundler** | Node.js (`^20.19` or `>=22.12`), Vite 8, TypeScript ~6.0 |
| **UI & Styling** | React 19, CSS Modules with Design Tokens, Radix UI, Lucide React |
| **State & Data Fetching** | Redux Toolkit 2, RTK Query, Listener Middleware (`sessionListenerMiddleware`) |
| **Forms & Validation** | React Hook Form 7, Zod 4 (`@hookform/resolvers`) |
| **Drag & Drop** | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |
| **Linting & Testing** | Oxlint, Vitest 4, React Testing Library, JSDOM |
| **Mock Backend** | `json-server` (`client/db.json`) |

---

## Project Architecture (Feature-Sliced Design)

All frontend source code resides in `client/src/` and strictly follows FSD layer boundaries using path aliases (`@app/*`, `@pages/*`, `@widgets/*`, `@features/*`, `@entities/*`, `@shared/*`):

```text
client/
├── db.json                        # Local REST mock database (json-server)
├── refreshMockDates.js            # Utility to shift seed trip dates relative to today
└── src/
    ├── app/                       # Redux store, router, layouts, ProtectedRoute, ErrorBoundary
    ├── pages/                     # Route pages: TripsPage, TripDetailsPage, BudgetPage, ChecklistsPage, Auth
    ├── widgets/                   # Composite workspaces: ItineraryWorkspace, BudgetWorkspace, ChecklistWorkspace
    ├── features/                  # User interactions & forms: auth, trip/itinerary/expense/checklist management
    ├── entities/                  # Domain models & pure logic: trip, itinerary (cascade & geo engine), expense, session
    └── shared/                    # Modular RTK Query APIs, reusable UI kit, date/currency/error libs, domain types
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) (`^20.19` or `>=22.12` recommended)
- [npm](https://www.npmjs.com/) (v10+ recommended)

---

## Development Setup

> [!IMPORTANT]
> There is no `package.json` in the repository root — all commands must be run inside the `client/` directory (or prefixed with `npm --prefix client`).
> Running the application locally requires **two separate terminal tabs/windows**: one for the `json-server` mock API and one for the Vite dev server.

### 1. Install Dependencies

```bash
cd client
npm install
```

### 2. Start the Mock API Server (Terminal 1)

In your **first terminal**, start `json-server` (watches `client/db.json` on port `3001` with a 400ms simulated latency):

```bash
cd client
npm run mock-api
```

- Mock REST API URL: `http://localhost:3001`
- *(Optional)* To refresh seed trip dates relative to the current date, run `npm run seed:refresh` inside `client/`.

### 3. Start the Frontend Dev Server (Terminal 2)

Open a **second terminal** and launch the Vite development server:

```bash
cd client
npm run dev
```

- Frontend URL: `http://localhost:5173` (or the next available port printed in the terminal)

---

## Available Scripts

Execute all scripts from the `client/` directory (or from the root via `npm --prefix client run <script>`):

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `vite` | Starts the Vite development server with HMR |
| `npm run mock-api` | `json-server --watch db.json --port 3001 --delay 400` | Starts the local REST mock backend on port `3001` |
| `npm run seed:refresh` | `node refreshMockDates.js` | Shifts seed dates in `db.json` relative to today |
| `npm run lint` | `oxlint` | Runs fast static analysis across all TypeScript/React files |
| `npm run test` | `vitest run` | Executes all 25 unit and component test suites once |
| `npm run test:watch` | `vitest` | Runs Vitest in interactive watch mode |
| `npm run build` | `tsc -b && vite build` | Type-checks and builds the production bundle into `client/dist/` |
| `npm run preview` | `vite preview` | Locally previews the production build |
