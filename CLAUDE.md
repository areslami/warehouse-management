# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a warehouse management ERP system for "Shams" with a Django REST Framework backend and Next.js frontend. The application manages inventory, B2B sales, finance operations (proformas), and warehouse operations (receipts, dispatch, delivery). The UI is in Persian (RTL layout) and uses Jalaali (Persian) calendar dates.

## Development Commands

### Backend (Django)

```bash
cd back
python manage.py runserver
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

**Backend runs on port 8000** by default.

### Frontend (Next.js)

```bash
cd front
npm run dev     # Development server (port 3000)
npm run build   # Production build
npm run start   # Production server
npm run lint    # Run ESLint
```

## Architecture Overview

### Monorepo Structure

- `/back/` - Django backend
- `/front/` - Next.js frontend

### Backend Architecture (Django)

**Four main Django apps:**

1. **core** - Foundation entities

   - Models: Product, Supplier, Receiver, Customer, ShippingCompany
   - Constants defined in `core/models/base.py`: PARTY_TYPES, TRANSACTION_TYPES, VEHICLE_TYPES, STATUS_TYPES

2. **warehouse** - Inventory management

   - Models: Warehouse, WarehouseReceipt, DispatchIssue, DeliveryFulfillment
   - Tracks inventory movements (receipts, dispatches, deliveries)

3. **finance** - Financial documents

   - Models: PurchaseProforma, SalesProforma, Invoice
   - Manages proforma invoices for purchases and sales

4. **b2b** - B2B sales operations
   - Models: B2BOffer, B2BDistribution, B2BSale, B2BAddress
   - Excel export/import functionality with Persian field mappings in `b2b/excel_config.py`
   - Three export formats: Sale (Distributor), Sale (Your), Address

**Database:** PostgreSQL (`shams-erp` database, user: `pguser`)

**Settings:** `back/erp_backend/settings.py`

- CORS enabled for local development
- REST Framework with JSONRenderer only
- Development credentials are in settings (NOT for production)

### Frontend Architecture (Next.js 15)

**Key Technologies:**

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui components
- next-intl for i18n (Persian)
- react-hook-form + zod for forms
- sonner for toasts
- moment-jalaali for Persian dates

**Core Architectural Patterns:**

1. **Global State Management** (`src/lib/core-data-context.tsx`)

   - `CoreDataProvider` wraps the entire app
   - Provides: customers, suppliers, products, receivers, shippingCompanies, warehouses, purchaseProformas, salesProformas
   - Methods: `updateData`, `addItem`, `updateItem`, `deleteItem`, `refreshData`
   - Fetches all core data on mount and provides centralized CRUD operations
   - Access via `useCoreData()` hook

2. **Modal Management** (`src/lib/modal-context.tsx`)

   - `ModalProvider` for programmatic modal rendering
   - Use `useModal()` hook to get `openModal(Component, props)` and `closeModal()`
   - Modals stack with increasing z-index
   - All forms use modals (not separate pages)

3. **API Client** (`src/lib/api/`)

   - `api-client.ts`: Core `apiFetch()` function handles all HTTP requests
   - Automatic error handling with toast notifications
   - API base URL determined by `config.ts`: defaults to `http://{hostname}:8000/`
   - Domain-specific API files: `core.ts`, `warehouse.ts`, `finance.ts`, `b2b.ts`, `excel.ts`

4. **Layout Structure** (`src/app/layout.tsx`)

   - Root layout wraps app with: NextIntlClientProvider → CoreDataProvider → ModalProvider → SidebarProvider
   - Vazirmatn font (Arabic/Persian)
   - RTL direction
   - ToastProvider for sonner notifications

5. **Navigation** (`src/components/app-sidebar.tsx`)

   - Collapsible sidebar with nested sections
   - Main sections: Products, Parties, Warehouse, B2B, Finance
   - Each subsection has hover-to-show "+" buttons that open create modals
   - Uses lucide-react icons

6. **Page Structure**

   - Main pages: `/products`, `/parties`, `/warehouse`, `/b2b`, `/finance`
   - Tab-based interfaces (e.g., `/warehouse?tab=receipts`)
   - Component tabs: `WarehouseReceiptTab`, `DispatchIssueTab`, `DeliveryFulfillmentTab`, etc.

7. **TypeScript Interfaces** (`src/lib/interfaces/`)
   - Mirror backend models exactly
   - `core.ts`, `warehouse.ts`, `finance.ts`, `b2b.ts`

### Excel Export/Import System

**Backend:** (`back/b2b/excel_config.py`, `back/b2b/excel_views.py`)

- Persian field mappings for three formats
- Uses pandas + openpyxl
- Handles Jalaali date conversions with `jdatetime`

**Frontend:** (`src/lib/excel-mappings.ts`, `src/lib/api/excel.ts`)

- Header definitions match backend mappings
- Export functions trigger backend endpoints that return Excel files

## Key Development Patterns

### Creating New Entities

1. **Backend:** Add model to appropriate app, create serializer, add viewset, register URL
2. **Frontend:**
   - Add TypeScript interface to `src/lib/interfaces/`
   - Add API functions to appropriate `src/lib/api/` file
   - Add to CoreDataContext if it's a core entity
   - Create modal component in `src/components/modals/`
   - Add to sidebar if needed

### Form Pattern

All forms use:

- `react-hook-form` with `@hookform/resolvers/zod`
- `zod` schemas for validation
- Modal dialogs (shadcn/ui `Dialog`)
- Persian date pickers (`src/components/ui/persian-date-picker.tsx`)
- Searchable selects for relationships (`src/components/ui/searchable-select.tsx`)

### Date Handling

- Backend: Stores dates as Django DateField (ISO format)
- Frontend: Displays Persian calendar using `moment-jalaali`
- `persian-date.ts` utilities for conversion
- `PersianDateTableCell` component for table displays

### Error Handling

- Backend: DRF returns structured errors
- Frontend: `error-handler.ts` + `error-toast-handler.ts` parse errors and show toasts
- API client automatically shows error toasts unless `showError: false`

## Important Notes

- **Database credentials in settings.py are for development only** - never commit production secrets
- All text/labels are in Persian - translations in `src/messages/fa.json`
- API assumes backend on port 8000, frontend on port 3000
- Forms validate before submission (zod schemas)
- Toast notifications use sonner (imported from `src/lib/toast-helper.ts`)
- B2B operations have special Excel import/export workflows with Persian headers
- Vehicle types: "single", "double", "trailer"
- Transaction types: "cash", "credit", "agreement", "other"
- Party types: "individual", "corporate"

## Code Conventions

- Frontend: camelCase for variables, PascalCase for components
- Backend: snake_case following Django conventions
- React components are client components (`"use client"`) where needed
- API functions return `Promise<T | null>` and may throw errors
- Modal submit handlers should re-throw errors to prevent modal from closing on failure
