# eHMS User Manual

## Enterprise Hospitality Management System

---

# Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Getting Started](#2-getting-started)
3. [Multi-Tenant Shard Architecture](#3-multi-tenant-shard-architecture)
4. [Platform Administration](#4-platform-administration)
5. [Authentication & Roles](#5-authentication--roles)
6. [Journey / Vertical Context](#6-journey--vertical-context)
7. [Dashboard](#7-dashboard)
8. [Front Desk Module](#8-front-desk-module)
9. [Hotels Module](#9-hotels-module)
10. [Serviced Apartments Module](#10-serviced-apartments-module)
11. [Apartment Rental Module](#11-apartment-rental-module)
12. [Workplace Services Module](#12-workplace-services-module)
13. [Housekeeping Module](#13-housekeeping-module)
14. [Maintenance Module](#14-maintenance-module)
15. [Finance Module](#15-finance-module)
16. [HRMS Module](#16-hrms-module)
17. [Vendors Module](#17-vendors-module)
18. [Inventory Module](#18-inventory-module)
19. [Admin Module](#19-admin-module)
20. [Accounts Module](#20-accounts-module)
21. [Troubleshooting](#21-troubleshooting)

---

# 1. Platform Overview

**eHMS** (Enterprise Hospitality Management System) is a subscription-based, multi-tenant platform serving four business verticals:

| Vertical | Label | Use Case |
|----------|-------|----------|
| Hotels & Resorts | `hotels` | Traditional hotel operations |
| Serviced Apartments | `apartments` | Short-to-medium stay apartment management |
| Apartment Rental | `rental` | Long-term rental property management |
| Workplace Services | `workplace` | Office/facility management, co-working |

## Key Architecture Concepts

- **Multi-Tenant Schema Sharding** — Each organization (tenant) gets an isolated PostgreSQL schema with its own tables, users, and data.
- **Platform Superadmin** — A separate authentication layer (`public.platform_admins`) that manages tenant lifecycle across all shards.
- **Vertical Subscription** — Each tenant subscribes to a subset of verticals. The sidebar and navigation adapt dynamically.
- **JWT-Based Auth** — httpOnly cookie `ehms_token` carries user identity, role, tenant context, and platform admin flag.

---

# 2. Getting Started

## 2.1 Access the Platform

**Production URL:** `https://ehms-app.vercel.app`

## 2.2 Test Credentials

### Shard Demo Users (Password: `Demo@1234`)

These users exist inside **every** tenant shard (VISWA, GRT, etc.):

| Role | Email |
|------|-------|
| Super Admin | `superadmin@ehms.demo` |
| Property Manager | `admin@ehms.demo` |
| Executive | `executive@ehms.demo` |
| Front Desk | `frontdesk@ehms.demo` |
| Housekeeping | `housekeeping@ehms.demo` |
| Maintenance | `maintenance@ehms.demo` |
| HR Manager | `hr@ehms.demo` |
| Finance Manager | `finance@ehms.demo` |

### Platform Superadmin Credentials

| Email | Password |
|-------|----------|
| `admin@ehms.co` | `Platform@1234` |

This account exists in the `public.platform_admins` table (not inside any tenant shard) and manages all tenants.

## 2.3 Login Workflow

### Path A: Regular Tenant (SHARD) User

```
Landing Page (/) → Login Page (/login)
  → Pick org from tenant shard grid
  → Login Form (/login?tenant=CODE)
    → Enter email + password
    → POST /api/auth/login
    → Dashboard (/dashboard or /dashboard/{vertical})
```

### Path B: Platform Superadmin

```
Landing Page (/) → Login Page (/login)
  → Click "Platform Admin Sign In" (gold border button)
  → Modal login (email + password)
  → POST /api/auth/platform-login
  → Admin Dashboard (/dashboard/admin/tenants)
```

**Key difference:** Platform superadmin is NEVER asked to select a tenant shard.

---

# 3. Multi-Tenant Shard Architecture

## 3.1 What is a Shard?

Each tenant (organization) runs on an **isolated PostgreSQL schema**:

- `viswa` — Viswa Group of Estates
- `grt` — GRT Hotels (provisioned)
- `raintree` — Raintree Properties (provisioned)
- etc.

Each schema contains **136+ tables** + **9 ENUM types** cloned from the `viswa` template. Data never crosses schema boundaries.

## 3.2 Tenant Selection (on Login Page)

**URL:** `/login` (no `?tenant=` param)

The `/login` page serves as the tenant selection entry point when no tenant is pre-selected. It displays:

- All provisioned tenant shards as org cards
- Each card shows: organization name, shard code, subscribed vertical badges
- **Suspended** tenants are greyed out with a "Suspended" badge
- Click any active tenant → URL updates to `/login?tenant=CODE` and shows the login form
- Below the grid, a **"Platform Admin Sign In"** button (gold border, lock icon) opens a modal for platform superadmin login (bypasses tenant selection entirely)

## 3.3 Provisioning a New Shard

Click **"Platform Admin Sign In"** at the bottom of `/login` (or go to `/dashboard/admin/tenants` if already logged in as platform superadmin).

After authenticating as platform superadmin, fill in:

| Field | Description | Example |
|-------|-------------|---------|
| Organization Name | Display name | "GRT Hotels" |
| Code | Unique short code (uppercase) | `GRT` |
| Schema | PostgreSQL schema name (lowercase) | `grt` |
| Subscribed Features | Checkboxes for verticals | Hotels, Apartments, ... |

Click **"Create Tenant Shard"**. The system:

1. Clones all 136+ tables from the `viswa` template schema
2. Copies all 9 ENUM types
3. Seeds demo users (same demo emails/passwords)
4. Records the tenant in `public.tenants` with config

After success, you are redirected to `/login?tenant=CODE`.

---

# 4. Platform Administration

## 4.1 Platform Superadmin

The **Platform Superadmin** is not a user inside any shard — they authenticate via the `public.platform_admins` table at the platform level.

**Login:** `/login` → click **"Platform Admin Sign In"** button (gold border) → modal login

Or navigate directly to `/dashboard/admin/tenants` if already authenticated.

## 4.2 Tenant Management Dashboard

**URL:** `/dashboard/admin/tenants` (platform superadmin only)

Features:

- **List all tenants** — see name, code, schema, status, subscribed verticals
- **Edit a tenant** — modal allows:
  - Changing organization name, contact email, domain
  - Toggling subscribed verticals
  - **Suspending / Unsuspending** the tenant
- **Suspend** — sets `config.suspended: true`. All login attempts to this tenant receive a **403 "Account Suspended"** page.

## 4.3 Suspension Flow

When a tenant is suspended:

- `/login?tenant=CODE` shows "Account Suspended" screen
- Existing JWTs are not invalidated (but the suspension is checked at login time only)
- To restore: platform admin unsuspends via Edit Tenant modal

---

# 5. Authentication & Roles

## 5.1 Login Flow

**URL:** `/login` (two modes)

### Mode 1: No `?tenant=` param — Tenant Selection Grid

Shows all provisioned tenant shards as org cards. Pick one → URL updates to `/login?tenant=CODE`.

Below the grid, a **"Platform Admin Sign In"** button opens a modal for platform superadmin login (bypasses tenant selection).

### Mode 2: `?tenant=CODE` — Login Form

| Guard | Behavior |
|-------|----------|
| Invalid tenant code | Shows "Invalid Organization" screen |
| Suspended tenant | Shows "Account Suspended" screen |
| Valid tenant | Shows login form with tenant badge, subscribed vertical badges, vertical workspace selector |

**On successful login:**
1. JWT stored in httpOnly cookie `ehms_token`
2. Frontend receives `{ tenant_verticals, tenant_name, user, ... }`
3. Redirects to `/dashboard` or `/dashboard/{activeJourney}`
4. Every subsequent API request carries `x-tenant-schema` header (set by proxy.ts) to scope queries to the correct schema

### Mode 3: Platform Superadmin (via modal)

1. Click "Platform Admin Sign In" on `/login`
2. Modal opens — enter platform admin email + password
3. `POST /api/auth/platform-login` — no tenant context required
4. On success → JWT with `is_platform_admin: true` cookie set
5. Redirects to `/dashboard/admin/tenants`

## 5.2 Role-Based Access Control (RBAC)

| Role | Scope |
|------|-------|
| `super_admin` | Full access to all modules |
| `executive` | Read-only + management across all modules |
| `property_manager` | Property-level management, Admin |
| `front_desk` | Front Desk operations (check-in/out, billing) |
| `housekeeping_supervisor` | Housekeeping management |
| `housekeeping_staff` | Housekeeping tasks |
| `maintenance_staff` | Maintenance tickets |
| `maintenance_supervisor` | Maintenance management |
| `hr_manager` | HR full access |
| `hr_executive` | HR operations |
| `employee_manager` | Timesheets, leave |
| `finance_manager` | Finance full access |
| `finance_executive` | Finance operations |
| `security_staff` | Workplace security |
| `vendor_user` | Vendor portal |
| `workplace_facility_manager` | Workplace facility management |
| `platform_super_admin` | Tenant management (platform-level) |

## 5.3 Signup

**URL:** `/signup`

Self-registration with role selection. Allowed roles: `super_admin`, `executive`, `property_manager`, `front_desk`, `housekeeping_staff`, `maintenance_staff`, `hr_manager`, `finance_manager`, `workplace_facility_manager`.

Password minimum: 8 characters.

---

# 6. Journey / Vertical Context

## 6.1 What is a Journey?

A **Journey** is the active business vertical context. When you log in, the tenant's subscribed verticals determine which journeys are available.

The journey filter is shown as a dropdown at the top of the sidebar. Available journeys depend on what the tenant has subscribed to.

## 6.2 Journey-Aware Navigation

- **"all"** — shows all modules
- **"hotels"** — shows Hotels, Front Desk, Housekeeping, Maintenance, Finance, HR
- **"apartments"** — similar to hotels (without Hotels vertical nav)
- **"rental"** — Rental-specific view, limited nav
- **"workplace"** — Workplace-specific view

Switching the journey at login changes the sidebar items and page routing for the Dashboard link.

---

# 7. Dashboard

**URL:** `/dashboard`

The dashboard landing page shows:

- **Summary cards** — today's check-ins, check-outs, occupancy, maintenance tickets
- **Pending tasks** — based on role (front desk tasks, HK tasks, maintenance tickets)
- **Quick actions** — common operations based on role
- **Recent activity** — audit trail snippets

Dashboard URL changes based on active journey:
- `/dashboard` (for "all")
- `/dashboard/hotels`
- `/dashboard/apartments`
- `/dashboard/rental`
- `/dashboard/workplace`

---

# 8. Front Desk Module

**Role access:** `super_admin`, `executive`, `front_desk`

## 8.1 Command Center (`/dashboard/front-desk`)

Central hub for front desk operations. View today's arrivals, departures, in-house guests, and room status.

## 8.2 Guest Profiles (`/dashboard/front-desk/guests`)

- Create, edit, search guest profiles
- View guest history (past stays, preferences, feedback)
- Link bookings to guest profiles

## 8.3 Check-Ins (`/dashboard/front-desk/check-ins`)

- Process check-in for expected arrivals
- Assign rooms
- Collect ID proofs and signatures

## 8.4 Billing & Folio (`/dashboard/front-desk/billing`)

- Create and manage guest folios
- Post charges (room, F&B, laundry, mini-bar)
- Process payments and settlements
- Generate invoices

## 8.5 F&B / Pantry (`/dashboard/front-desk/f-and-b`)

- Room service orders
- Mini-bar tracking
- Pantry stock for serviced apartments

## 8.6 Requests (`/dashboard/front-desk/requests`)

- Guest requests (extra towels, wake-up call, etc.)
- Assign to housekeeping or maintenance
- Track resolution status

## 8.7 Feedbacks (`/dashboard/front-desk/feedbacks`)

- Log guest feedback during/after stay
- Categorize by type (service, cleanliness, amenities)
- Generate feedback reports

---

# 9. Hotels Module

**Role access:** `super_admin`, `executive`, `property_manager`

## 9.1 Hotels Dashboard (`/dashboard/hotels`)

Property-level hotel management: room inventory, rate plans, availability calendar.

Features:
- Room types and rate management
- Booking calendar
- OTA integration management
- Occupancy forecasting

---

# 10. Serviced Apartments Module

**Role access:** `super_admin`, `executive`, `property_manager`

**URL:** `/dashboard/apartments`

Manage serviced apartment inventory:
- Apartment unit management (layout, amenities)
- Pricing tiers for short/medium stays
- Booking management
- Move-in/move-out workflows

---

# 11. Apartment Rental Module

**Role access:** `super_admin`, `executive`, `property_manager`

**URL:** `/dashboard/rental`

Long-term rental management:
- Lease agreements
- Rent collection schedules
- Tenant onboarding/offboarding
- Maintenance requests from tenants

---

# 12. Workplace Services Module

**Role access:** `super_admin`, `executive`, `property_manager`, `workplace_facility_manager`, `security_staff`

**URL:** `/dashboard/workplace`

Office and co-working space management:
- Desk/hotdesk booking
- Meeting room scheduling
- Visitor management
- Access control integration
- Facility amenities management

---

# 13. Housekeeping Module

**Role access:** `super_admin`, `executive`, `housekeeping_supervisor`, `housekeeping_staff`

## 13.1 Housekeeping Dashboard (`/dashboard/housekeeping`)

Overview of cleaning tasks, room statuses, and staff assignments.

## 13.2 HK Tasks (`/dashboard/housekeeping/tasks`)

- View assigned tasks
- Update task status (pending, in-progress, completed, inspected)
- Priority-based task list

## 13.3 Linen Management (`/dashboard/housekeeping/linen`)

- Linen inventory tracking
- Linen exchange/laundry cycles
- Par stock management

## 13.4 Inspections (`/dashboard/housekeeping/inspections`)

- Room inspection checklist
- Pass/fail inspection logging
- Supervisor sign-off

## 13.5 HK Staff (`/dashboard/housekeeping/staff`)

- Staff roster management
- Shift assignments
- Productivity tracking

---

# 14. Maintenance Module

**Role access:** `super_admin`, `executive`, `maintenance_staff`, `maintenance_supervisor`

## 14.1 Maintenance Dashboard (`/dashboard/maintenance`)

Overview of open tickets, pending work orders, asset health.

## 14.2 Tickets (`/dashboard/maintenance/tickets`)

- Create maintenance tickets
- Categorize (plumbing, electrical, HVAC, carpentry, etc.)
- Assign to staff or vendors
- Track resolution with timestamps

## 14.3 Parts Inventory (`/dashboard/maintenance/parts`)

- Spare parts and consumables catalog
- Stock levels and reorder alerts
- Parts issuance against tickets

## 14.4 Assets (`/dashboard/maintenance/assets`)

- Asset register (equipment, machinery, fixtures)
- Warranty tracking
- Preventive maintenance schedules
- Asset health monitoring

---

# 15. Finance Module

**Role access:** `super_admin`, `executive`, `finance_manager`, `finance_executive`

**URL:** `/dashboard/finance`

Core financial operations:
- Payment reconciliation
- Invoice generation
- Expense tracking
- Revenue reports
- Bank reconciliation

---

# 16. HRMS Module

**Role access:** `super_admin`, `executive`, `hr_manager`, `hr_executive`, `employee_manager`

## 16.1 HR Dashboard (`/dashboard/hr`)

Employee metrics, attendance summary, pending approvals.

## 16.2 Employees (`/dashboard/hr/employees`)

- Employee master data
- Document management
- Onboarding/offboarding workflows
- Organizational hierarchy

## 16.3 Timesheets (`/dashboard/hr/timesheet`)

- Daily timesheet entry
- Approval workflow
- Overtime calculation

## 16.4 Leave Management (`/dashboard/hr/leave`)

- Leave application and approval
- Leave balance tracking
- Leave calendar

## 16.5 Payroll (`/dashboard/hr/payroll`)

- Salary structure management
- Payroll processing
- Payslip generation
- Tax deduction management

## 16.6 Compliance (`/dashboard/hr/compliance`)

- Statutory compliance (PF, ESI, PT, etc.)
- Compliance calendar
- Document repository

## 16.7 Masters (`/dashboard/hr/masters`)

- Department master
- Designation master
- Shift master
- Holiday calendar

## 16.8 Policies (`/dashboard/hr/policies`)

- Company policy documents
- Policy acknowledgments
- Version control

## 16.9 Appraisal (`/dashboard/hr/appraisal`)

- Appraisal cycles
- Goal setting
- Performance reviews

## 16.10 Compensation (`/dashboard/hr/compensation`)

- Compensation benchmarking
- Salary revision workflow
- Bonus and incentive management

---

# 17. Vendors Module

**Role access:** `super_admin`, `executive`, `property_manager`, `maintenance_supervisor`, `maintenance_staff`, `finance_manager`

**URL:** `/dashboard/vendors`

- Vendor registration and onboarding
- Vendor categorization (maintenance, supplies, services)
- Contract management
- Performance ratings
- Purchase order management

---

# 18. Inventory Module

**Role access:** `super_admin`, `executive`, `property_manager`, `maintenance_supervisor`, `housekeeping_supervisor`, `finance_manager`

## 18.1 Inventory Dashboard (`/dashboard/inventory`)

Stock overview, low-stock alerts, valuation.

## 18.2 Items (`/dashboard/inventory/items`)

- Item catalog with categories
- Unit of measure management
- Reorder levels and par stock

## 18.3 Transactions (`/dashboard/inventory/transactions`)

- Stock receipt (GRN)
- Stock issue
- Stock transfer between properties
- Stock adjustment (write-off, damage)

---

# 19. Admin Module

**Role access:** `super_admin`, `executive`, `property_manager`

## 19.1 Workspaces / Properties (`/dashboard/admin/properties`)

CRUD for properties (hotels, apartment complexes, office buildings):
- Property name, address, contact
- Vertical assignment
- Active/inactive status

## 19.2 Roles (`/dashboard/admin/roles`)

- View all system roles
- Role-permission mapping
- Custom role creation

## 19.3 Users (`/dashboard/admin/users`)

- User management across the tenant
- Role assignment
- Activate/deactivate users
- Reset passwords

## 19.4 Audit Trail (`/dashboard/admin/audit`)

- Immutable audit log of all system events
- Filters by user, action, date range
- Export functionality

## 19.5 Backup (`/dashboard/admin/backup`)

- On-demand backup jobs
- Backup schedule management
- Restore from backup

## 19.6 Tenants (`/dashboard/admin/tenants`)

Platform superadmin only. See [Section 4 — Platform Administration](#4-platform-administration).

---

# 20. Accounts Module

**Role access:** `super_admin`, `executive`, `finance_manager`

The Accounts module provides full financial accounting:

## 20.1 Chart of Accounts (`/dashboard/finance/accounts`)

Hierarchical account tree:
- Assets, Liabilities, Equity, Income, Expenses
- Account codes and types
- Opening balances

## 20.2 Journal (`/dashboard/finance/journal`)

- Journal entry creation
- Debit/credit entry lines
- Approval workflow

## 20.3 Ledger (`/dashboard/finance/ledger`)

- General ledger view
- Filter by account, date range
- Running balance

## 20.4 Receivables (`/dashboard/finance/receivables`)

- Customer invoices
- Payment tracking
- Aging reports

## 20.5 Payables (`/dashboard/finance/payables`)

- Vendor bills
- Bill payments
- Aging reports

## 20.6 Budget (`/dashboard/finance/budget`)

- Budget head definition
- Budget entry creation
- Budget vs actual reports

## 20.7 Tax (`/dashboard/finance/tax`)

- Tax filing records
- Tax liability calculation
- GST/TDS/TCS management

## 20.8 Fixed Assets (`/dashboard/finance/assets`)

- Asset register
- Depreciation schedule (SLM, WDV)
- Asset disposal

## 20.9 Reports (`/dashboard/finance/reports`)

- Trial Balance
- Profit & Loss
- Balance Sheet
- Cash Flow
- Account statements

## 20.10 Settings (`/dashboard/finance/settings`)

- Fiscal year management
- Cost centers
- Accounting preferences

---

# 21. Troubleshooting

## 21.1 "No Organization Selected" on Login

Ensure the URL includes `?tenant=CODE`. Example: `/login?tenant=VISWA`.

## 21.2 "Account Suspended" on Login

Your organization has been suspended by the platform administrator. Contact your platform admin at `admin@ehms.co`.

## 21.3 Can't See Some Modules

- The tenant may not subscribe to that vertical (contact platform admin)
- Your role may not have access to that module
- Try switching the journey filter at login

## 21.4 Forgot Password

Currently there is no self-service password reset. Contact your tenant's super admin to reset.

## 21.5 Session Expired

The JWT token expires after 7 days. Log in again.

## 21.6 ERR_INVALID_HTTP_RESPONSE / Connection Reset

This usually relates to WebSocket/`_next/webpack-hmr` issues in development. The `proxy.ts` matcher excludes `_next` paths. If you see this in production, clear browser cache and reload.

---

*eHMS — Enterprise Hospitality Management System*
*Document version 1.0 — June 2026*
