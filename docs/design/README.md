# Design System & Mockups: WanderFlow (Travel Organizer)

This directory contains UI mockups, design tokens, and interface specifications designed in **Stitch** (Project: `Travel Organizer`, ID: `15036372706394961715`).

---

## Directory Structure

```text
docs/design/
├── README.md                   # Table of contents and screen catalog
├── DESIGN.md                   # Full design token specification (Nordic Travel Workspace)
├── assets/                     # Graphic assets (SVG logos, icons, avatars)
│   ├── wanderflow-logo.svg
│   └── user-avatar-planner.png
└── mockups/
    ├── desktop/                # Desktop mockups (2560px)
    ├── tablet/                 # Tablet mockups
    └── mobile/                 # Mobile responsive mockups (390px / 780px)
```

---

## Screen Catalog & Exported Mockup Files

### 1. Desktop (`mockups/desktop/`)
| Source Screen in Stitch | Exported Filename | Purpose |
| :--- | :--- | :--- |
| `ab40ae7bc33f4e21a4c6dc52c9ad1c97` | `01-trips-catalog-dashboard.html` (`.png`) | Main trip catalog, KPI metric widgets, filters, trip cards |
| `de18f08e20eb4c9492aa019e0a83c96f` | `02-itinerary-workspace.html` (`.png`) | Day-by-day itinerary timeline, location cards, Drag & Drop |
| `39eccb69b6964a369a0e5daca968001f` | `03-budget-expenses-tracker.html` (`.png`) | Budget tracker, category breakdown, currencies, spend limits |
| `88ff7e5f8509405f82ce60303133a836` | `04-checklists-packing.html` (`.png`) | Packing checklists (documents, clothes, meds, gear, tasks) |

### 2. Tablet (`mockups/tablet/`)
| Source Screen in Stitch | Exported Filename | Purpose |
| :--- | :--- | :--- |
| `5a0f026f5d62410a995ec3c2b084b023` | `05-tablet-itinerary-light.html` (`.png`) | Tablet itinerary workspace (Light Mode) |
| `8ddbacc39ef74523a59defbc25153a1e` | `06-tablet-itinerary-dark.html` (`.png`) | Tablet itinerary workspace (Dark Mode) |

### 3. Mobile (`mockups/mobile/`)
| Source Screen in Stitch | Exported Filename | Purpose |
| :--- | :--- | :--- |
| `86706cb8d12440b19a6978c19db7c389` | `07-mobile-itinerary-light.html` (`.png`) | Mobile itinerary view (Light Mode) |
| `f205d68567d04e0fa47fe577c56ee270` | `08-mobile-itinerary-dark.html` (`.png`) | Mobile itinerary view (Dark Mode) |

### 4. Assets & Branding (`assets/`)
| Source Asset in Stitch | Exported Filename | Description |
| :--- | :--- | :--- |
| `c51531ae574441d1960dd805b53b7960` | `wanderflow-logo.svg` | Vector WanderFlow brand logo |
| `5828042900fd45fcb0b499d8dd8ee2cc` | `user-avatar-planner.png` | Nordic minimalist profile avatar |

---

## Style & Design System Summary

- **Theme Name**: *Nordic Travel Workspace*
- **Typography**: `Inter` (with OpenType `tnum` tabular numbers for financial figures and timestamps)
- **Primary Brand Accent**: `#0D9488` (Teal)
- **Logistical Category Colors**:
  - Transport: `#3B82F6` (Blue)
  - Lodging: `#8B5CF6` (Purple)
  - Activities: `#10B981` (Green / Success)
  - Dining: `#F59E0B` (Amber)
  - Danger / Over-budget: `#EF4444` (Red)
