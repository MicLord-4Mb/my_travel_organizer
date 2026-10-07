# 01. System Architecture & Scalability Blueprint

## 1. System Concept and Evolution

The "Travel Organizer" project is built on an **Offline-First principle with subsequent hybrid cloud synchronization**.

* **Stage 1 (Current):** Standalone SPA. All business logic executes in the browser. Storage: Mock REST API via `json-server` and RTK Query (replaced LocalStorageAdapter).
* **Stage 2 (Target Production):** Multi-tenant SaaS. Microservices/Monolith (Node.js/Python), PostgreSQL for relational data (trips, days, budget), S3 for media (location photos), Redis for sessions and caching, WebSockets for real-time collaborative trip editing.

## 2. Frontend Architecture (Feature-Driven / Light-FSD)

The client-side code (`client/src`) is divided into independent, loosely coupled layers:

```
client/src/
├── app/                  # App initialization, providers (Redux, Router), global styles
├── pages/                # Pages (React Router routes): TripsPage, TripDetailsPage, NotFoundPage
├── widgets/              # Composite blocks (Header, Sidebar, TripTimelineWidget, BudgetSummaryWidget)
├── features/             # Business scenarios and user actions
│   ├── trip-management/  # Trip creation, editing, and deletion
│   ├── itinerary-management/ # Drag-and-drop route sorting
│   ├── expense-management/   # Budget and transaction management
│   ├── checklist-management/ # Task filtering and search
├── entities/             # Domain entities (UI cards, base selectors, data slices)
│   ├── trip/             # Trip model, trip card
│   ├── itinerary/        # Day schedule and events model
│   ├── expense/          # Expense model
│   └── checklist/        # Checklist item model
└── shared/               # Reusable foundation without business logic
    ├── api/              # RTK Query apiSlice and REST endpoints
    ├── ui/               # UI Kit (Button, Input, Modal, Dropdown, Card, Loader)
├── lib/              # Utilities (date formatting, currency calculation, drag-and-drop helpers)
└── types/            # Common base types (ID, Timestamps, SortOrder)
```
