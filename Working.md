# eHMS — Project Working Document

> **Enterprise Hospitality Management System**
> Full progress log from project start to current state.
> Last updated: 27 June 2026

---

## Project Overview

| Item | Detail |
|---|---|
| **Project** | eHMS — Enterprise Hospitality Management System |
| **Stack** | Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · NeonDB (PostgreSQL) |
| **Architecture** | **Schema-per-Tenant Multi-Tenancy** — each tenant in isolated PostgreSQL schema |
| **Primary Tenant** | Viswa Group of Estates (schema: `viswa`) |
| **Local dev** | `http://localhost:3000` |
| **Live URL** | https://ehms-app.vercel.app |
| **Vercel project** | https://vercel.com/aiservicesselvakumar-8945s-projects/frontend |
| **Git** | https://github.com/selva-aiprojects/ehms.git |
| **Database schemas** | `d:\Training\working\HMS\database\` (26 SQL files: 025 migrations + seed_v4_full; fixes: 19 schema-mismatch bugs corrected in seed_v4_full) |


---

## Domain & Workflow Overview

eHMS is a **subscription-based** Enterprise Hospitality and Facilities Management system serving four major verticals:
1. **Hotels**
2. **Serviced Apartments**
3. **Apartment Management (Long-term Rental)**
4. **Workplace Services Management**

### Vertical Isolation Architecture (Per-Workspace Modules)

Each business vertical operates as a **strictly isolated context** with its own operational workflows:

| Module | Vertical-Scoped | Shared Across Verticals |
|--------|:-:|:-:|
| **HRMS** (Employees, Payroll, Leave, Appraisal) | ✅ Per-vertical (staff assigned to specific property) | — |
| **Accounts/Finance** (Invoicing, GL, Reconciliation) | ✅ Per-vertical (property-level P&L) | Consolidated org view |
| **Vendors** (Procurement, Contracts, POs) | ✅ Per-vertical (service agreements per property) | — |
| **Housekeeping** (Tasks, Linen, Inspections) | ✅ Per-vertical (rooms/units belong to one vertical) | — |
| **Maintenance** (Tickets, AMC, Parts, Assets) | ✅ Per-vertical (assets tied to vertical property) | — |
| **Front Desk** (Check-in/out, Guest Mgmt) | ✅ Per-vertical (Hotels, Apartments) | — |
| **Admin/Masters** (Properties, Users, Roles) | — | ✅ Shared |

**Implementation:** All queries filter by `property_id` which inherently scopes operations to the correct vertical. The Journey Switcher on login determines the active vertical context, and the sidebar/navigation dynamically filters to show only relevant modules.

### The Complete End-to-End Workflow:
1. **OTAs & Bookings:** Hospitality vendors/OTAs (e.g., MakeMyTrip, GoIbibo) and end-users initiate the journey via advanced bookings or walk-ins. Features, grades, and levels are dictated by the price/tier of the room/flat.
2. **Visitor Management:** Once booked, guests/visitors are formally checked in through the **Frontdesk** with comprehensive visitor management.
3. **Facilities Management:** The guest's presence triggers downstream operational workflows. **Facilities administrators**, **Housekeeping** (cleaning, linen, inspections), and **Maintenance** (repairs, AMC, parts) collaborate to maintain the property. Maintenance incorporates vendor availability and repair planning with approval workflows.
4. **Back-Office Processes:** All operational tasks are tied back to **HR processes** (employee attendance, shift rotations, salary processing, appraisal) and an integrated **Finance workflow** (ledger, invoices, payments, reconciliation, vendor payables).

---

## Project Structure

```
d:\Training\working\HMS\
├── database/
│   ├── 001_core_schema.sql          ← Enterprises, properties, units, assets
│   ├── 002_rbac_identity.sql        ← Users, roles, RLS, audit log
│   ├── 003_guest_crm.sql            ← Guest profiles, corporate accounts
│   ├── 004_reservation_booking.sql  ← Bookings, rate plans, OTA channel sync
│   ├── 005_finance_gl.sql           ← GL, invoices, payments, bank reconciliation
│   ├── 006_housekeeping.sql         ← Tasks, checklists, linen batches
│   ├── 007_maintenance_asset.sql    ← Tickets, asset register
│   ├── 008_vendor_procurement.sql   ← Vendor orders, POs
│   ├── 009_hrms_payroll.sql         ← Employees, attendance, payroll runs
│   ├── 010_lease_tenancy.sql        ← Leases, rental agreements
│   ├── 011_workplace.sql            ← Desks, memberships, access control
│   ├── 012_notification_integration.sql
│   ├── 013_master_data_dictionaries.sql ← Room categories, facilities, designations, bands
│   ├── 014_frontdesk_operations.sql ← Check-in checklists, parking, guest requests, billing
│   ├── 015_fnb_module.sql           ← Meal plans, F&B menu, orders, order items
│   ├── 016_system_settings.sql      ← System configuration table
│   ├── 017_hrms_extensions.sql      ← Leave types, leave requests, balances, timesheets
│   ├── 018_masters_and_policies.sql ← Holidays, OT policies, attendance policies, doc types,
│   │                                    policy documents, appraisals, increments, promotions,
│   │                                    tax slabs, payment modes, booking sources, rate plans,
│   │                                    ID proof types, asset categories, UOM, geo data
│   ├── 019_housekeeping_maintenance_workflows.sql ← Linen items, inspections, ticket parts,
│   │                                    time entries, approvals
│   ├── 020_admin_module.sql         ← System sessions, login attempts, backup jobs,
│   │                                    audit events, admin notifications
│   ├── 021_accounts_module.sql      ← Fiscal years, cost centers, vendor bills,
│   │                                    fixed assets, budget, tax filings
│   ├── 022_inventory_module.sql     ← Inventory categories, items, warehouses, transactions
│   ├── 023_multi_tenant_sharding.sql← Schema-per-tenant (viswa shard), tenant registry
│   └── 025_property_config_features.sql ← Property config JSONB schema with 10 feature toggles
│
│   └── seed_v4_full.sql             ← Comprehensive demo data (all workflows, 4 properties)
│
└── frontend/   ← (also mirrored at repo root)
    ├── app/
    │   ├── page.tsx                 ← Login with 8 demo users (all roles)
    │   ├── layout.tsx               ← suppressHydrationWarning on <body>
    │   ├── globals.css              ← eHMS CSS design tokens
    │   ├── dashboard/
    │   │   ├── layout.tsx           ← AuthProvider wrapper
    │   │   ├── page.tsx             ← Executive dashboard (live data)
    │   │   ├── front-desk/          ← Room matrix + check-in/out (625 lines)
    │   │   ├── housekeeping/        ← Task mgmt + quality checklist (525 lines)
    │   │   ├── maintenance/         ← Tickets + AMC + parts (554 lines)
    │   │   ├── finance/             ← P&L + invoices + reconciliation (505 lines)
    │   │   ├── hr/                  ← Employees + shifts + compliance (503 lines)
    │   │   ├── hotels/              ← Property portfolio + performance (517 lines)
    │   │   ├── apartments/          ← Service apartment portfolio (506 lines)
    │   │   ├── rental/              ← Leases + rent roll (509 lines)
    │   │   ├── workplace/           ← Floor plan + memberships (511 lines)
    │   │   ├── admin/               ← System admin + compliance (503 lines)
│   │   ├── page.tsx          ← Admin dashboard (Overview/User Mgmt/Compliance/Audit)
│   │   ├── roles/            ← Role & permission management
│   │   ├── audit/            ← Audit trail viewer
│   │   ├── backup/           ← Backup & restore management
│   │   └── masters/          ← App-wide master dictionaries
│   └── properties/            ← Property workspace management (CRUD)
    │   └── api/                     ← Next.js Route Handlers
    │       ├── auth/login/          ← pgcrypto + bcrypt dual-verify
    │       ├── auth/logout/
    │       ├── auth/me/             ← JWT token verification
    │       ├── dashboard/stats/
    │       ├── reservations/
    │       ├── reservations/[id]/
    │       ├── guests/
    │       ├── housekeeping/
    │       ├── housekeeping/[id]/
    │       ├── maintenance/
    │       ├── finance/
    │       ├── hr/employees/
    │       ├── properties/
    │       │   ├── route.ts           ← CRUD properties
    │       │   └── [id]/route.ts      ← Single property get/put/delete
    │       ├── admin/
    │       │   ├── users/route.ts     ← Admin user CRUD
    │       │   ├── users/[id]/route.ts
    │       │   ├── compliance/route.ts← Compliance CRUD
    │       │   ├── compliance/[id]/route.ts
    │       │   ├── roles/route.ts     ← Roles & permissions
    │       │   ├── sessions/route.ts  ← Active session management
    │       │   ├── backup/route.ts    ← Backup/restore operations
    │       │   └── audit-events/route.ts ← Audit event log
    │       ├── visitors/
    │       ├── workplace/
    │       └── leases/
    ├── components/
    │   ├── layout/
    │   │   ├── sidebar.tsx          ← Role-based nav filtering
    │   │   ├── header.tsx           ← Profile dropdown + logout
    │   │   └── mobile-nav.tsx
    │   ├── dashboard/
    │   │   └── kpi-card.tsx
    │   └── ui/
    │       ├── card.tsx, button.tsx, badge.tsx, table.tsx
    ├── lib/
    │   ├── db.ts                    ← NeonDB serverless connection (DATABASE_URL)
    │   ├── auth.ts                  ← JWT sign/verify + bcrypt helpers
    │   ├── auth-context.tsx         ← Auth context + useAuth hook
    │   ├── role-access.ts           ← RBAC access map + demo role mapping
    │   ├── reference-constants.ts   ← Shared UI constants + utilities
    │   ├── hooks/
    │   │   ├── index.ts             ← All SWR data hooks
    │   │   └── mutations.ts         ← CRUD mutation hooks
    │   └── supabase/                ← Legacy (kept for reference, not used)
    ├── middleware.ts                 ← JWT-based RBAC middleware wrapper calling proxy.ts
    ├── proxy.ts                      ← Core middleware logic (exclude _next/ from matcher)
    ├── .env.local                   ← DATABASE_URL + JWT_SECRET
    └── public/
        ├── eHMS_logo.png
        └── eHMS Theme settings.png
```

---

## Step 1 — eHMS Theme Alignment

### Problem
Project was using old "SAMP" branding (dark navy `#0E243D`) — didn't match the reference `eHMS Theme settings.png`.

### Color Palette — Before vs After

| Token | Before (SAMP) | After (eHMS) |
|---|---|---|
| Sidebar background | `#0E243D` navy | `#2C3547` charcoal |
| Primary accent | `#2A9D8F` | `#2BAE8E` |
| Secondary green | — | `#4DB88A` |
| Dark navy (headings) | `#0E243D` | `#1A3C5E` |
| Body text | `#1A2332` | `#1A2E44` |
| Muted text | `#6B7A8D` | `#64748B` |
| Page background | `#F4F6F8` | `#F5F7FA` |
| Card border | `#DEE2E6` | `#E2E8F0` |

### How it was done
- Used a PowerShell bulk-replace script to swap all old hex values across **18 files** simultaneously
- Updated `globals.css` CSS variables and Tailwind `@theme` tokens
- All components, pages, sidebar, header updated

---

## Step 2 — Logo Integration

`public/eHMS_logo.png` was already present (shield/building icon + eHMS wordmark).

| Location | Size |
|---|---|
| Sidebar (expanded) | `120×80px` |
| Sidebar (collapsed) | `36×36px` icon-only |
| Login page left panel | `140×56px` |
| Login page mobile | `100×40px` |

Used `next/image` with `priority` flag for optimal LCP.

---

## Step 3 — Dashboard Redesign

### Sidebar
- Simplified to **primary nav items**: Dashboard, Front Desk, Hotels, Apartments, Rental, Workplace, Housekeeping, Maintenance, Finance, HRMS, Admin
- **Active state**: `3px solid #2BAE8E` left border + `rgba(255,255,255,0.10)` white bg
- Floating teal collapse toggle button on right edge
- Role-based filtering — each item shows only for permitted roles

### Header
- **Left**: Hamburger `≡` icon
- **Centre**: Rounded pill search bar
- **Right**: Bell with red `1` badge + circular avatar with teal ring (Joan Smith / User Manager)

### Dashboard Page
- **3 KPI cards**: Total Revenue, Active Reservations, Total Guests (with teal circle icons)
- **Full-width SVG line chart**: Area chart of revenue trend, month labels, grid lines
- **Bottom row (3 columns)**:
  - Reservations donut (occupancy %)
  - Guests donut (currently staying vs total)
  - Quick Actions panel (links to all modules)

---

## Step 4 — Vercel Deployment

### Steps taken
1. Verified Vercel CLI v50.18.2 already installed
2. `npm run build` → 13 routes, 0 TypeScript errors
3. `git add -A && git commit`
4. `vercel login` → device auth via browser
5. `vercel --yes` → auto-detected Next.js, deployed

### Build result
- Compiled in 5.7s
- 15 static pages generated
- Zero errors

### URLs
| | URL |
|---|---|
| Deployment | https://frontend-phi-peach-t78dm4t7ea.vercel.app |
| Inspect | https://vercel.com/aiservicesselvakumar-8945s-projects/frontend/CsJMeDn7DkfUv3utt1gqJ6UysbnE |
| Project settings | https://vercel.com/aiservicesselvakumar-8945s-projects/frontend/settings |

---

## Step 5 — Custom Vercel Domain (ehms-app.vercel.app)

```bash
vercel alias set frontend-phi-peach-t78dm4t7ea.vercel.app ehms-app.vercel.app
```

**Live URL: https://ehms-app.vercel.app**

---

## Step 6 — Database Migration: Supabase → NeonDB ✅

### Why NeonDB?
- Serverless PostgreSQL with auto-scaling — zero idle cost
- Native `@neondatabase/serverless` driver for edge-compatible SQL
- Fully compatible with all 12 existing SQL schemas (PostgreSQL 16)
- Supports: `uuid-ossp`, `pgcrypto`, `GENERATED ALWAYS AS`, indexes, RLS
- Single `DATABASE_URL` connection string — simpler than Supabase's 3 keys
- Connection pooling via Neon's built-in pooler (`?sslmode=require`)

### Migration completed
- Removed Supabase client usage from all active API routes
- `lib/db.ts` — new NeonDB singleton using `@neondatabase/serverless`
- `lib/auth.ts` — JWT-based auth replaces Supabase Auth
- All 12 SQL schemas + seed data loaded into Neon project

### Current `.env.local` structure
```env
# eHMS — Environment Variables
DATABASE_URL=postgresql://neondb_owner:<password>@ep-<slug>-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require

# JWT Secret — generate with: openssl rand -hex 32
JWT_SECRET=ehms-dev-jwt-secret-do-not-use-in-production-change-this

# Resend (transactional emails) — lazy-initialized; skip gracefully if missing
RESEND_API_KEY=re_...
RESEND_FROM=eHMS Workspace Onboarding Team <onboarding@cognivectra.com>
```

### Architecture (current)
```
Browser → SWR Hook → fetch() → Next.js API Route → NeonDB (serverless SQL)
                                                            │
                                                  PostgreSQL 16 tables
                                                  (Neon cloud, US-East-1)
```

### Data Layer (`lib/db.ts`)
```typescript
import { neon } from "@neondatabase/serverless";
export function getDb() { /* cached singleton */ }
```

### Auth Architecture (JWT-based)
```
POST /api/auth/login
  ├── Demo users (@ehms.demo): verify via pgcrypto crypt() in SQL
  ├── Regular users: compare via bcryptjs
  └── Issues httpOnly JWT cookie "ehms_token" (7 days)

GET /api/auth/me
  └── Reads + verifies JWT cookie → returns UserProfile

POST /api/auth/logout
  └── Clears "ehms_token" cookie

middleware.ts
  └── Calls proxy(request) from proxy.ts (verifies JWT, validates paths, handles redirects)
```

### API Routes (`app/api/`)

| Route | Methods | Key Tables |
|---|---|---|
| `/api/auth/login` | POST | `users`, `user_roles`, `roles` |
| `/api/auth/me` | GET | JWT cookie verify |
| `/api/auth/logout` | POST | Cookie clear |
| `/api/dashboard/stats` | GET | `bookings`, `payments`, `units`, `guest_profiles` |
| `/api/reservations` | GET, POST | `bookings`, `units`, `guest_profiles`, `properties` |
| `/api/reservations/[id]` | GET, PUT, DELETE | `bookings` + unit status sync |
| `/api/guests` | GET, POST | `guest_profiles` |
| `/api/housekeeping` | GET, POST | `housekeeping_tasks`, `units` |
| `/api/housekeeping/[id]` | PUT | `housekeeping_tasks`, `units` |
| `/api/maintenance` | GET, POST | `maintenance_tickets`, `units` |
| `/api/finance` | GET | `invoices`, `payments` |
| `/api/leases` | GET | `leases` + optional filters |
| `/api/properties` | GET | `properties` + occupancy calc |
| **HR API Routes** | | |
| `/api/hr/employees` | GET, POST | `employees`, `departments`, `users` |
| `/api/hr/employees/[id]` | GET, PUT | `employees` |
| `/api/hr/departments` | GET, POST | `departments` |
| `/api/hr/shifts` | GET, POST | `shifts` |
| `/api/hr/timesheets` | GET, POST | `timesheets` |
| `/api/hr/timesheets/[id]` | PUT | `timesheets` (clock-out) |
| `/api/hr/leaves` | GET, POST | `leave_requests`, `leave_balances` |
| `/api/hr/leaves/[id]` | PUT | `leave_requests` (approve/reject) |
| `/api/hr/payroll` | GET, POST | `payroll_runs`, `payroll_items` |
| `/api/hr/payroll/[id]` | GET, PUT | `payroll_runs` |
| `/api/hr/compliance` | GET | PF/ESI/PT/TDS aggregation |
| `/api/hr/holidays` | GET, POST | `holiday_calendar` |
| `/api/hr/overtime-policies` | GET, POST | `overtime_policies` |
| `/api/hr/attendance-policies` | GET, POST | `attendance_policies` |
| `/api/hr/document-types` | GET, POST | `document_types` |
| `/api/hr/policy-documents` | GET, POST | `policy_documents` |
| `/api/hr/appraisal-cycles` | GET, POST | `appraisal_cycles` |
| `/api/hr/appraisal-reviews` | GET, POST | `appraisal_reviews` |
| `/api/hr/appraisal-goals` | GET, POST | `appraisal_goals` |
| `/api/hr/increments` | GET, POST | `increments` |
| `/api/hr/promotions` | GET, POST | `promotions` |
| **Masters API Routes** | | |
| `/api/masters/tax-slabs` | GET, POST | `tax_slabs` |
| `/api/masters/payment-modes` | GET, POST | `payment_modes` |
| `/api/masters/booking-sources` | GET, POST | `booking_sources` |
| `/api/masters/rate-plans` | GET, POST | `rate_plans` |
| `/api/masters/id-proof-types` | GET, POST | `id_proof_types` |
| `/api/masters/asset-categories` | GET, POST | `asset_categories` |
| `/api/masters/uom` | GET, POST | `uom` |
| `/api/masters/locations` | GET | `countries`, `states`, `cities` |
| **Admin API Routes** | | |
| `/api/admin/users` | GET, POST | `users`, `user_roles`, `employees` |
| `/api/admin/users/[id]` | GET, PUT | `users` |
| `/api/admin/compliance` | GET, POST | `statutory_compliance` |
| `/api/admin/compliance/[id]` | GET, PUT | `statutory_compliance` |
| `/api/admin/roles` | GET | `roles`, `user_roles` |
| `/api/admin/sessions` | GET | `user_sessions` (active) |
| `/api/admin/backup` | GET, POST | `backup_jobs` |
| `/api/admin/audit-events` | GET | `audit_events` |

**Smart unit status sync** (automatic):
| Action | Unit status becomes |
|---|---|
| Booking check-in | `occupied` |
| Booking check-out | `dirty` |
| Booking cancelled | `vacant` |
| Housekeeping task resolved | `inspection` |
| Maintenance ticket created | `maintenance` |

#### Data Hooks (`lib/hooks/index.ts`)
```typescript
// Dashboard
useStats()                          // Dashboard KPIs — auto-refreshes every 30s
useReservations(filters)            // Paginated booking list
useGuests(search, page)             // Guest search + pagination
useHousekeeping(filters)            // Task board — auto-refreshes every 15s
useMaintenance(filters)             // Ticket list
useFinance(propertyId)              // Revenue + invoices
useProperties(vertical)             // Property occupancy
useLeases(filters)                  // Lease agreements

// HR
useEmployees(search, deptId)        // Employee directory
useDepartments()                    // Department list
useShifts()                         // Shift schedule
useTimesheets(filters)              // Timesheet records
useLeaveRequests(filters)           // Leave requests
useLeaveBalances(employeeId)        // Leave balance per employee
usePayrollRuns(propertyId)          // Payroll runs
usePayrollRun(id)                   // Single payroll run
useCompliance()                     // PF/ESI/PT/TDS compliance
useHolidays(year)                   // Holiday calendar
useOvertimePolicies()               // OT policy list
useAttendancePolicies()             // Attendance rules
useDocumentTypes()                  // Document type list
usePolicyDocuments(category)        // Policy document repository
useAppraisalCycles(status)          // Appraisal cycles
useAppraisalReviews(cycleId, empId)  // Appraisal reviews
useAppraisalGoals(cycleId, empId)    // Appraisal goals
useIncrements(empId, status)        // Increment records
usePromotions(empId, status)        // Promotion records

// Masters
useTaxSlabs(taxType)                // Tax rate slabs
usePaymentModes()                   // Payment method list
useBookingSources()                 // OTA/booking source list
useRatePlans()                      // Rate plan list
useIdProofTypes()                   // ID proof document types
useAssetCategories()                // Asset category list
useUOM()                            // Units of measure
useLocations(type, parentId)        // Countries/states/cities

// Admin
useAdminUsers(search, role)         // Admin user list with search/filter
useAdminUser(id)                    // Single admin user detail
useAdminRoles()                     // All roles with user count
useAdminSessions()                  // Active user sessions
useAdminBackups()                   // Backup job history
useAdminAuditEvents(filters)        // Audit event log

// Properties
useProperty(id)                     // Single property detail
```

#### Mutation Hooks (`lib/hooks/mutations.ts`)
```typescript
useCheckIn()             // Check-in guest + set unit to occupied
useCheckOut()            // Check-out guest + set unit to dirty
useCreateReservation()   // New booking
useCreateGuest()         // New guest profile
useUpdateHousekeepingTask() // Update task status
useCreateHousekeepingTask() // Create new housekeeping task
useCreateMaintenanceTicket() // Create maintenance ticket

// Admin
useCreateAdminUser()         // Create system user
useUpdateAdminUser()         // Update user profile/status
useDeleteAdminUser()         // Soft-delete user

// Properties
useCreateProperty()          // Create new property/workspace
useUpdateProperty()          // Update property details
```

---

## Step 7 — RBAC + Auth System

### Auth Context (`lib/auth-context.tsx`)
- `AuthProvider` wraps all dashboard pages
- `useAuth()` hook exposes: `user`, `loading`, `error`, `signOut()`, `refresh()`
- Fetches `/api/auth/me` on mount — reads JWT cookie
- Falls back to `localStorage.ehms_demo_session` for sidebar hydration

### Role Access (`lib/role-access.ts`)
- `ROLE_ACCESS` map: defines which pages each role can access
- `ROLE_LABELS`: human-readable role names
- `DEMO_ROLE_MAP`: email → role mapping for all 8 demo users
- `hasAccess(role, path)`: utility to check page access

### Middleware RBAC (`middleware.ts`)
- Reads `ehms_token` JWT cookie
- Redirects unauthenticated users to `/`
- Protects all `/dashboard/*` routes

### Demo Users (Login Page)
| Role | Email | Pages |
|---|---|---|
| Super Admin | superadmin@ehms.demo | All pages |
| Executive | executive@ehms.demo | All pages (read-only executive view) |
| Property Mgr | admin@ehms.demo | Dashboard, Hotels, Apartments, Rental, Workplace, Admin |
| Front Desk | frontdesk@ehms.demo | Dashboard, Front Desk |
| Housekeeping | housekeeping@ehms.demo | Dashboard, Housekeeping |
| Maintenance | maintenance@ehms.demo | Dashboard, Maintenance |
| HR Manager | hr@ehms.demo | Dashboard, HRMS |
| Finance Mgr | finance@ehms.demo | Dashboard, Finance |

Password for all: `Demo@1234`

---

## Step 8 — Layout Components

### Header (`components/layout/header.tsx`)
- Avatar with initials from user profile
- Dropdown with: user info, role badge, profile link, logout
- Search bar (pill style)
- Bell notification icon with badge

### Sidebar (`components/layout/sidebar.tsx`)
- `ALL_NAV_ITEMS` with `roles[]` arrays per item
- Filters visible items by current user role
- Collapse toggle
- Email footer
- Show more/less toggle for secondary items

---

## Step 9 — Dashboard Pages (all 500+ lines)

| Page | Lines | Key Features |
|---|---|---|
| **front-desk** | 625 | Room matrix by floor, arrivals/in-house/departures panels, check-in/out with mutations, action feedback, guest messaging, activity feed, room metrics |
| **housekeeping** | 525 | Task list with priority badges, status filters, floor summary, linen ledger, staff performance, quality checklist, equipment status, schedule timeline |
| **maintenance** | 554 | Ticket table, AMC monitor, preventive schedule, new ticket form, parts inventory, team overview, vendor performance, weekly workload chart |
| **finance** | 505 | P&L summary, invoice table, bank reconciliation, budget vs actual, cash flow, tax summary, YoY comparison, reconciled transactions |
| **hr** | 503 | Employee directory, department overview, shift schedule, statutory compliance, recruitment pipeline, training, leave balance, top performers, payroll history |
| **rental** | 509 | Lease agreements table, rent roll, renewal alerts, deposit ledger, maintenance requests, tenant comms, property comparison, notice tracking, income forecast |
| **workplace** | 511 | Floor plan grid, visitor mgmt, corporate memberships, meeting room bookings, amenity usage, member feedback, daily revenue, upcoming events |
| **hotels** | 517 | Property cards, performance summary, occupancy stats, amenities overview, group bookings, seasonal comparison, guest satisfaction, channel performance |
| **apartments** | 506 | Property cards, occupancy trend, performance KPIs, extended stay monitoring, unit turnaround, guest nationality, corporate vs leisure, monthly metrics |
| **admin** | 503 | Tabbed interface (Overview/User Mgmt/Compliance/Audit), system health, compliance vault, role mgmt, security settings, system config, backup/restore, API keys |
| **properties** | — | Property workspace CRUD with vertical filter, status badges, search, add/edit modal |

### Shared Patterns
- All pages use `useSWR` hooks with `isLoading`/`isError` states
- Mock data fallback when API returns empty/null
- Loading skeleton states while fetching
- Error state with retry message
- Empty state with helpful message
- Responsive grid layouts (1-3 columns)
- Consistent Card/Badge/Button/Table component usage

---

## Seed Data (`database/seed.sql`)

| Entity | Seeded |
|---|---|
| Enterprise | eHMS Hospitality Group |
| Region | South India — Chennai |
| Properties | 4 (Hotel, Service Apt, Rental, Workplace) |
| Units/Rooms | 30 (Oceanview Hotel) |
| Guest profiles | 10 (VIP, corporate, frequent) |
| Bookings | 6 (all statuses) |
| Housekeeping tasks | 5 |
| Maintenance tickets | 5 |
| Payments | Linked to paid bookings |
| Departments | 6 |
| Employees | 8 (one per demo user) |
| Demo users | 8 (`@ehms.demo`, password: `Demo@1234`, stored via pgcrypto crypt()) |

> **Note**: Passwords in `seed.sql` use PostgreSQL `pgcrypto` `crypt('Demo@1234', gen_salt('bf'))`.
> The login API verifies demo users in-DB using `crypt(input, stored_hash)` — no bcrypt conflict.

---

## Git Commit History

| Hash | Message |
|---|---|---|
| `fe7691f` | Initial commit from Create Next App |
| `55a7dbe` | feat: apply eHMS theme, redesign dashboard, sidebar, header |
| `fd0b913` | feat: full database integration (originally Supabase) |
| *(3 prior)* | NeonDB migrate, RBAC, Journey Switcher, HRMS, Masters, HK/Maint workflows |
| *prev* | feat: Admin Module (sessions/audit/backup/roles) + Property CRUD + per-property scoping |
| *current* | feat: Property Configuration & Feature Toggles (10 toggles, config UI, hooks) |

---

## Setup Guide (NeonDB)

### Step A — NeonDB project (already done ✅)
Your Neon project is live at `ep-delicate-scene-athrbyyk-pooler.c-9.us-east-1.aws.neon.tech`.

### Step B — `.env.local` (already configured ✅)
```env
DATABASE_URL=postgresql://neondb_owner:<password>@ep-<slug>-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=ehms-dev-jwt-secret-do-not-use-in-production-change-this
```

### Step C — Run SQL schemas in Neon SQL Editor
Go to **Neon Console → SQL Editor**, run in order:
```
001_core_schema.sql  →  002  →  003  →  004  →  005  →  006
→  007  →  008  →  009  →  010  →  011  →  012  →  seed.sql
```

### Step D — No auth user creation needed
Unlike Supabase Auth, all users live in the `public.users` table with bcrypt/pgcrypto hashed passwords. The seed.sql creates all 8 demo users automatically.

### Step E — Add env vars to Vercel + redeploy
```bash
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add RESEND_API_KEY
vercel env add RESEND_FROM
vercel --prod
```

---

## Full Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.9 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS + CSS Variables | 4.x |
| Icons | Lucide React | 1.21.0 |
| Charts | Recharts + Vanilla SVG | 3.x |
| Data fetching | SWR | 2.x |
| Mutations | SWR + global cache invalidation | latest |
| Database | PostgreSQL 16 (via **NeonDB**) | 16 |
| DB Driver | `@neondatabase/serverless` | 1.x |
| Auth | Custom JWT + bcrypt + pgcrypto | — |
| Deployment | Vercel | — |
| Font | Geist Sans / Geist Mono | — |

---

## eHMS Design System

### Color Tokens
```css
--color-sidebar:     #2C3547   /* Charcoal sidebar */
--color-primary:     #2BAE8E   /* Teal-green accent */
--color-secondary:   #4DB88A   /* Light green */
--color-navy:        #1A3C5E   /* Headings */
--color-amber:       #F5A623   /* Warnings */
--color-light:       #F5F7FA   /* Page background */
--color-white:       #FFFFFF   /* Card background */
--color-border:      #E2E8F0   /* Borders */
--color-text:        #1A2E44   /* Body text */
--color-text-muted:  #64748B   /* Secondary text */
--color-danger:      #E53E3E   /* Errors */
```

### Component Patterns
| Component | Style |
|---|---|
| Cards | `rounded-2xl`, white bg, `1px solid #E2E8F0` |
| Primary button | `linear-gradient(135deg, #2BAE8E, #4DB88A)` |
| Active nav item | `3px solid #2BAE8E` left border |
| Badges | Soft tinted pills (color on 12% opacity bg) |
| KPI cards | Gradient `#1A3C5E → #2C3547` |
| Inputs focus | Border → `#2BAE8E` |

---

## Known Issues Fixed

| Issue | Fix |
|---|---|
| Hydration error: `antigravity-scroll-lock` class mismatch | Added `suppressHydrationWarning` to `<body>` in `app/layout.tsx` |
| Demo login fails — pgcrypto vs bcrypt mismatch | Login API now uses `crypt(input, hash)` SQL verify for demo users |
| Superuser sidebar empty | JWT cookie auth working; sidebar reads `role_name` from `/api/auth/me` |
| `admin@ehms.demo` missing from DEMO_ROLE_MAP | Added `property_manager` mapping in `lib/role-access.ts` |
| HMR WebSocket connection handshake failure (`_next/webpack-hmr` ERR_INVALID_HTTP_RESPONSE) | Excluded all Next.js internal paths `_next/` from the middleware matcher in `proxy.ts` to prevent request interception during WebSocket upgrade handshake. |
| Submodule `frontend` out of sync with root repo changes | Ran `git pull` in `frontend` submodule to ensure both instances run identical updated files. |
| `\u20B9` (₹) Unicode escape displays literally as text in JSX | Wrapped in `{'\u20B9'}` expression syntax so React renders the symbol instead of the raw escape sequence |
| Vercel build crash: `Missing API key. Pass it to the constructor new Resend("")` | Changed `lib/email.ts` to lazy-initialize Resend via `getResend()`. Constructor is no longer called at module evaluation time. Emails skip gracefully when env var absent. |

---

## Gap Analysis

### What's Complete ✅
- Full theme rebrand (SAMP → eHMS)
- Logo integration across all surfaces
- Dashboard redesign matching reference
- Vercel deployment with custom domain
- 12 SQL schemas + seed data
- **NeonDB** integration with all API routes
- JWT-based auth with httpOnly cookie
- RBAC middleware, sidebar filtering, route protection
- SWR data hooks for all modules
- Auth system with 8 demo roles
- Profile dropdown with logout
- All 10 dashboard pages >500 lines each with live data wiring
- Mutation hooks (check-in, check-out, create, update)
- Lease API endpoint
- Shared utility constants
- Hydration error fix
- \u20B9 Unicode escape fix across finance/HR pages
- **Full HRMS Module** (See Step 13)
- **Missing Masters + Appraisal/Increment/Promotion** (See Step 14)
- **Housekeeping Workflow — Sub-pages, API routes, linen/inspection tracking** (See Step 15)
- **Maintenance Workflow — Sub-pages, API routes, asset/ticket/parts tracking** (See Step 16)
- **Admin Module — System session management, audit trail, backup/restore** (See Step 17)
- **Property Workspace Management — Full CRUD, per-property scoping** (See Step 18)
- **Property Configuration & Feature Toggles — 10 per-property feature toggles** (See Step 26)

### What May Need Attention
1. Run `020_admin_module.sql` via `npm run migrate` to create new admin tables (sessions, login attempts, backup jobs, audit events, admin notifications)
2. Set `DATABASE_URL` + `JWT_SECRET` + `RESEND_API_KEY` + `RESEND_FROM` in Vercel env vars for production
3. Change `JWT_SECRET` to a strong random value for production
4. Consider bcrypt migration script for existing pgcrypto users if adding non-demo users

## Step 10 — Phase 2: Expanded Scope (Front Desk & F&B)

The original scope for the Front Desk module was expanded on 20 June 2026 to incorporate deeper operational capabilities and integrations.

### Expanded Front Desk Workflows
- **Check-In Checklists:** Enforced pre-requisites (`checkin_checklists` table) before assigning a room.
- **Car Parking Allocation:** Assigning slots and tracking vehicles (`parking_allocations`).
- **Guest Requests & Complaints:** Integrated ticket system linking Front Desk with Maintenance and Housekeeping (`guest_requests`).
- **Billing & Folio Management:** Comprehensive billing view for adding charges to the guest folio and managing checkout.
- **Advertisements & Offers:** Tracking and upselling active promotions (`promotions_offers`).
- **Departmental Feedback:** Post-service feedback tracking across all departments (`guest_feedback`).
- **Sidebar Overhaul:** Expanded navigation sub-menus for the `front_desk` role including Check-ins, Billing, and Requests.

### Food & Beverage (Pantry & Restaurant)
- **Meal Plans (Inclusions):** Booking entitlements (`meal_plans`) for complimentary breakfast based on room categories (e.g., EP, CP, MAP).
- **F&B Menu:** Unified menu system (`f_and_b_menu`).
- **Room Service / Orders:** POS and ticket tracking for the Pantry (`f_and_b_orders`, `f_and_b_order_items`) enabling cross-department billing to guest folios.

*(Schemas `013-frontdesk-features.sql` and `014-f-and-b-workflow.sql` created and migrated to support these workflows.)*

## Step 11 — Phase 2: Performance Refactoring & Maintenance Command Center

Following the initial MVP rollout of the F&B and Maintenance modules, the system was architecturally reviewed and upgraded to "world-class standard" to handle high-volume hotel operations.

### F&B Real-Time Reactivity (SWR)
- **Problem:** The Kitchen Command Center relied on static `fetch` calls via `useEffect`, forcing chefs to manually refresh to see new orders. The SQL query also lacked safeguards for empty orders.
- **Solution:** 
  - Integrated React `useSWR` hooks with a 15-second `refreshInterval` for automatic, silent background polling of orders.
  - Wired `mutate()` directly to action buttons (e.g., "Accept Order") for instantaneous UI updates without network roundtrips.
  - Wrapped backend Postgres `json_agg` functions in `COALESCE` to strictly type the return as `[]` (empty array) instead of `NULL`, preventing React crashes.

### Full Maintenance Command Center
- **Transition from Mock to Live:** Replaced all hardcoded prototype arrays in `/dashboard/maintenance` with live API endpoints.
- **New Endpoints Created:**
  - `GET /api/maintenance/preventive` (Live Asset Service Calendar)
  - `GET /api/maintenance/amc` (Expiring Vendor Contracts)
  - `GET /api/maintenance/inventory` (Parts Re-Order System)
  - `GET /api/maintenance/vendors` (Vendor Performance Aggregation)
- **Guest Feedback Triage Workflow:** Built an automated bridge between the Guest Feedback table and Maintenance.
  - *Trigger:* Any guest rating ≤ 3 stars for 'Maintenance' or 'Housekeeping' appears dynamically at the top of the Maintenance Dashboard as an "Action Required" card.
  - *Action:* The Engineering Manager can click "Raise Ticket" to immediately convert the complaint into a critical/high-priority `corrective` maintenance work order assigned directly to the guest's unit.

## Step 12 — Journey Switcher to Login Page & Vertical Isolation

To resolve confusion and avoid cross-business visibility, the workspace Journey Switcher was migrated from the main dashboard header to the login page. This forces users to choose their active workspace vertical (Hotels, Serviced Apartments, Apartment Rental, Workplace Services) at authentication time.

### Implementation Details:
1. **Login Page Switcher:**
   - A styled dropdown was added to `app/page.tsx` with matching Lucide icons.
   - Upon successful credentials/demo authentication, the user is dynamically routed to `/dashboard/${vertical}` (e.g. `/dashboard/rental`).
2. **Dynamic Sidebar Filter:**
   - Modified `components/layout/sidebar.tsx` to read the active vertical from the `useJourney` hook.
   - Filters sidebar links dynamically to display only vertical-relevant items.
   - Re-targets the main "Dashboard" link dynamically to target the chosen business vertical (e.g. `/dashboard/rental`).
3. **Core Operational Journeys Isolation:**
   - **Front Desk, Housekeeping, Maintenance, Staff (HRMS), and Vendors** are treated as isolated, vertical-specific domains rather than global shared states. Each vertical runs customized operations (e.g. high-frequency Hotel daily cleans and room matrix vs. Rental leasing onboarding workbench, tenant maintenance tickets, and contract painters/landscapers).

## Step 13 — HRMS Module (Full Workflow)

Built on 20–21 June 2026. The HR module was converted from a single static page with mock data into a full-featured HRMS with database-backed workflows spanning employee lifecycle, time tracking, leave management, payroll, and compliance.

### Database: 017_hrms_extensions.sql
| Table | Purpose |
|---|---|
| `leave_types` | Leave categories (sick, casual, annual, etc.) with entitlement |
| `leave_requests` | Apply/approve/reject workflow with date range |
| `leave_balances` | Per-employee leave balance tracking |
| `timesheets` | Clock-in/out with geo-tagging and break tracking |

### API Routes Created (11)
| Route | Methods | Purpose |
|---|---|---|
| `/api/hr/employees` | GET, POST | Employee CRUD + employee code generation |
| `/api/hr/employees/[id]` | GET, PUT | Single employee update |
| `/api/hr/departments` | GET, POST | Department management |
| `/api/hr/shifts` | GET, POST | Shift schedule management |
| `/api/hr/timesheets` | GET, POST | Clock-in + timesheet listing |
| `/api/hr/timesheets/[id]` | PUT | Clock-out |
| `/api/hr/leaves` | GET, POST | Leave request list + apply |
| `/api/hr/leaves/[id]` | PUT | Approve/reject leave |
| `/api/hr/payroll` | GET, POST | Payroll run creation + listing |
| `/api/hr/payroll/[id]` | GET, PUT | Single run detail + approve |
| `/api/hr/compliance` | GET | PF/ESI/PT/TDS aggregation per period |

### Pages Built (7)
| Page | Path | Features |
|---|---|---|
| **Employees** | `/dashboard/hr/employees` | Employee directory, add/edit form, department/shift/band selection |
| **Timesheet** | `/dashboard/hr/timesheet` | Dual-view: clock-in/out for self + team timesheet grid with date filters |
| **Leave** | `/dashboard/hr/leave` | Leave balance cards, apply form, approval workflow with status badges |
| **Payroll** | `/dashboard/hr/payroll` | Run list, create with auto-compute (PF/ESI/PT/TDS), approve workflow |
| **Compliance** | `/dashboard/hr/compliance` | PF summary, ESI summary, PT deduction, TDS challenge, aggregated dashboard |
| **Shifts** | `/dashboard/hr/shifts` | Shift type management (name, time window, grace) |
| **Settings** | `/dashboard/hr/settings` | Tabbed: Departments, Designations, Employee Bands, Salary Structures |

### SWR Hooks Added (10)
- `useTimesheets()`, `useLeaveRequests()`, `useLeaveBalances()`, `usePayrollRuns()`, `usePayrollRun()`, `useCompliance()`, `useShifts()`, `useDepartments()`

### Seed Data
- 4 leave types (Sick, Casual, Annual, Comp-off) with 2026 balances for all employees
- 3 shifts (General, Evening, Night)
- Attendance entries + leave requests for demo employees
- One payroll run with computed items

---

## Step 14 — Missing Masters + Appraisal/Increment/Promotion Workflow

Built on 21 June 2026. Extended the system with all missing master data dictionaries across HR, Finance, Procurement & Inventory, and Hospitality domains, plus an end-to-end appraisal workflow with linked increment and promotion tracking.

### Database: 018_masters_and_policies.sql

#### HR Masters
| Table | Purpose |
|---|---|
| `holiday_calendar` | Per-property holiday list (public/optional/restricted) |
| `overtime_policies` | OT rules with multiplier, thresholds, applicable shifts |
| `attendance_policies` | Late/early/grace rules per property |
| `document_types` | Employee/policy/compliance document categories |

#### Policy Document Repository
| Table | Purpose |
|---|---|
| `policy_documents` | HR policies, forms, handbooks with base64 file storage, versioning, category |

#### Appraisal, Increment & Promotion Workflow
| Table | Purpose |
|---|---|
| `appraisal_cycles` | Review cycles (annual/half-yearly/quarterly) with rating scale and status |
| `appraisal_goals` | Per-employee goals with weightage and target dates |
| `appraisal_reviews` | Self + reviewer ratings, scores, and workflow status |
| `increments` | CTC change tracking linked to appraisal results, auto-computed amount |
| `promotions` | Designation/band change tracking with CTC impact, approval workflow |

#### App-Wide Masters
| Table | Purpose |
|---|---|
| `tax_slabs` | GST/TDS/Income-tax rate slabs with min/max amounts |
| `payment_modes` | Online/offline/wallet payment methods |
| `booking_sources` | OTA/direct booking channels with commission |
| `rate_plans` | Per-property pricing plans with refund/cancellation policy |
| `id_proof_types` | Guest ID document types (Aadhaar, Passport, DL, etc.) |
| `asset_categories` | Maintenance asset classification (Electrical, HVAC, etc.) |
| `uom` | Units of measure for procurement |
| `countries`/`states`/`cities` | Geographic reference data (India seeded) |

### API Routes Created (14)
| Route | Methods | Purpose |
|---|---|---|
| **HR Masters** | | |
| `/api/hr/holidays` | GET, POST | Holiday calendar CRUD |
| `/api/hr/overtime-policies` | GET, POST | OT policy management |
| `/api/hr/attendance-policies` | GET, POST | Attendance rules management |
| `/api/hr/document-types` | GET, POST | Document type management |
| `/api/hr/policy-documents` | GET, POST | Policy doc upload/list with base64 |
| **Appraisal** | | |
| `/api/hr/appraisal-cycles` | GET, POST | Cycle management |
| `/api/hr/appraisal-reviews` | GET, POST | Review (upsert on conflict) |
| `/api/hr/appraisal-goals` | GET, POST | Goal management |
| **Compensation** | | |
| `/api/hr/increments` | GET, POST | Increment records |
| `/api/hr/promotions` | GET, POST | Promotion records |
| **App Masters** | | |
| `/api/masters/tax-slabs` | GET, POST | Tax slab CRUD |
| `/api/masters/payment-modes` | GET, POST | Payment mode CRUD |
| `/api/masters/booking-sources` | GET, POST | Booking source CRUD |
| `/api/masters/rate-plans` | GET, POST | Rate plan CRUD |
| `/api/masters/id-proof-types` | GET, POST | ID proof type CRUD |
| `/api/masters/asset-categories` | GET, POST | Asset category CRUD |
| `/api/masters/uom` | GET, POST | Unit of measure CRUD |
| `/api/masters/locations` | GET | Countries/states/cities with hierarchy filters |

### Pages Built (5) + Extended (1)
| Page | Path | Features |
|---|---|---|
| **HR Masters** | `/dashboard/hr/masters` | 4 tabs: Holidays, Overtime Policies, Attendance Policies, Document Types |
| **Policy Documents** | `/dashboard/hr/policies` | Upload with base64, category filter, download via Blob |
| **Appraisal** | `/dashboard/hr/appraisal` | 3 tabs: Cycles, Reviews (filter by cycle), Goals (filter by cycle + employee) |
| **Compensation** | `/dashboard/hr/compensation` | 2 tabs: Increments (auto compute %), Promotions (band/designation change) |
| **Admin Masters** (extended) | `/dashboard/admin/masters` | 3 new tabs: Finance & Tax (GST/TDS slabs), Payments & Bookings (payment modes, booking sources, rate plans), Assets & Inventory (asset categories, UOM, ID proof types) |

### SWR Hooks Added (19)
- HR Masters: `useHolidays()`, `useOvertimePolicies()`, `useAttendancePolicies()`, `useDocumentTypes()`, `usePolicyDocuments()`
- Appraisal: `useAppraisalCycles()`, `useAppraisalReviews()`, `useAppraisalGoals()`
- Compensation: `useIncrements()`, `usePromotions()`
- App Masters: `useTaxSlabs()`, `usePaymentModes()`, `useBookingSources()`, `useRatePlans()`, `useIdProofTypes()`, `useAssetCategories()`, `useUOM()`, `useLocations()`

### Sidebar Updates
4 new nav items added under HRMS: **Masters**, **Policies**, **Appraisal**, **Compensation** (accessible to `super_admin`, `executive`, `hr_manager`, `hr_executive`)

### Seed Data (pre-seeded in migration)
- 10 document types (Aadhaar, PAN, Bank Proof, Contract, NDA, etc.)
- 8 payment modes (Cash, Credit/Debit Card, UPI, Net Banking, etc.)
- 7 booking sources (Direct, MakeMyTrip, GoIbibo, Booking.com, etc.)
- 5 ID proof types (Aadhaar, Passport, DL, Voter ID, PAN)
- 8 asset categories (Electrical, Plumbing, HVAC, Furniture, etc.)
- 10 UOM (Pcs, Kg, G, L, Ml, M, Sqm, Box, Pack, Dozen)
- India + 12 states + 18 cities
- GST (0/5/12/18/28%) + TDS slabs
- 2026 holiday calendar (7 public holidays)
- 3 overtime policies (Weekday 1.5x, Weekend 2x, Holiday 2.5x)
- Standard attendance policy

---

## Step 15 — Housekeeping Workflow — Sub-pages & API Routes

Built on 22 June 2026. Extended the Housekeeping module from a single static dashboard into a full workflow with dedicated sub-pages for task management, linen tracking, quality inspections, and staff performance.

### Database: 019_housekeeping_maintenance_workflows.sql
| Table | Purpose |
|---|---|
| `linen_items` | Individual linen item tracking with RFID, status, lifecycle count |
| `housekeeping_inspections` | Quality control with JSONB checklist, score, pass/fail |

### API Routes Created (6)
| Route | Methods | Purpose |
|---|---|---|
| `/api/housekeeping/linen/batches` | GET, POST | Linen batch CRUD (existing table) |
| `/api/housekeeping/linen/items` | GET, POST | Individual linen item tracking |
| `/api/housekeeping/linen/transactions` | GET, POST | Linen checkout/return transactions |
| `/api/housekeeping/checklists` | GET, POST | Inspection checklist templates |
| `/api/housekeeping/inspections` | GET, POST | Quality inspection records with score computation |
| `/api/housekeeping/stats` | GET | Aggregated dashboard: task counts by status, staff performance, floor summary, linen summary |

### Pages Built (4)
| Page | Path | Features |
|---|---|---|
| **Tasks** | `/dashboard/housekeeping/tasks` | Filter by status/priority/floor/room, expandable rows with detail, checklist modal, workflow actions (start/in-progress/complete/skip), auto-refresh |
| **Linen** | `/dashboard/housekeeping/linen` | 3-tab: Batches (create/status), Items (RFID view), Transactions (checkout/return history) |
| **Inspections** | `/dashboard/housekeeping/inspections` | Stats bar (total/pass/fail/pending), filter by area/floor, expandable rows with checklist items and pass/fail badges |
| **Staff** | `/dashboard/housekeeping/staff` | Performance cards from stats API (tasks completed, rating, efficiency) |

### SWR Hooks Added (6)
`useLinenBatches()`, `useLinenItems()`, `useLinenTransactions()`, `useHKChecklists()`, `useHKInspections()`, `useHKStats()`

### Key UI Patterns
- **Badge variants**: `teal` (completed/pass), `amber` (in-progress/pending), `red` (failed/skipped), `gray` (cancelled)
- **Stats bar**: 4 KPI cards at top with gradient backgrounds (rooms in-progress, pending, completed, inspections)
- **Expandable table rows**: Click to reveal detail panel with full description, room info, timestamps

---

## Step 16 — Maintenance Workflow — Sub-pages & API Routes

Built on 22 June 2026. Extended the Maintenance module from a static dashboard into a full workflow with ticket lifecycle management, asset register, parts inventory, time tracking, and approvals.

### Database: 019_housekeeping_maintenance_workflows.sql
| Table | Purpose |
|---|---|
| `maintenance_ticket_parts` | Parts used per maintenance ticket with auto-computed total cost |
| `maintenance_time_entries` | Technician time tracking with auto duration computation |
| `maintenance_approvals` | Approval workflow log (assign/approve/reject/close) with role-based actions |

### API Routes Created (6)
| Route | Methods | Purpose |
|---|---|---|
| `/api/maintenance/assets` | GET, POST | Asset register CRUD with warranty tracking |
| `/api/maintenance/tickets/[id]` | PUT | Status transitions with approval logging (assign → in-progress → resolved → closed) |
| `/api/maintenance/ticket-parts` | GET, POST | Parts usage logging with atomic inventory decrement |
| `/api/maintenance/time-entries` | GET, POST | Technician time tracking |
| `/api/maintenance/approvals` | GET, POST | Approval log for ticket actions |
| `/api/maintenance/stats` | GET | Aggregated dashboard: ticket counts by status/category/priority, upcoming PM, expiring AMC, low stock parts |

### Pages Built (3)
| Page | Path | Features |
|---|---|---|
| **Tickets** | `/dashboard/maintenance/tickets` | Stats bar (critical/high/open/resolved), filter by status/category/priority, workflow buttons (assign modal, start, resolve, close), approval logging, expandable detail with parts/time/approvals tabs |
| **Assets** | `/dashboard/maintenance/assets` | Asset register with warranty badges (color-coded by days remaining: teal >90d, amber 30-90d, red <30d, gray expired), add/edit asset modal |
| **Parts** | `/dashboard/maintenance/parts` | Stock bar visualization, low stock badge (<10 units), add stock modal, category filter |

### SWR Hooks Added (5)
`useMaintenanceAssets()`, `useMaintenanceTicketParts()`, `useMaintenanceTimeEntries()`, `useMaintenanceApprovals()`, `useMaintenanceStats()`

### Sidebar Updates
7 new nav items under Housekeeping & Maintenance: **Tasks**, **Linen**, **Inspections**, **Staff** (HK) and **Tickets**, **Parts**, **Assets** (Maint) — with Lucide icons (Layers, CheckCircle, Ticket, Package)

### Known Issue
- `Date.now()` was initially flagged by `react-hooks/purity` ESLint rule inside `useMemo` for warranty badge computation. Fixed by hoisting to a module-level `const NOW = Date.now()`.

---

## Step 17 — Admin Module — System Session, Audit & Backup Management

Built on 23 June 2026. Extended the Admin module from a single overview page into a full system administration suite with role management, session monitoring, audit trail, and backup/restore capabilities.

### Database: 020_admin_module.sql
| Table | Purpose |
|---|---|
| `user_sessions` | Active login sessions with IP, user agent, last activity |
| `login_attempts` | Login audit with success/failure tracking and rate limiting |
| `backup_jobs` | Backup/restore job queue with status, size, metadata |
| `audit_events` | Global audit log tracking CRUD operations across all modules |
| `admin_notifications` | System-level admin alerts (backup failures, security events) |

### API Routes Created (8)
| Route | Methods | Purpose |
|---|---|---|
| `/api/admin/users` | GET, POST | Admin user list (with employee join) + create user |
| `/api/admin/users/[id]` | GET, PUT | Single user detail + status/role update (soft-delete) |
| `/api/admin/compliance` | GET, POST | Statutory compliance records |
| `/api/admin/compliance/[id]` | GET, PUT | Single compliance record |
| `/api/admin/roles` | GET | All roles with user count aggregation |
| `/api/admin/sessions` | GET | Active sessions with inactivity detection |
| `/api/admin/backup` | GET, POST | Backup job history + trigger new backup |
| `/api/admin/audit-events` | GET | Paginated audit log with action/resource/date filters |

### Pages Built (3) + Extended (1)
| Page | Path | Features |
|---|---|---|
| **Roles & Permissions** | `/dashboard/admin/roles` | Role list with user counts, permission indicators (create/read/update/delete for each module), search/filter |
| **Audit Trail** | `/dashboard/admin/audit` | Audit log table with user/resource/action columns, filter by action/resource/user, timezone-aware timestamps (Asia/Kolkata), search |
| **Backup & Restore** | `/dashboard/admin/backup` | Backup job list with status badges (completed/failed/running), trigger backup button, file size display, created/updated timestamps |
| **Admin Masters** (extended) | `/dashboard/admin/masters` | Previously added 3 new tabs: Finance & Tax, Payments & Bookings, Assets & Inventory |

### SWR Hooks Added (6)
`useAdminUsers()`, `useAdminUser()`, `useAdminRoles()`, `useAdminSessions()`, `useAdminBackups()`, `useAdminAuditEvents()`

### Mutation Hooks Added (4)
`useCreateAdminUser()`, `useUpdateAdminUser()`, `useDeleteAdminUser()`

### Sidebar Updates
5 new nav items under Admin: **Roles**, **Audit**, **Backup** (with lock/scroll/cloud icons)

---

## Step 18 — Property (Workspace) Management — Full CRUD & Per-Property Scoping

Built on 23 June 2026. Introduced full property/workspace CRUD with dedicated API routes, UI page, and per-property scoping enhancements across all existing modules.

### API Routes Created (2)
| Route | Methods | Purpose |
|---|---|---|
| `/api/properties` | GET, POST | List all properties + create property with enterprise/region/vertical/address |
| `/api/properties/[id]` | GET, PUT | Single property detail + update |

### Pages Built (1)
| Page | Path | Features |
|---|---|---|
| **Properties** | `/dashboard/properties` | Property cards with vertical filter, status badges (Active/Maintenance/Closed), search, add/edit modal with all fields (name, type, vertical, address, contact, status) |

### Per-Property Scoping Enhanced Across All Modules

The following hooks and API routes were enriched with `property_id` support for cross-module data isolation:

| Module | Hooks Updated | API Routes Enhanced |
|---|---|---|
| **HR** | `useEmployees()`, `useShifts()`, `useTimesheets()`, `useLeaveRequests()`, `usePayrollRuns()`, `useHolidays()`, `useOvertimePolicies()`, `useAttendancePolicies()`, `useCompliance()` | `/api/hr/employees`, `/api/hr/shifts`, `/api/hr/timesheets`, `/api/hr/leaves`, `/api/hr/payroll`, `/api/hr/holidays`, `/api/hr/overtime-policies`, `/api/hr/attendance-policies`, `/api/hr/compliance` |
| **Housekeeping** | `useHousekeeping()`, `useHKStats()`, `useHKInspections()` | `/api/housekeeping`, `/api/housekeeping/stats`, `/api/housekeeping/inspections` |
| **Maintenance** | `useMaintenance()`, `useMaintenanceAssets()`, `useMaintenanceStats()` | `/api/maintenance`, `/api/maintenance/assets`, `/api/maintenance/stats` |
| **Vendors** | `useVendors()`, `useVendorContracts()`, `useVendorOrders()` | `/api/vendors`, `/api/vendors/contracts`, `/api/vendors/orders` |

### SWR Hooks Added (1)
`useProperty()`

### Mutation Hooks Added (2)
`useCreateProperty()`, `useUpdateProperty()`

---

## Step 19 — Full Accounts Module (UI/API/DB)

Built on 23 June 2026. Extended the Finance module from a single dashboard page into a full-fledged Accounts module with Chart of Accounts, Journal Entries, General Ledger, Accounts Receivable/Payable, Budgeting, Fixed Assets, Tax Management, and Financial Reports.

### Database: 021_accounts_module.sql
| Table | Purpose |
|---|---|
| `fiscal_years` | Accounting periods with open/close status per property |
| `cost_centers` | Departmental cost allocation (FK → departments) |
| `vendor_bills` | Accounts Payable — vendor invoices with status workflow |
| `bill_line_items` | Line-level detail for vendor bills |
| `bill_payments` | AP payment transactions against bills |
| `budget_heads` | Budget categories linked to chart of accounts |
| `budget_entries` | Monthly budget amounts vs actuals per head/fiscal year |
| `fixed_assets` | Asset register with purchase cost, depreciation, book value |
| `depreciation_schedule` | Period depreciation entries per asset |
| `tax_filings` | GST/TDS/Income Tax return filing tracker |

### Schema Extensions
- `chart_of_accounts` — added `sub_type`, `is_active`, `opening_balance`, `description`, `created_at`
- `journal_entries` — added `fiscal_period_id`, `is_adjusting`, `journal_type`, `updated_at`
- `invoices` — added `cost_center_id`, `invoice_type`, `updated_at`
- `payments` — added `cost_center_id`, `notes`, `updated_at`

### API Routes Created (20 files)

| Route | Methods | Purpose |
|---|---|---|
| `/api/finance/accounts` | GET, POST | Chart of accounts CRUD |
| `/api/finance/accounts/[id]` | GET, PUT | Single account detail/update |
| `/api/finance/journal-entries` | GET, POST | Journal entries with line items |
| `/api/finance/journal-entries/[id]` | GET, PUT | Single entry detail/post action |
| `/api/finance/ledger` | GET | GL account ledger with running balance |
| `/api/finance/vendor-bills` | GET, POST | Vendor bills CRUD with lines |
| `/api/finance/vendor-bills/[id]` | GET, PUT | Single bill detail/approve/cancel |
| `/api/finance/bill-payments` | GET, POST | AP payments (auto-updates bill balance) |
| `/api/finance/budget` | GET, POST | Budget entries with upsert |
| `/api/finance/budget/heads` | GET, POST | Budget head management |
| `/api/finance/fixed-assets` | GET, POST | Fixed asset register CRUD |
| `/api/finance/fixed-assets/[id]` | GET, PUT | Single asset detail/dispose |
| `/api/finance/depreciation` | GET, POST | Depreciation schedule recording |
| `/api/finance/tax-filings` | GET, POST | Tax return filing tracker |
| `/api/finance/tax-filings/[id]` | PUT | File/pay tax return |
| `/api/finance/cost-centers` | GET, POST | Cost center management |
| `/api/finance/fiscal-years` | GET, POST | Fiscal year management |
| `/api/finance/reports/trial-balance` | GET | Trial balance (all accounts with balances) |
| `/api/finance/reports/profit-loss` | GET | P&L statement (income vs expenses) |
| `/api/finance/reports/balance-sheet` | GET | Balance sheet (assets = liabilities + equity) |

### SWR Hooks Added (20)
`useAccounts()`, `useAccount()`, `useJournalEntries()`, `useJournalEntry()`, `useLedger()`, `useVendorBills()`, `useVendorBill()`, `useBillPayments()`, `useBudget()`, `useBudgetHeads()`, `useFixedAssets()`, `useFixedAsset()`, `useDepreciationSchedule()`, `useTaxFilings()`, `useCostCenters()`, `useFiscalYears()`, `useTrialBalance()`, `useProfitLoss()`, `useBalanceSheet()`

### Mutation Hooks Added (15)
`useCreateAccount()`, `useUpdateAccount()`, `useCreateJournalEntry()`, `usePostJournalEntry()`, `useCreateVendorBill()`, `useApproveVendorBill()`, `useCreateBillPayment()`, `useCreateFixedAsset()`, `useRecordDepreciation()`, `useCreateTaxFiling()`, `useFileTaxReturn()`, `useCreateBudgetHead()`, `useCreateBudgetEntry()`, `useCreateFiscalYear()`, `useCreateCostCenter()`

### UI Pages Built (10)
| Page | Path | Features |
|---|---|---|
| **Chart of Accounts** | `/dashboard/finance/accounts` | Account list with type/sub-type badges, add/edit modal, filter by type |
| **Journal Entries** | `/dashboard/finance/journal` | Entry list with type/status badges, dynamic line items entry (debits=credits validation), post action |
| **General Ledger** | `/dashboard/finance/ledger` | Account selector, date range, running balance table, opening/closing totals |
| **Receivables** | `/dashboard/finance/receivables` | Invoice list with status filters, summary stats, days overdue indicator |
| **Payables** | `/dashboard/finance/payables` | Vendor bills with status filters, approve action, "Record Bill" modal |
| **Budget** | `/dashboard/finance/budget` | Budget vs actual amounts, variance analysis, add entry modal |
| **Tax** | `/dashboard/finance/tax` | Tax return filing tracker, file/pay actions, liability summary |
| **Fixed Assets** | `/dashboard/finance/assets` | Asset register with book value, add asset modal, category filters |
| **Reports** | `/dashboard/finance/reports` | 3-tab: Trial Balance, P&L, Balance Sheet with as-at date picker |
| **Settings** | `/dashboard/finance/settings` | 3-tab: Cost Centers, Fiscal Years, Budget Heads with add modals |

### Sidebar Updates
11 finance nav items: **Finance** (dashboard), **Chart of Accts**, **Journal**, **Ledger**, **Receivables**, **Payables**, **Budget**, **Tax**, **Fixed Assets**, **Reports**, **Fin Settings** — with BookOpen, FileText, Calculator, Receipt, Landmark, PiggyBank, ScrollText, Building2, BarChart3, Settings icons.

### Existing Dashboard Enhanced
Finance main dashboard now includes a quick-navigation bar linking to all 10 sub-pages.

---

## Step 20 — Missing Mutation Hooks & Front Desk Hooks

Built on 23 June 2026. Filled all documented gaps in the mutation hooks and added dedicated front desk SWR hooks.

### Mutation Hooks Added (9)
| Hook | Endpoint | Purpose |
|------|----------|---------|
| `useCreateAdminUser()` | POST `/api/admin/users` | Create system user (was documented but missing) |
| `useUpdateAdminUser()` | PUT `/api/admin/users/[id]` | Update user fields (was documented but missing) |
| `useDeleteAdminUser()` | DELETE `/api/admin/users/[id]` | Soft-delete (deactivate) user (was documented but missing) |
| `useCreateProperty()` | POST `/api/properties` | Create new workspace (was documented but missing) |
| `useUpdateProperty()` | PUT `/api/properties/[id]` | Update property details (was documented but missing) |
| `useCreateVendor()` | POST `/api/vendors` | Create vendor |
| `useUpdateVendor()` | PUT `/api/vendors/[id]` | Update vendor |
| `useCreateInventoryItem()` | POST `/api/inventory/items` | Create inventory item |
| `useCreateInventoryTransaction()` | POST `/api/inventory/transactions` | Record stock movement |
| `useCreateInventoryCategory()` | POST `/api/inventory/categories` | Create inventory category |
| `useCreateWarehouse()` | POST `/api/inventory/warehouses` | Create warehouse |

### Front Desk SWR Hooks Added (5)
| Hook | Endpoint | Purpose |
|------|----------|---------|
| `useActiveBookings()` | GET `/api/reservations/active` | Active check-ins with 15s auto-refresh |
| `useGuestRequests()` | GET `/api/front-desk/requests` | Guest requests with 15s auto-refresh |
| `useFrontDeskBilling()` | GET `/api/front-desk/billing` | Billing for a reservation |
| `useCheckinChecklist()` | GET `/api/front-desk/checklist` | Check-in prerequisites |
| `useFrontDeskStats()` | GET `/api/front-desk/stats` | Front desk aggregated stats with 30s refresh |

---

## Step 21 — Vendors Standalone Module

Built on 23 June 2026. Extracted the Vendors module from its previous maintenance-only context into a standalone cross-vertical module with its own API routes, UI page, and SWR hooks.

### API Routes Created (4 files)
| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/vendors` | GET, POST | List (filter by property/status/search) + create vendor |
| `/api/vendors/[id]` | GET, PUT | Single vendor detail + update |
| `/api/vendors/services` | GET, POST | Vendor services CRUD |
| `/api/vendors/orders` | GET | Purchase orders by vendor |

### Pages Built (1)
| Page | Path | Features |
|------|------|----------|
| **Vendors** | `/dashboard/vendors` | Stats bar (total/active/pending/non-compliant), search + status filter, vendor cards with expandable rows showing services, inline "Add Service" form, Add/Edit vendor modal with all fields |

### SWR Hooks Added (4)
`useVendorsList()`, `useVendor()`, `useVendorServices()`, `useVendorOrders()`

### Mutation Hooks Added (2)
`useCreateVendor()`, `useUpdateVendor()`

### Availability
- **Roles**: super_admin, executive, property_manager, maintenance_supervisor, finance_manager
- **Verticals**: All (Hotels, Apartments, Rental, Workplace)

---

## Step 22 — User Management Module (Dedicated Page with Audit Trail)

Built on 23 June 2026. Converted the basic user management modal within the Admin overview page into a full dedicated sub-page with comprehensive audit trail integration.

### Pages Built (1)
| Page | Path | Features |
|------|------|----------|
| **User Management** | `/dashboard/admin/users` | 4-card stats bar (total/active/inactive/24h logins), search by name/email, filter by role/status/workspace, full user table with avatar + ID, role badge, workspace scope, last login (relative time), inline status toggle (activate/deactivate), Add User modal (first/last name, email, password, role, workspace), Edit User modal (name/email/role/workspace/status), Delete confirmation dialog, expandable inline audit timeline per user, full User Activity tab with severity badges and event filters |

### Key Features
- **Status Toggle**: Inline activate/deactivate with `ToggleLeft`/`ToggleRight` icons, immediate visual feedback
- **Audit Timeline**: Each user row has an expandable chevron showing recent `auditEvents` with colored timeline dots (critical=red, warning=amber, info=teal)
- **User Activity Tab**: Full audit events view with role filter, severity badges, relative timestamps
- **Role Select**: 11 system roles (super_admin, executive, property_manager, front_desk, housekeeping_supervisor, housekeeping_staff, maintenance_supervisor, maintenance_staff, hr_manager, finance_manager, workplace_facility_manager)
- **Workspace Scope**: Global or specific property from `useProperties()`

### Hooks Used
`useAdminUsers()`, `useAdminRoles()`, `useProperties()`, `useAdminAuditEvents()`, `useCreateAdminUser()`, `useUpdateAdminUser()`, `useDeleteAdminUser()`

---

## Step 23 — Inventory Management Module (Complete)

Built on 23 June 2026. Created a comprehensive Inventory Management module with database schema, API routes, UI pages, and SWR hooks — designed for cross-vertical stock tracking (maintenance parts, housekeeping supplies, F&B ingredients, office supplies).

### Database: 022_inventory_module.sql
| Table | Purpose |
|-------|---------|
| `inventory_categories` | Category tree with parent hierarchy, per-property scoping |
| `inventory_items` | Stock items with SKU, unit, quantity tracking, auto-computed total value |
| `warehouses` | Storage locations per property |
| `inventory_transactions` | Stock movement audit log with 8 transaction types (purchase_receipt, sales_issue, transfer_in/out, adjustment_add/subtract, return, damage) |

### API Routes Created (6 files)
| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/inventory/stats` | GET | Aggregated dashboard stats |
| `/api/inventory/categories` | GET, POST | Category CRUD |
| `/api/inventory/warehouses` | GET, POST | Warehouse CRUD |
| `/api/inventory/items` | GET, POST | Items listing with filters + create with auto SKU + initial transaction |
| `/api/inventory/items/[id]` | GET, PUT | Single item detail + update with auto adjustment transaction on qty change |
| `/api/inventory/transactions` | GET, POST | Transaction log with date/type filters + create with auto stock balance update |

### Pages Built (3)
| Page | Path | Features |
|------|------|----------|
| **Inventory Dashboard** | `/dashboard/inventory` | 4 KPI cards (Total Items, Total Value, Low Stock, Categories), search + category filter, items table with color-coded stock badges (green=healthy, amber=low, red=critical), Add Item + Add Category modals |
| **Inventory Items** | `/dashboard/inventory/items` | Stats bar, full item management with all columns (SKU/Name/Category/Warehouse/Qty/Reorder/Unit Cost/Total Value), Add/Edit/Stock Adjustment modals with 8 transaction types |
| **Inventory Transactions** | `/dashboard/inventory/transactions` | Transaction log with date range + type filters, inbound/outbound summary cards, color-coded table (+ green, - red) |

### SWR Hooks Added (8)
- `useInventoryCategories()`, `useInventoryItems()`, `useInventoryItem()`, `useInventoryTransactions()`, `useWarehouses()`, `useInventoryStats()`

### Mutation Hooks Added (4)
- `useCreateInventoryItem()`, `useCreateInventoryTransaction()`, `useCreateInventoryCategory()`, `useCreateWarehouse()`

### Sidebar Updates
5 new nav items added: **Users** (under Admin), **Vendors**, **Inventory**, **Inv Items**, **Inv Transactions** — accessible to appropriate roles across all verticals.

### Availability
- **Roles**: super_admin, executive, property_manager, maintenance_supervisor, housekeeping_supervisor, finance_manager
- **Verticals**: All (Hotels, Apartments, Rental, Workplace)

---

## Project Structure (Updated)

```
d:\Training\working\HMS\
├── app/
│   ├── api/
│   │   ├── vendors/                  ← Step 21: Standalone vendors module
│   │   │   ├── route.ts
│   │   │   ├── [id]/route.ts
│   │   │   ├── services/route.ts
│   │   │   └── orders/route.ts
│   │   ├── inventory/                ← Step 23: Inventory management module
│   │   │   ├── stats/route.ts
│   │   │   ├── categories/route.ts
│   │   │   ├── warehouses/route.ts
│   │   │   ├── items/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   └── transactions/route.ts
│   └── dashboard/
│       ├── vendors/                  ← Step 21: Vendors UI
│       │   └── page.tsx
│       ├── inventory/                ← Step 23: Inventory UI
│       │   ├── page.tsx
│       │   ├── items/page.tsx
│       │   └── transactions/page.tsx
│       └── admin/users/              ← Step 22: Dedicated User Management
│           └── page.tsx
├── database/
│   ├── 022_inventory_module.sql      ← Step 23: Inventory schema
│   └── seed_v4_full.sql              ← Step 24: Comprehensive workflow seed data
└── components/layout/sidebar.tsx     ← UPDATED: +5 nav items
```

---

## Step 24 — Comprehensive Seed Data (All Workflows, All Properties)

Built on 23 June 2026. Created `database/seed_v4_full.sql` — a comprehensive PL/pgSQL seed script that populates ALL modules with realistic demo data across ALL 4 properties. Designed so every user role sees live data on their dashboards with end-to-end workflows that work without flaws.

### Seeding Strategy
- **No duplicate conflicts** — Clears only tables it re-seeds (inventory, accounts, maintenance workflow, HK workflow, F&B, feedback, audit events)
- **Preserves** existing bookings, invoices, payments, guest profiles, employees, users, vendors
- **Per-property** scoping — OVH (Hotel), CSA (Serviced Apartment), GWR (Rental), ICS (Workplace/Co-working)
- **Realistic dates** — Uses `CURRENT_DATE` relative offsets so data stays fresh

### What was Seeded (by Module)

| Module | Details | Properties |
|--------|---------|:----------:|
| **Chart of Accounts** | Full COA: Assets (cash, bank, receivables, fixed assets, accum depr), Liabilities (AP, GST, salaries, deposits), Equity (retained), Income (room/F&B/other revenue), Expenses (salaries, HK supplies, maintenance, utilities, marketing, admin, depreciation) — 25 accounts per property | OVH, CSA, GWR, ICS |
| **Fiscal Years** | FY 2025-2026 (closed) + FY 2026-2027 (open) per property | All 4 |
| **Cost Centers** | FD, HK, MT, FB, Admin per property linked to departments | All 4 |
| **Journal Entries** | 90 daily revenue journal entries (OVH, 3 months) + 30 (CSA, 1 month) — each with auto-generated description, reference number, and line items (debit AR, credit Room Revenue) | OVH, CSA |
| **Budget Heads** | Room Revenue Target, Salaries, HK Supplies, Maintenance, Utilities | OVH |
| **Budget Entries** | 12 months of budget amounts for each head | OVH |
| **Vendor Bills** | 4 bills (Laundry paid, HVAC approved unpaid, Pest pending, Elevator CSA paid) with line items and 1 payment transaction | OVH, CSA |
| **Fixed Assets** | 6 assets for OVH (building, kitchen, laundry, furniture, IT servers, vehicle) + 2 for CSA (building, furniture) — each with depreciation schedule entries | OVH, CSA |
| **Tax Filings** | 6 records across OVH/CSA/GWR — filed, pending, and draft GST/TDS returns | OVH, CSA, GWR |
| **Inventory Categories** | 5 categories (Cleaning, Linens, Amenities, Maintenance, F&B) for OVH + 3 for CSA | OVH, CSA |
| **Warehouses** | Main Store, Housekeeping Pantry, Engineering Store — all with managers and phone | OVH |
| **Inventory Items** | 26 items across all categories with SKUs, reorder levels, quantities, costs, warehouse assignments | OVH |
| **Inventory Transactions** | Opening stock receipts (purchase_receipt) + monthly usage issues (adjustment_subtract) | OVH |
| **AMC Contracts** | 6 contracts (HVAC, Elevator, Pest, Plumbing for OVH; HVAC, Elevator for CSA) with dates and values | OVH, CSA |
| **Preventive Schedules** | 9 schedules (HVAC filter cleaning, fire alarm test, generator test, pool pump, elevator inspection, AC servicing, water tank cleaning, workstation sanitization) with overdue/scheduled statuses | OVH, CSA, ICS |
| **Maintenance Tickets** | 5 OVH (critical open AC, high in-progress plumbing, medium resolved TV, low closed corridor lights, high open water pressure) + 3 CSA (plumbing open, critical HVAC in-progress, electrical open) + 2 GWR (geyser open, window in-progress) + 2 ICS (projector open, coffee machine open) — with time entries, parts used, and approval logs | All 4 |
| **Housekeeping Checklists** | 6 checklists (Standard Room Clean, Deep Clean, Stayover Tidy, Post-Guest Inspection, Suite Turnaround, Apartment Inspection) — each with JSONB checklist items | OVH, CSA, GWR |
| **Linen Batches** | 8 batches across OVH and CSA (bed sheets, bath/ hand towels, bath mats, pillow cases) with clean/in_use/in_laundry statuses | OVH, CSA |
| **Linen Items** | 80 individual linen items with RFID tags and lifecycle tracking (10 per batch) | OVH |
| **Linen Transactions** | Check-out transactions for batches marked in_use | OVH |
| **Housekeeping Inspections** | 3 inspections (2 pass, 1 fail) with detailed JSONB checklist scores and inspector notes | OVH |
| **Housekeeping Tasks** | 21 tasks generated over 7 days (3 per day, random types: deep_clean/turnaround/stayover_tidy, statuses: completed/in_progress/pending) | OVH |
| **Guest Requests** | 5 requests (extra pillows resolved, room service in-progress, TV remote open, late checkout pending, maintenance open) linked to active bookings | OVH |
| **Parking Allocations** | 2 vehicles (sedan + SUV) with slot numbers, allocated to checked-in guests | OVH |
| **Guest Feedbacks** | 6 feedback entries (ratings 2-5) across housekeeping, maintenance, front_desk categories — including 1 low rating (2) that triggers maintenance triage | OVH |
| **F&B Menu** | 11 menu items (breakfast, lunch, snacks, beverages, desserts) with prices and availability | OVH |
| **F&B Orders** | 6 orders across checked-in bookings (room_service/restaurant, delivered/preparing/pending) | OVH |
| **Audit Events** | 15 system events (user logins, bookings, check-ins, tickets, payments, HK tasks, user creation, backup, inventory alerts, vendor bills, security events, compliance warnings) with severity levels and timestamps | OVH |
| **Purchase Orders** | 2 POs (Laundry delivered, HVAC pending) with line items, GRN, and GRN lines | OVH |
| **Check-in Checklists** | 11 checklist items across OVH (7) and CSA (4) including ID proof, payment, registration, key issue, WiFi, parking, welcome kit | OVH, CSA |
| **Today's Bookings** | 3 additional bookings (1 today check-in, 1 today check-out, 1 tomorrow confirmed) — ensuring current-day dashboards show data | OVH |
| **Leave Requests** | 6 leave requests across properties (4 OVH: approved casual, approved sick, pending annual, approved comp-off; 1 CSA: approved personal; 1 GWR: pending sick) with HR approval workflow | OVH, CSA, GWR |
| **Timesheets** | 28 timesheet entries (4 employees × 7 days: OVH frontdesk, OVH HK, OVH maint, CSA frontdesk) with clock-in/out and total hours | OVH, CSA |
| **Compliance Records** | 9 records (Fire Safety, Liquor License, GST, Pollution, RERA for OVH; Fire Safety, GST for CSA; RERA for GWR; Trade License for ICS) with issue/expiry dates and statuses | All 4 |
| **Employee Bank/PF/PAN** | Missing bank/PF/ESI/PAN details updated for all employees with realistic auto-generated values | All 4 |
| **Unit Status Sync** | OVH rooms synced: checked-in bookings → occupied, recent check-outs → dirty | OVH |

### Schema Audit & Bugfixes
The seed was audited against the actual DB migration schemas and **19 column-name mismatches** were corrected:

| Table | Fix Applied |
|-------|-------------|
| `preventive_schedules` | Rewrote `(title, assigned_to, next_due_date, status, notes)` → `(task_template, next_due, is_active)` |
| `maintenance_tickets` | Added `ticket_number` (UNIQUE NOT NULL) + `ticket_type` (NOT NULL) to all 14 INSERTs |
| `maintenance_ticket_parts` | `unit_cost` → `unit_price`, `total_cost` → dropped (generated), `total_price` → dropped |
| `maintenance_time_entries` | `hours_worked, description` → `notes` (duration is auto-generated) |
| `maintenance_approvals` | `action_by` → `performed_by`, `action_at, notes` → `comment` |
| `housekeeping_checklists` | Rewrote from template model `(property_id, name, category, items, is_active)` to per-task model `(task_id, item, is_checked, checked_at, checked_by)` |
| `linen_batches` | `batch_number` → `batch_id`, `status` → `lifecycle_stage`, removed `created_by` |
| `linen_transactions` | `transaction_type, issued_to, issued_at, property_id` → `from_stage, to_stage, logged_by` |
| `housekeeping_inspections` | Removed `property_id`, `checklist_data` → `checklist_items`, added `inspected_at` |
| `housekeeping_tasks` | `scheduled_date` → `scheduled_at` |
| `parking_allocations` | Removed non-existent `vehicle_type, check_in, check_out` |
| `guest_requests` | `extra_pillows` → `housekeeping`, `late_checkout` → `other` (CHECK constraint values) |
| `fiscal_years` | `is_open, created_by` → `is_closed` |
| `cost_centers` | Removed `created_by`, reordered columns to `(code, name)` order |
| `budget_heads` | Removed `account_code, created_by` |
| `budget_entries` | `property_id, month, year, created_by` → `period_month` |
| `vendor_bills` | `total_amount` → `grand_total`, removed `balance_due` (generated), added `category, paid_total` |
| `bill_line_items` | `vendor_bill_id` → `bill_id`, removed `total` (generated as `line_total`) |
| `bill_payments` | `vendor_bill_id` → `bill_id`, `payment_amount` → `amount`, `payment_mode` → `payment_method` |
| `fixed_assets` | Removed `book_value` (generated), added `asset_code` (UNIQUE NOT NULL), `useful_life_years` → `useful_life_yrs`, `asset_type` → `category` |
| `depreciation_schedule` | `depreciation_amount` → `amount`, removed `posted_at` |
| `tax_filings` | `filing_period` → `(return_type, period_start, period_end)`, `amount_paid` → `total_paid`, `notes` → `remarks` |
| `purchase_orders` | `order_date` → `po_date`, removed `expected_delivery, subtotal, tax_total`, reordered columns |
| `purchase_order_lines` | Removed `total_price` (generated as `line_total`) |
| `goods_received_notes` | Removed `property_id, status` |
| `grn_lines` | `quantity_received` → `received_qty`, removed `condition_notes` |
| `journal_entries` | `reference, status, created_at` → removed, used `journal_type, entry_date, created_by` only |
| `journal_lines` | `journal_entry_id` → `journal_id`, `account_code` → resolved via `SELECT id FROM chart_of_accounts`, `debit_amount` → `debit`, `credit_amount` → `credit` |
| `leave_requests` | Added `total_days`, `applied_on` → `created_at`, `approved_on` → `approved_at` |
| `timesheets` | Added `date` column (UNIQUE NOT NULL composite with employee_id) |

### Seed File
```
database/seed_v4_full.sql  — 1 PL/pgSQL DO block, ~905 lines
```

### How to Run
```bash
npm run seed
```
(Or manually: `psql -f database/seed_v4_full.sql`)

### User Journey Verification Checklist

| User Role | Logs In As | Dashboard Should See |
|-----------|-----------|---------------------|
| **Super Admin** | superadmin@ehms.demo | All dashboards, audit events, backup, roles, properties, users, all verticals |
| **Executive** | executive@ehms.demo | Executive overview across all verticals |
| **Property Manager** | admin@ehms.demo | OVH dashboard with 90%+ occupancy, bookings, revenue chart, 26 inventory items, 6 AMC contracts, 5 maintenance tickets, 3 POs |
| **Front Desk** | frontdesk@ehms.demo | Room matrix with occupied/vacant/dirty rooms, 8 active check-ins, 5 guest requests, 2 parking allocations, check-in checklist |
| **Housekeeping** | housekeeping@ehms.demo | 21 tasks (5 pending, 4 in-progress, 12 completed), 8 linen batches, 80 linen items, 3 inspections (2 pass, 1 fail) |
| **Maintenance** | maintenance@ehms.demo | 5 open/in-progress tickets, 4 resolved/closed, 9 preventive schedules, parts inventory with 6 low-stock alerts |
| **HR Manager** | hr@ehms.demo | 6 leave requests (4 approved, 2 pending), 28 timesheet entries, attendance records, payroll runs, compliance dashboard |
| **Finance Manager** | finance@ehms.demo | 25 chart of accounts, 90 journal entries, 4 vendor bills (1 paid), 8 fixed assets, 6 tax filings, budget vs actual, trial balance |
| **CSA Manager** | manager.csa@ehms.demo | 25 CSA units, 3 maintenance tickets, 2 linen batches, 2 AMC contracts, compliance records |
| **GWR Manager** | manager.gwr@ehms.demo | 6 lease agreements, 2 maintenance tickets, rent roll, deposit ledger |
| **ICS Manager** | manager.ics@ehms.demo | 12 coworking units, 2 maintenance tickets, workplace bookings, corporate memberships |

### Data Statistics Summary

| Entity | Count | Details |
|--------|:-----:|---------|
| Properties | 4 | OVH (48 rooms), CSA (25 suites), GWR (6 apts), ICS (12 coworking) |
| Chart of Accounts | ~52 | 25 OVH + 12 CSA + 9 GWR + 10 ICS |
| Journal Entries | 120 | 90 OVH + 30 CSA |
| Vendor Bills | 4 | 3 OVH + 1 CSA (1 paid, 2 approved, 1 pending) |
| Fixed Assets | 8 | 6 OVH + 2 CSA |
| Tax Filings | 6 | 3 OVH + 2 CSA + 1 GWR |
| Inventory Items | 26 | All OVH, 5 categories |
| Inventory Transactions | ~31 | 26 receipts + 5 issues |
| AMC Contracts | 6 | 4 OVH + 2 CSA |
| Preventive Schedules | 9 | 5 OVH + 2 CSA + 1 ICS + 1 GWR |
| Maintenance Tickets | 12 | 5 OVH + 3 CSA + 2 GWR + 2 ICS |
| Maintenance Time Entries | 7 | With hours worked |
| Maintenance Parts Used | 3 | LED bulbs, tap washers, refrigerant |
| Maintenance Approvals | 8 | Assign/resolve/close actions |
| Housekeeping Checklists | 6 | 4 OVH + 1 CSA + 1 GWR |
| Linen Batches | 8 | 6 OVH + 2 CSA |
| Linen Items | 80 | RFID-tracked |
| Linen Transactions | 6 | Check-outs |
| Housekeeping Inspections | 3 | 2 pass, 1 fail |
| Housekeeping Tasks | 21 | 7 days × 3/day |
| Guest Requests | 5 | OVH |
| Guest Feedbacks | 6 | Ratings 2-5 |
| F&B Menu Items | 11 | OVH |
| F&B Orders | 6 | OVH |
| Audit Events | 15 | All severities |
| Purchase Orders | 2 | 1 delivered, 1 pending |
| Leave Requests | 6 | 4 OVH + 1 CSA + 1 GWR |
| Timesheets | 28 | 4 employees × 7 days |
| Compliance Records | 9 | All properties |
| Check-in Checklists | 11 | 7 OVH + 4 CSA |

---

---

## Step 25 — Multi-Tenant Schema Sharding (Schema-per-Tenant Architecture)

Built on 24 June 2026. Migrated eHMS from single-schema (`public`) to **schema-per-tenant** multi-tenancy. Each tenant gets an isolated PostgreSQL schema with the complete database structure. This enables strict data isolation, independent backups, and per-tenant scaling.

### Architecture Decision: Schema-Per-Tenant

| Approach | Chosen? | Why |
|----------|:-------:|-----|
| **Schema-per-Tenant** | ✅ | Native PostgreSQL isolation, same DB connection, no app-level filtering, easy to provision new tenants via `CREATE SCHEMA ... LIKE viswa INCLUDING ALL` |
| Database-per-Tenant | ❌ | Connection pooling overhead, harder to manage migrations across N databases |
| Row-level Tenant ID | ❌ | Risk of cross-tenant data leaks if a `WHERE tenant_id =` is missed; every query must be audited |

### Migration: `database/023_multi_tenant_sharding.sql`

| Component | Details |
|-----------|---------|
| **Schema** | `viswa` — first tenant shard (Viswa Group of Estates) |
| **Registry** | `public.tenants` table tracks all tenants (id, name, code, schema_name, config) |
| **Move** | All 136+ tables, 9 ENUM types, sequences moved from `public` → `viswa` via `ALTER ... SET SCHEMA` |
| **Helper** | `public.provision_tenant_schema(name, code, schema)` — clones viswa structure for new tenants |

### Updated `scripts/migrate.mjs`

- Now creates tables directly in the `viswa` schema (via `search_path`)
- Extensions (`uuid-ossp`, `pgcrypto`) created explicitly in `public`
- After all migrations, seeds the `public.tenants` registry with Viswa Group of Estates
- Template schema approach — future tenants can be provisioned from `viswa` template

### Updated `lib/db.ts`

- `getDb()` now sets `search_path = viswa, public` via connection options
- All existing API routes continue to work without changes (no schema-qualified table names needed)
- Future: can accept a `tenantCode` parameter to route to different schema

### Tenant Onboarding Flow

```
New Tenant Request
  └─ Admin calls: SELECT provision_tenant_schema('Name', 'CODE', 'schema_name')
       └─ Creates new PostgreSQL schema with all tables (empty)
       └─ Copies ENUM types
       └─ Registers in public.tenants
       └─ Returns tenant UUID
  └─ Tenant admin: seeds master data (properties, units, users, etc.)
```

### Landing Page & Auth Updates

| Change | Details |
|--------|---------|
| **Landing Page** | `app/page.tsx` → eHMS product landing page with "Viswa Group of Estates" tenant showcase |
| **Login Page** | Moved to `app/login/page.tsx` |
| **proxy.ts** | Auth redirects now target `/login` instead of `/` |
| **globals.css** | Added premium CSS animation keyframes (gradient-shift, float, pulse-glow, slide-up, scale-in) |

### Viswa Group of Estates — Tenant Record

Seeded in `public.tenants`:

| Field | Value |
|-------|-------|
| **name** | Viswa Group of Estates |
| **code** | VISWA |
| **schema_name** | viswa |
| **config** | `{ is_primary: true, vertical_types: [hotel, service_apartment, rental_apartment, workplace] }` |

### Existing Properties (now scoped under Viswa tenant)

All 4 properties (Oceanview Hotel, Cityscape Serviced Apts, Greenwood Residency, Innovate Coworking) along with their units, bookings, employees, and all associated data now reside in the `viswa` schema, isolated under the Viswa Group of Estates tenant.

---

### v2.0 Database Structure

```
PostgreSQL Cluster
├── public schema
│   ├── tenants                    ← Tenant registry
│   ├── provision_tenant_schema()  ← Helper function
│   ├── pgcrypto extensions
│   └── uuid-ossp extensions
│
├── viswa schema  ← ⬅️ Viswa Group of Estates (first shard)
│   ├── enterprises
│   ├── regions
│   ├── properties
│   ├── units
│   ├── users
│   ├── roles
│   ├── bookings
│   ├── invoices
│   ├── ... (136+ tables, 9 ENUMs)
│   └── seed data (all properties, employees, etc.)
│
├── tenant_abc schema  ← future tenant
│   ├── properties
│   ├── units
│   ├── ... (full copy of structure, empty data)
│
└── tenant_xyz schema  ← future tenant
    ├── properties
    ├── units
    ├── ... (full copy of structure, empty data)
```

---

## Step 26 — Property Configuration & Feature Toggles

Built on 25 June 2026. Added per-property feature configuration — a JSONB settings panel on each property that toggles optional modules (restaurant, bar, gym, spa, etc.) on/off at the property level.

### Database: 025_property_config_features.sql
Documents the standard `properties.config` JSONB schema with 10 feature toggles grouped into 4 categories:

| Group | Features |
|-------|----------|
| **Property Core** | Rooms Map, Rate Card |
| **F&B** | Restaurant, Bar |
| **Guest Services** | Laundry, Maintenance |
| **Wellness** | Gym, Yoga, Swimming Pool, Spa |

Default config for all properties after migration:
```json
{
  "features": {
    "rooms_map":     { "enabled": true,  "label": "Rooms Map" },
    "rate_card":     { "enabled": true,  "label": "Rate Card" },
    "restaurant":    { "enabled": false, "label": "Restaurant" },
    "bar":           { "enabled": false, "label": "Bar" },
    "laundry":       { "enabled": true,  "label": "Laundry" },
    "maintenance":   { "enabled": true,  "label": "Maintenance" },
    "gym":           { "enabled": false, "label": "Gym" },
    "yoga":          { "enabled": false, "label": "Yoga" },
    "swimming_pool": { "enabled": false, "label": "Swimming Pool" },
    "spa":           { "enabled": false, "label": "Spa" }
  },
  "settings": { "timezone": "Asia/Kolkata", "currency": "INR" }
}
```

### API Changes (3 endpoints)

| Route | Change | Details |
|-------|--------|---------|
| `POST /api/properties` | Extended | Accepts optional `config` payload; auto-applies default features if not provided |
| `PUT /api/properties/[id]` | Extended | Supports partial `config` merge via JSONB `\|\|` operator — send only the features you want to change |
| `GET /api/properties` | Rewritten | Changed from nested tagged template literals to `sql.query()` to avoid driver compatibility issue with empty `sql\`\`` fragments that caused 500 errors |

### Pages Built (1) + Extended (1)

| Page | Path | Features |
|------|------|----------|
| **Property Detail** | `/dashboard/admin/properties/[id]` | Two tabs: **Overview** (property details, buildings list, feature status sidebar) + **Configuration** (10 grouped feature toggles with individual save/reset) |
| **Properties** (extended) | `/dashboard/admin/properties` | Collapsible "Configure Feature Settings" section in Add/Edit modal with toggle buttons for all 10 features; Settings icon on property cards navigates to detail page |

### Hooks Added (2)

| Hook | Purpose |
|------|---------|
| `usePropertyFeatures(propertyId)` | Returns `{ features, isFeatureEnabled(key), isLoading }` — any module can conditionally render UI based on feature state |
| `useUpdatePropertyConfig()` | Mutation to update config without touching other property fields |

### Architecture

- **Storage**: Uses the existing `properties.config` JSONB column (was defined but previously unused in the schema)
- **Migration**: `scripts/apply-025.mjs` applies defaults to all existing properties
- **Workflow Integration**: `isFeatureEnabled("restaurant")` pattern allows any module to show/hide UI based on property config
- **Build Verification**: `npx next build` passes with 149 static routes and zero type errors

---

## Step 27 — Vercel Build Fix: Resend Lazy Initialization

Built on 27 June 2026. Fixed a Vercel deployment crash caused by module-level `new Resend()` evaluation during build.

### Problem
`lib/email.ts` instantiated Resend at module level:
```ts
const resend = new Resend(process.env.RESEND_API_KEY || "");
```
During `next build`, the module is evaluated. If `RESEND_API_KEY` is not set in the build environment (or empty), `new Resend("")` throws `Error: Missing API key` — crashing the build.

### Fix
Replaced eager singleton with lazy initialization via `getResend()`:
- The `Resend` constructor is only called when an email function is first invoked at runtime
- If `RESEND_API_KEY` is absent, `getResend()` returns `null` and all 4 `send*` functions skip silently
- Build no longer depends on runtime env vars being present

### Files Changed
- `lib/email.ts` — added `getResend()` function; each send function now calls it and guards against null

### Vercel Env Required
For actual emails in production, add to Vercel:
```
RESEND_API_KEY
RESEND_FROM
```

---

*Working.md — eHMS Project • Created 18 June 2026 • Updated 27 June 2026*
