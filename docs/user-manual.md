# eHMS — User Manual

> **Enterprise Hospitality Management System**  
> Platform v1.0 — June 2026

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Getting Started — Login Flow](#2-getting-started--login-flow)
3. [Role-Based Journeys](#3-role-based-journeys)
   - [3.1 Platform Superadmin](#31-platform-superadmin)
   - [3.2 Tenant Superadmin](#32-tenant-superadmin)
   - [3.3 Property Manager](#33-property-manager)
   - [3.4 Executive](#34-executive)
   - [3.5 Front Desk](#35-front-desk)
   - [3.6 Housekeeping Staff](#36-housekeeping-staff)
   - [3.7 Maintenance Staff](#37-maintenance-staff)
   - [3.8 HR Manager](#38-hr-manager)
   - [3.9 Finance Manager](#39-finance-manager)
4. [Sidebar Navigation](#4-sidebar-navigation)
5. [Dashboard Overview](#5-dashboard-overview)
6. [Module Workflows](#6-module-workflows)
   - [6.1 Front Desk & Command Center](#61-front-desk--command-center)
   - [6.2 Housekeeping](#62-housekeeping)
   - [6.3 Maintenance](#63-maintenance)
   - [6.4 Human Resources (HRMS)](#64-human-resources-hrms)
   - [6.5 Finance & Accounts](#65-finance--accounts)
   - [6.6 Procurement & Vendors](#66-procurement--vendors)
   - [6.7 Inventory](#67-inventory)
   - [6.8 Administration](#68-administration)
7. [Cross-Cutting Features](#7-cross-cutting-features)
8. [Demo Credentials](#8-demo-credentials)

---

## 1. System Overview

eHMS is a subscription-based Hospitality and Facilities Management platform serving four verticals:

| Vertical | Description | Examples |
|---|---|---|
| **Hotels** | Traditional hotel & resort operations | Oceanview Hotel, Grand Palace |
| **Serviced Apartments** | Short-term managed apartments | Cityscape Apts |
| **Apartment Rental** | Long-term rental management | Greenwood Apartments |
| **Workplace Services** | Coworking & office space management | Innovate Coworking |

### Architecture at a Glance

```
                     ┌─────────────────┐
                     │   /login        │
                     │ Tenant Selection │
                     └────────┬────────┘
                              │
         ┌────────────────────┴────────────────┐
         │                                     │
   [Platform Superadmin]                  [Tenant User]
         │                                     │
         ▼                                     ▼
  /dashboard/admin/tenants          /dashboard/{vertical}
  (Provision & manage shards)       (Day-to-day operations)
```

### Key Concepts

- **Tenant Shard** — Each customer organization gets an isolated PostgreSQL schema. Data never crosses tenants.
- **Property (Workspace)** — A physical location within a tenant (e.g., "Oceanview Hotel", "Greenwood"). Most operations are property-scoped.
- **Vertical / Journey** — The active business line the user is working in. Persisted across sessions.
- **Feature Toggles** — Ten properties per property enable/disable modules (Restaurant, Gym, Laundry, etc.).

---

## 2. Getting Started — Login Flow

### Step 1: Landing Page

Open `http://localhost:3000`. You see the eHMS landing page with hero, product showcases, and two CTAs:
- **Sign In** — takes you to `/login`
- **Get Started** — same destination

### Step 2: Tenant Selection Grid

At `/login` you see a grid of organization cards:

```
┌─────────────────────────────────────┐
│  ┌──────────┐  ┌──────────┐         │
│  │ VISWA    │  │ ANOTHER  │         │
│  │ Group of │  │ Corp     │         │
│  │ Estates  │  │          │         │
│  │ Hotels ✦ │  │ Apts ✦   │         │
│  │ Rental ✦ │  │          │         │
│  └──────────┘  └──────────┘         │
│  ─────────────────────────────────  │
│  ┌──────────────────────────────┐   │
│  │ 🔒 Platform Admin Sign In   │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Actions:**
- Click a tenant card → go to that tenant's login form
- Click "Platform Admin Sign In" → opens modal for platform-level login

### Step 3a: Tenant Login Form

After selecting a tenant (e.g., VISWA):

1. **Tenant badge** at top — click to switch tenant
2. **Workspace badges** — shows subscribed verticals
3. **Business Vertical dropdown** — choose your workspace context (`All Workspaces`, `Hotels`, `Apartments`, `Rental`, `Workplace`)
4. **Email / Password fields**
5. **Demo Autofill dropdown** — quick-fill credentials for any demo role
6. Click **Sign In**

### Step 3b: Platform Superadmin Login

Click "Platform Admin Sign In" → modal appears:
- Enter platform admin email + password
- No tenant selection required
- After login → redirected to `/dashboard/admin/tenants`

### After Login

- The JWT is stored in an httpOnly cookie (`ehms_token`)
- Redirected to `/dashboard` (or `/dashboard/{vertical}` if a specific vertical was chosen)
- The sidebar renders based on your role and journey

---

## 3. Role-Based Journeys

### 3.1 Platform Superadmin

**Credentials:** Platform-specific (not part of demo tenant)

**Scope:** Tenant provisioning & platform-level management only.

**Login Path:**
1. `/login` → click **Platform Admin Sign In** button (gold border, lock icon)
2. Enter email + password in modal
3. No tenant selection required

**Dashboard:** `/dashboard/admin/tenants` — tenant list with provision/suspend/reset-password actions

**Sidebar (always visible):**
- Dashboard
- Tenants
- Support Tickets
- Broadcasts

**What you CAN do:**
- View all tenants across all schemas
- Provision new tenant shards → fills `provision_tenant_schema()` PG function
- Suspend / unsuspend tenants
- Reset tenant admin passwords
- Manage platform-level support tickets
- Send platform broadcasts (visible to all tenants)

**What you CANNOT do:**
- Access any tenant's operational data (no Front Desk, Finance, HR, etc.)
- View tenant-specific bookings, guests, or financials

### 3.2 Tenant Superadmin

**Demo:** `superadmin@ehms.demo` / `Demo@1234`  
**Role:** `super_admin`

**Login Path:**
1. Select tenant (e.g., VISWA)
2. Choose "All Workspaces" or a specific vertical
3. Enter email + password

**Dashboard — Full Admin View:**
All 6 admin widget sections expanded with drill-down:
- Dashboards (revenue KPIs)
- Employees
- Outstanding Issues (Vendor/HK/Maint/Other)
- Rooms (Ready/Cleaning/Occupied)
- Complaints & Feedbacks
- Financial Status

**Sidebar — All 9 groups, ALL EXPANDED by default:**
| Group | Items |
|---|---|
| Front Desk & Guests | 8 items |
| Properties & Verticals | 9 items |
| Housekeeping | 5 items |
| Maintenance | 4 items |
| Finance & Accounts | 12 items |
| Human Resources | 12 items |
| Administration | 14 items |
| Procurement | 6 items |
| Inventory | 5 items |

**What you CAN do:**
- Everything. Full CRUD across all modules
- Create/edit/delete properties, users, roles
- Access all verticals
- Configure feature toggles per property
- All financial reports, HR operations, maintenance tickets

### 3.3 Property Manager

**Demo:** `admin@ehms.demo` / `Demo@1234`  
**Role:** `property_manager`

**Login Path:** Same as superadmin — tenant + vertical selection

**Dashboard — Full Admin View:**
Same as superadmin — all 6 admin widget sections with drill-down.

**Sidebar — ALL GROUPS EXPANDED by default.**
Same item set as superadmin.

**What you CAN do:**
- Same module access as superadmin
- Operations are scoped to assigned properties (when `selectedPropertyId` is set)
- Cannot manage Roles & Permissions
- Cannot access Audit Trail or Backup
- Cannot manage Tenants

### 3.4 Executive

**Demo:** `executive@ehms.demo` / `Demo@1234`  
**Role:** `executive`

**Experience:** Identical to superadmin. Full access to all modules.

**Sidebar — ALL GROUPS EXPANDED.**

### 3.5 Front Desk

**Demo:** `frontdesk@ehms.demo` / `Demo@1234`  
**Role:** `front_desk`

**Dashboard:**
- General KPIs only (Revenue, Payables, Rating, Reservations, Guests)
- Revenue Trend chart
- Reservations & Guests donut charts
- Quick Actions
- **NO** Admin Overview widgets

**Sidebar — ALL GROUPS COLLAPSED by default.**
Only visible groups:
- **Front Desk & Guests** (Dashboard, Command Center, Guest Profiles, Check-Ins, Billing & Folio, F&B / Pantry, Requests, Feedbacks)

**What you CAN do:**
- View/manage room matrix with 7 statuses (vacant, occupied, dirty, cleaning, maintenance, reserved, inspection)
- Check-in / check-out guests
- Walk-in reservations
- Manage guest profiles
- Handle billing & folio
- F&B / Pantry orders
- Log guest requests
- View/manage feedbacks
- View My Tickets

### 3.6 Housekeeping Staff

**Demo:** `housekeeping@ehms.demo` / `Demo@1234`  
**Role:** `housekeeping_staff`

**Dashboard:**
- General KPIs only (no admin widgets)

**Sidebar — ALL COLLAPSED.**
Only groups:
- **Housekeeping** (Housekeeping, HK Tasks)

(Supervisors also see: Linen, Inspections, HK Staff, Users)

**What you CAN do:**
- View housekeeping task board
- Filter by status (open, assigned, in_progress, resolved, completed, closed)
- Create new HK tasks
- Update task status
- Use checklists per task
- View My Tickets

### 3.7 Maintenance Staff

**Demo:** `maintenance@ehms.demo` / `Demo@1234`  
**Role:** `maintenance_staff`

**Dashboard:**
- General KPIs only

**Sidebar — ALL COLLAPSED.**
Groups:
- **Maintenance** (Maintenance, Tickets)
- **Vendors** (Vendors)

**What you CAN do:**
- View maintenance ticket board
- Filter by priority (critical, high, medium, low)
- Create and update tickets
- View vendors
- View My Tickets

(Supervisors also see: Parts, Assets, Procurement, Inventory, Users)

### 3.8 HR Manager

**Demo:** `hr@ehms.demo` / `Demo@1234`  
**Role:** `hr_manager`

**Dashboard:**
- General KPIs only

**Sidebar — ALL COLLAPSED.**
Groups:
- **Human Resources** (HRMS, Employees, Timesheets, Leave, Payroll, Compliance, Masters, Policies, Appraisal, Compensation, Shifts, HR Settings)

**What you CAN do:**
- Employee directory with CRUD
- Timesheet management
- Leave requests & approvals
- Payroll processing
- Statutory compliance (PF, ESI, PT, TDS)
- HR master data (departments, document types)
- Policy document management
- Performance appraisal cycles, goals, reviews
- Compensation (increments, promotions)
- Shift scheduling
- Attendance policies, overtime policies
- View My Tickets

### 3.9 Finance Manager

**Demo:** `finance@ehms.demo` / `Demo@1234`  
**Role:** `finance_manager`

**Dashboard:**
- General KPIs only

**Sidebar — ALL COLLAPSED.**
Groups:
- **Finance & Accounts** (Finance, Chart of Accts, Journal, Ledger, Receivables, Payables, Budget, Tax, Fixed Assets, Reports, Fin Settings, Reconciliation)
- **Rental** (Rent Invoices, Deposits)
- **Procurement** (Procurement, Purchase Orders, Goods Receipt)
- **Vendors** (Vendors, Vendor Orders, Vendor Services)
- **Inventory** (Inventory, Inv Transactions)

**What you CAN do:**
- Financial dashboard with MTD revenue, invoices, bank reconciliation
- Chart of Accounts management
- Journal entries
- General ledger
- Accounts receivable & payable
- Budget management (heads, entries)
- Tax filings
- Fixed assets & depreciation
- Financial reports (Trial Balance, P&L, Balance Sheet)
- Fiscal years & cost centers
- Bank reconciliation
- Procurement & purchase orders
- Vendor management
- Inventory transactions
- View My Tickets

---

## 4. Sidebar Navigation

### Desktop Sidebar

The left sidebar adapts based on your role:

| State | Behavior |
|---|---|
| **Expanded (240px)** | Groups with icons. Click a group header to expand/collapse items. |
| **Collapsed (64px)** | Icon-only mode. Hover to see tooltips via `title` attribute. |

### Collapse/Expand All

A toggle at the top of the nav area reads the current state:
- If all groups are expanded → shows **"− Collapse all"**
- If any groups are collapsed → shows **"+ Expand all"**

### Group Expansion Defaults

| Role | Default |
|---|---|
| `super_admin`, `property_manager`, `executive`, `platform_super_admin` | ALL groups expanded |
| Everyone else | ALL groups collapsed |

### Journey Filtering

The sidebar also filters by business vertical. For example:
- In **Rental** journey: Front Desk, Hotels, Apartments are hidden
- In **Workplace** journey: Front Desk and property-specific items are hidden
- In **All** journey: everything visible

### Mobile Navigation

On phones (<768px):
- Hamburger menu opens a full-overlay sidebar (280px)
- Bottom nav bar has 5 fixed tabs: Home, Front Desk, Housekeep, Maint., Finance

---

## 5. Dashboard Overview

The dashboard at `/dashboard` has two tiers:

### Tier 1: General KPIs (All Roles)

5 metric cards: Total Revenue, Accounts Payable, Overall Rating, Active Reservations, Total Guests

### Charts

- **Revenue Trend** — SVG line chart of last 12 months
- **Reservations Donut** — occupancy rate
- **Guests Donut** — checked-in vs registered

### Quick Actions

Links to: Front Desk, Housekeeping Board, Maintenance Tickets, Finance & Billing

### Tier 2: Admin Overview (Superadmin / Property Manager only)

6 collapsible sections, each with **Tally-style drill-down**:

| Section | Metrics | Click to drill into |
|---|---|---|
| **Dashboards** | Today, Week, Month, Year Revenue | Recent payments table |
| **Employees** | Count available today | Employee records |
| **Outstanding Issues** | Vendor, HK, Maint, Other counts | Vendor bills, HK tasks, Maint tickets, Guest requests |
| **Rooms** | Ready, Cleaning, Occupied/Dirty | Room status breakdown |
| **Complaints** | Today, Week, Month, Year + avg ratings | Recent feedback entries |
| **Financial** | Spending (T/W/M/Y) + Available, Expenses, Receivables | Recent bills & payments |

---

## 6. Module Workflows

### 6.1 Front Desk & Command Center

**Entry:** Click "Command Center" or "Dashboard" in sidebar

**Room Matrix** — Color-coded grid of all rooms with 7 statuses:

| Status | Color | Meaning |
|---|---|---|
| Vacant | Green dot | Ready for check-in |
| Occupied | Navy dot | Guest checked in |
| Dirty | Amber dot | Needs cleaning after checkout |
| Cleaning | Green dot | Housekeeping in progress |
| Maintenance | Red dot | Under repair |
| Reserved | Gray dot | Booked, not yet arrived |
| Inspection | Light green dot | Quality check pending |

**Actions on a room:**
1. **Check-in** — Opens a modal with guest search/create, rate plan, booking source
2. **Check-out** — Finalizes stay, triggers folio settlement
3. **Walk-in** — Direct reservation without prior booking
4. **Folio** — View/update charges, payments, and balance
5. **Log Request** — Create guest service request

**Checklist by Role:**
| Action | Front Desk |
|---|---|
| View room matrix | ✅ |
| Check-in guest | ✅ |
| Check-out guest | ✅ |
| Walk-in reservation | ✅ |
| Manage folio/charges | ✅ |
| Log guest requests | ✅ |
| View feedbacks | ✅ |
| F&B order entry | ✅ |
| Guest profiles CRUD | ✅ |

### 6.2 Housekeeping

**Entry:** Click "Housekeeping" in sidebar

**Task Board:**
- Cards grouped by status filter (All, Open, Assigned, In Progress, Resolved, Completed, Closed)
- Priority badges: Critical (red), High (amber), Medium (blue), Low (gray)
- Each card shows: room number, task type, assigned staff, priority, due time

**Create Task:**
1. Click "New Task" button
2. Select room, task type (Deep Clean, Turndown, Inspection, etc.)
3. Assign to staff
4. Set priority and due date
5. Optionally attach checklist template

**Task Detail (click a task):**
- See full description
- Check off checklist items
- Update status
- Add notes
- Mark as complete

**Other HK Pages:**
- **HK Tasks** — Alternative list view
- **Linen** — Batch tracking, item inventory, transactions (supervisor+)
- **Inspections** — Quality inspections with pass/fail (supervisor+)
- **HK Staff** — Staff assignment & management (supervisor+)

### 6.3 Maintenance

**Entry:** Click "Maintenance" in sidebar

**Ticket Board:**
- Priority-filtered board (Critical, High, Medium, Low)
- Type badges: Plumbing, Electrical, HVAC, Carpentry, Painting, Gardening, Housekeeping, Security, IT, Structural, Furniture, Plumbing | Electrical
- Team status sidebar: Available, Busy, Offline

**Create Ticket:**
1. Click "New Ticket"
2. Select property, location (floor/wing)
3. Choose category and priority
4. Describe issue
5. Assign to team member
6. Optionally link parts inventory

**Ticket Workflow:**
```
Open → Assigned → In Progress → Resolved → Closed
```
(Re-open from Closed if needed)

**Other Maintenance Pages:**
- **Tickets** — Full list view with search/filter
- **Parts** — Inventory of spare parts (supervisor+)
- **Assets** — Equipment and asset registry (supervisor+)
- **Preventive Schedules** — Recurring maintenance plans
- **AMC Contracts** — Annual maintenance contracts with vendors

### 6.4 Human Resources (HRMS)

**Entry:** Click "HRMS" in sidebar

**HR Dashboard** shows:
- **Employee List** — Table with employee code, name, department, designation, attendance %, status
- **Shift Data** — Morning/Afternoon/Night shifts with staff counts
- **Compliance Status** — PF, ESI, PT, TDS status
- **Recruitment Pipeline** — Funnel from Sourced → Hired
- **Training Sessions** — Upcoming/planned sessions

**Employee Lifecycle:**
1. **Create** → Add employee (code, name, dept, designation, salary, documents)
2. **Track** → Timesheets, leave, attendance
3. **Review** → Appraisal cycles with goals
4. **Compensate** → Promotions, increments
5. **Pay** → Payroll processing

**Key Sub-pages:**
| Page | Purpose |
|---|---|
| Employees | Full directory with create/edit/delete |
| Timesheets | Daily time logging |
| Leave | Leave requests, approvals, balance |
| Payroll | Monthly payroll calculation & processing |
| Compliance | PF/ESI/PT/TDS filing management |
| Masters | Departments, designations, document types |
| Policies | Company policy documents |
| Appraisal | Performance review cycles & goals |
| Compensation | Promotions & increments |
| Shifts | Shift definition & assignment |
| Settings | Attendance & overtime policies |

### 6.5 Finance & Accounts

**Entry:** Click "Finance" in sidebar

**Finance Dashboard:**
- **MTD Revenue** — Month-to-date total
- **Invoice List** — Recent invoices with status (Paid/Sent/Overdue/Pending/Draft)
- **Bank Reconciliation** — Auto-matched/unmatched/pending statuses
- **Quick Stats** — Receivables, Payables, Net Position

**Accounts Module (Chart of Accounts):**
- Hierarchical account tree
- Account types: Asset, Liability, Equity, Revenue, Expense
- Create/edit accounts with codes and parent accounts

**Journal Entries:**
- Double-entry journaling
- Debit/credit line items
- Auto-balance check
- Reference document linking

**Ledger:**
- General ledger view
- Filter by account, date range
- Running balance

**Receivables:**
- Invoice tracking
- Overdue detection
- Collection status

**Payables:**
- Vendor bills management
- Bill payments with balance tracking
- Aging analysis

**Budget:**
- Budget heads definition
- Budget entries with approved amounts
- Utilization tracking

**Tax:**
- Tax filings management
- Filing period tracking
- Payment status

**Fixed Assets:**
- Asset registry
- Depreciation calculation (SLM/WDV)
- Depreciation schedule

**Reports (3 key statements):**
| Report | What it shows |
|---|---|
| Trial Balance | All accounts with debits/credits |
| Profit & Loss | Revenue − Expenses for a period |
| Balance Sheet | Assets = Liabilities + Equity |

**Reconciliation:**
- Bank statement upload
- Auto-matching logic
- Manual match/unmatch

### 6.6 Procurement & Vendors

**Entry:** Click "Procurement" in sidebar

**Procurement Dashboard:**
- Purchase order summary
- GRN tracking

**Purchase Orders:**
- Create PO with line items
- Status tracking (Draft → Sent → Approved → Received → Closed)
- Link to vendor

**Goods Receipt Notes (GRN):**
- Record receipt against PO
- Quantity & quality check
- Auto-update inventory

**Vendors:**
- Vendor registry
- Contact info, tax details, payment terms
- **Vendor Orders** — Order history
- **Vendor Services** — Service contracts

### 6.7 Inventory

**Entry:** Click "Inventory" in sidebar

**Inventory Dashboard:**
- Item counts, low stock alerts
- Warehouse overview

**Items:**
- Item master with SKU, description, unit, category
- Stock levels per warehouse

**Transactions:**
- Stock in/out/adjustment logging
- Transaction types: Purchase Receipt, Sales Issue, Transfer, Adjustment, Write-off

**Warehouses:**
- Multi-warehouse support
- Location tracking

**Categories:**
- Item categorization for reporting

### 6.8 Administration

**Entry:** Click "Admin" in sidebar (superadmin/executive/property_manager only)

**Sub-pages:**

| Page | Access | Purpose |
|---|---|---|
| Tenants | platform_super_admin only | Provision, suspend, manage tenant shards |
| Workspaces (Properties) | All admin roles | Property CRUD, per-property config & feature toggles |
| Roles | super_admin, executive | Role definition & permissions |
| Users | All admin roles | User management per property/role |
| Audit Trail | super_admin, executive | System event log |
| Backup | super_admin, executive | Database backup & restore |
| Settings | All admin roles | System configuration |
| Branding | All admin roles | Tenant logo, company name |
| Master Data | All admin roles | UOM, tax slabs, rate plans, booking sources, etc. |
| Sessions | super_admin, executive | Active user sessions |
| Compliance | super_admin, executive | Admin compliance records |
| Support Tickets | super_admin, executive, platform_super_admin | Cross-tenant support ticket management |
| Broadcasts | super_admin, executive, platform_super_admin | Platform-wide announcements |

**Property Configuration (Feature Toggles):**
When creating/editing a property, you can toggle 10 features:

| Feature | Default | Description |
|---|---|---|
| Rooms Map | On | Interactive room grid |
| Rate Card | On | Room rate management |
| Restaurant | Off | F&B operations |
| Bar | Off | Bar management |
| Laundry | On | Laundry service |
| Maintenance | On | Maintenance module |
| Gym | Off | Gym access management |
| Yoga | Off | Yoga studio scheduling |
| Swimming Pool | Off | Pool management |
| Spa | Off | Spa services |

Use `isFeatureEnabled("restaurant")` pattern in any module to conditionally show/hide UI.

---

## 7. Cross-Cutting Features

### My Tickets

Available to all roles at `/dashboard/tickets`. Create and track your own support tickets. Ticket status flow: `Open → In Progress → Resolved → Closed`.

### Support Tickets (Admin)

Admin-level ticket management across the tenant. View all tickets, assign, update status, communicate via messages.

### Broadcasts

Platform-wide announcements visible to all users in the tenant (shown via a banner on page load).

### Branding

Tenant admins can upload logo and set company name. Applied across login page, sidebar, and email templates.

### Settings

System-level configuration managed by admins.

### Demo Autofill

On the login page, a dropdown lets you instantly fill credentials for any demo role:

| Role | Email |
|---|---|
| Super Admin | superadmin@ehms.demo |
| Property Admin | admin@ehms.demo |
| Executive | executive@ehms.demo |
| Front Desk | frontdesk@ehms.demo |
| Housekeeping | housekeeping@ehms.demo |
| Maintenance | maintenance@ehms.demo |
| HR Manager | hr@ehms.demo |
| Finance Manager | finance@ehms.demo |

Password for all: **Demo@1234**

---

## 8. Demo Credentials

### Platform Superadmin

| Field | Value |
|---|---|
| Login path | `/login` → "Platform Admin Sign In" button |
| Email | (platform-specific, configured in DB) |
| Redirect | `/dashboard/admin/tenants` |

### Tenant Users (Demo Tenant: VISWA)

All password: **Demo@1234**

| Email | Role | Sidebar Groups Visible |
|---|---|---|
| superadmin@ehms.demo | Super Admin | All 9 groups (expanded) |
| executive@ehms.demo | Executive | All 9 groups (expanded) |
| admin@ehms.demo | Property Manager | All 9 groups (expanded) |
| frontdesk@ehms.demo | Front Desk | Front Desk & Guests only |
| housekeeping@ehms.demo | Housekeeping | Housekeeping only |
| maintenance@ehms.demo | Maintenance | Maintenance + Vendors |
| hr@ehms.demo | HR Manager | Human Resources only |
| finance@ehms.demo | Finance Manager | Finance, Rental, Procurement, Vendors, Inventory |

---

## Appendix: Quick Reference

### Room Statuses (Front Desk Matrix)

| Status | Code | Hex Color |
|---|---|---|
| Vacant | vacant | #2BAE8E |
| Occupied | occupied | #1A3C5E |
| Dirty | dirty | #F5A623 |
| Cleaning | cleaning | #2BAE8E |
| Maintenance | maintenance | #E53E3E |
| Reserved | reserved | #64748B |
| Inspection | inspection | #4DB88A |

### Ticket/Issue Statuses

| Domain | Valid Statuses |
|---|---|
| Housekeeping Tasks | open, assigned, in_progress, resolved, completed, closed |
| Maintenance Tickets | open, assigned, in_progress, resolved, closed |
| Guest Requests | pending, in_progress, resolved, cancelled |
| Support Tickets | open, in_progress, resolved, closed |

### Role Hierarchy

```
Platform Superadmin  (manages shards, billing)
        │
Tenant Superadmin   (full tenant access)
        │
Property Manager    (workspace-scoped)
        │
        ├── Front Desk
        ├── Housekeeping (Staff / Supervisor)
        ├── Maintenance (Staff / Supervisor)
        ├── HR (Manager / Executive)
        ├── Finance (Manager / Executive)
        ├── Security Staff
        └── Workplace Facility Manager
```
