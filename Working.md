# eHMS — Project Working Document

> **Enterprise Hospitality Management System**
> Full progress log from project start to current state.
> Last updated: 18 June 2026

---

## Project Overview

| Item | Detail |
|---|---|
| **Project** | eHMS — Enterprise Hospitality Management System |
| **Stack** | Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (PostgreSQL) |
| **Local dev** | `http://localhost:3000` |
| **Live URL** | https://ehms-app.vercel.app |
| **Vercel project** | https://vercel.com/aiservicesselvakumar-8945s-projects/frontend |
| **Git** | Local repo at `d:\Training\working\HMS\frontend` |
| **Database schemas** | `d:\Training\working\HMS\database\` (12 SQL files) |

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
│   └── seed.sql                     ← Demo data
│
└── frontend/
    ├── app/
    │   ├── page.tsx                 ← Login with 7 demo users (all roles)
    │   ├── layout.tsx
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
    │       └── leases/              ← NEW: Lease API endpoint
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
    │   ├── supabase/
    │   │   ├── client.ts            ← Browser Supabase client
    │   │   ├── server.ts            ← Server Supabase client (SSR)
    │   │   ├── db.ts                ← API route type helper
    │   │   └── types.ts             ← TypeScript types for all 12 tables
    │   ├── hooks/
    │   │   ├── index.ts             ← All SWR data hooks (+ useLeases, useProperties)
    │   │   └── mutations.ts         ← NEW: CRUD mutation hooks
    │   ├── auth-context.tsx         ← NEW: Auth context + useAuth hook
    │   ├── role-access.ts          ← NEW: RBAC access map + demo role mapping
    │   └── reference-constants.ts  ← NEW: Shared UI constants + utilities
    ├── middleware.ts                 ← RBAC middleware
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
- Simplified to **5 primary nav items**: Dashboard, Reservations, Guests, Reports, Settings
- "More →" toggle reveals full 9-item nav
- **Active state**: `3px solid #2BAE8E` left border + `rgba(255,255,255,0.10)` white bg
- Floating teal collapse toggle button on right edge
- Property selector dropdown at bottom

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

## Step 6 — Database Integration (Supabase)

### Why Supabase?
- Hosted PostgreSQL 15 — fully compatible with all 12 existing SQL schemas
- Supports: `uuid-ossp`, `pgcrypto`, RLS, `GENERATED ALWAYS AS`, indexes
- Built-in Auth (email + password, JWT, cookie sessions)
- JavaScript SDK for Next.js
- Free tier sufficient for development and early production

### Packages installed
```bash
npm install @supabase/supabase-js @supabase/ssr swr
```

### Architecture
```
Browser → SWR Hook → fetch() → Next.js API Route → Supabase (service role)
                                                              │
                                                    PostgreSQL tables
```

### New Files Created

#### `lib/supabase/`
| File | Purpose |
|---|---|
| `client.ts` | Browser-safe Supabase client (anon key) |
| `server.ts` | Server-side client with SSR cookie handling |
| `db.ts` | Escape hatch for API routes (typed as `any`) |
| `types.ts` | Full TypeScript types for all 12 DB tables |

#### `middleware.ts`
- Refreshes session on every request via Supabase SSR
- Unauthenticated → `/dashboard/*` redirected to `/`
- Authenticated → `/` redirected to `/dashboard`

#### API Routes (`app/api/`)

| Route | Methods | Key Tables |
|---|---|---|
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
useLeases(filters)       // Lease agreements  [NEW]
```

#### Mutation Hooks (`lib/hooks/mutations.ts`) [NEW]
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

## Step 7 — RBAC + Auth System [NEW]

### Auth Context (`lib/auth-context.tsx`)
- `AuthProvider` wraps all dashboard pages
- `useAuth()` hook exposes: `user`, `profile`, `role`, `isLoading`, `isAuthenticated`, `signOut()`
- Looks up `public.users` table by email to get `role_name`
- No Supabase RLS dependency

### Role Access (`lib/role-access.ts`)
- `ROLE_ACCESS` map: defines which pages each role can access
- `ROLE_LABELS`: human-readable role names
- `DEMO_ROLE_MAP`: email → role mapping for 7 demo users
- `hasAccess(role, path)`: utility to check page access

### Middleware RBAC (`middleware.ts`)
- Reads `DEMO_ROLE_MAP` by email from session
- Redirects unauthorized users to `/dashboard`
- Protects all `/dashboard/*` routes

### Demo Users (Login Page)
| Role | Email | Pages |
|---|---|---|
| Super Admin | superadmin@ehms.demo | All pages |
| Front Desk | frontdesk@ehms.demo | Dashboard, Front Desk, Reservations, Guests |
| Housekeeping | housekeeping@ehms.demo | Dashboard, Housekeeping |
| Maintenance | maintenance@ehms.demo | Dashboard, Maintenance |
| Executive | executive@ehms.demo | Dashboard, all operational read-only |
| HR Manager | hr@ehms.demo | Dashboard, HR |
| Finance Manager | finance@ehms.demo | Dashboard, Finance |

Password for all: `Demo@1234`

---

## Step 8 — Layout Components [Enhanced]

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
| Employees | 5 (one per role) |
| Demo users (auth) | 6 (`@ehms.demo`, password: `Demo@1234`) |

---

## Git Commit History

| Hash | Message |
|---|---|
| `fe7691f` | Initial commit from Create Next App |
| `55a7dbe` | feat: apply eHMS theme, redesign dashboard, sidebar, header |
| `fd0b913` | feat: full database integration with Supabase |

---

## Pending Steps (Needs Your Action)

### Step A — Create Supabase project
1. Go to [https://supabase.com](https://supabase.com) → **Start your project**
2. Sign in → **New project** → Name: `ehms`, Region: Singapore
3. Wait ~2 minutes for provisioning
4. Go to **Settings → API** → copy `Project URL` + `anon public key` + `service_role key`

### Step B — Create `.env.local`
Create `d:\Training\working\HMS\frontend\.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step C — Run SQL schemas in Supabase SQL Editor
Run in order:
```
001_core_schema.sql  →  002  →  003  →  004  →  005  →  006
→  007  →  008  →  009  →  010  →  011  →  012  →  seed.sql
```

### Step D — Create demo auth users
Supabase Dashboard → **Authentication → Users → Add user** (7 users):
```
superadmin@ehms.demo    Demo@1234
frontdesk@ehms.demo     Demo@1234
housekeeping@ehms.demo  Demo@1234
maintenance@ehms.demo   Demo@1234
executive@ehms.demo     Demo@1234
hr@ehms.demo            Demo@1234
finance@ehms.demo       Demo@1234
```

### Step E — Add env vars to Vercel + redeploy
```bash
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
| Charts | Vanilla SVG (custom) | — |
| Data fetching | SWR | latest |
| Mutations | SWR + global cache invalidation | latest |
| Database | PostgreSQL (via Supabase) | 15 |
| Auth | Supabase Auth + custom RBAC | latest |
| ORM/Client | @supabase/supabase-js + @supabase/ssr | latest |
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

## Gap Analysis

### What's Complete
- Full theme rebrand (SAMP → eHMS)
- Logo integration across all surfaces
- Dashboard redesign matching reference
- Vercel deployment with custom domain
- 12 SQL schemas + seed data
- Supabase integration with 10 API routes
- SWR data hooks for all modules
- Auth system with 7 demo roles
- RBAC middleware, sidebar filtering, route protection
- Profile dropdown with logout
- All 10 dashboard pages >500 lines each with live data wiring
- Mutation hooks (check-in, check-out, create, update)
- Lease API endpoint
- Shared utility constants

### What Needs Your Action
1. Create Supabase project (free tier)
2. Set `.env.local` with Supabase credentials
3. Run all 12 SQL schemas + seed data in order
4. Create 7 demo auth users in Supabase Auth dashboard
5. Deploy to Vercel with env vars
6. Install and configure PostgreSQL locally for development (optional)

---

*Working.md — eHMS Project · Created 18 June 2026*
