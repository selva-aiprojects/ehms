# eHMS — Project Working Document

> **Enterprise Hospitality Management System**
> Full progress log from project start to current state.
> Last updated: 19 June 2026

---

## Project Overview

| Item | Detail |
|---|---|
| **Project** | eHMS — Enterprise Hospitality Management System |
| **Stack** | Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · NeonDB (PostgreSQL) |
| **Local dev** | `http://localhost:3001` |
| **Live URL** | https://ehms-app.vercel.app |
| **Vercel project** | https://vercel.com/aiservicesselvakumar-8945s-projects/frontend |
| **Git** | Local repo at `d:\Training\working\HMS\frontend` |
| **Database schemas** | `d:\Training\working\HMS\database\` (12 SQL files) |


---

## Domain & Workflow Overview

eHMS is a **subscription-based** Enterprise Hospitality and Facilities Management system serving four major verticals:
1. **Hotels**
2. **Serviced Apartments**
3. **Apartment Management (Long-term Rental)**
4. **Workplace Services Management**

### The Complete End-to-End Workflow:
1. **OTAs & Bookings:** Hospitality vendors/OTAs (e.g., MakeMyTrip, GoIbibo) and end-users initiate the journey via advanced bookings or walk-ins. Features, grades, and levels are dictated by the price/tier of the room/flat.
2. **Visitor Management:** Once booked, guests/visitors are formally checked in through the **Frontdesk** with comprehensive visitor management.
3. **Facilities Management:** The guest's presence triggers downstream operational workflows. **Facilities administrators**, **Housekeeping**, and **Maintenance vendors** collaborate to maintain the property. Maintenance incorporates vendor availability and repair planning.
4. **Back-Office Processes:** All operational tasks are tied back to **HR processes** (employee attendance, shift rotations, and salary processing) and an integrated **Finance workflow** (ledger, invoices, payments, reconciliation).

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
│   └── seed.sql                     ← Demo data (passwords via pgcrypto crypt())
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
    │   │   └── admin/               ← System admin + compliance (503 lines)
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
| `/api/hr/employees` | GET | `employees`, `departments`, `users` |
| `/api/properties` | GET | `properties` + occupancy calc |
| `/api/leases` | GET | `leases` + optional filters |

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
useStats()               // Dashboard KPIs — auto-refreshes every 30s
useReservations(filters) // Paginated booking list
useGuests(search, page)  // Guest search + pagination
useHousekeeping(filters) // Task board — auto-refreshes every 15s
useMaintenance(filters)  // Ticket list
useFinance(propertyId)   // Revenue + invoices
useEmployees(search)     // HR staff
useProperties(vertical)  // Property occupancy
useLeases(filters)       // Lease agreements
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
|---|---|
| `fe7691f` | Initial commit from Create Next App |
| `55a7dbe` | feat: apply eHMS theme, redesign dashboard, sidebar, header |
| `fd0b913` | feat: full database integration (originally Supabase) |
| *(current)* | fix: migrate to NeonDB, fix login (pgcrypto compat), fix sidebar RBAC, fix hydration |

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

### What May Need Attention
1. Run `seed.sql` in Neon if demo data is missing
2. Set `DATABASE_URL` + `JWT_SECRET` in Vercel env vars for production
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

---

*Working.md — eHMS Project · Created 18 June 2026 · Updated 20 June 2026*
