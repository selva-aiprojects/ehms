# eHMS Role Hierarchy & Access Model

## Overview

```
Platform Superadmin (eHMS Provider)
        │
        ▼
Tenant Superadmin (Subscription Owner)
        │
        ▼
Property Admin (Workspace Manager)
        │
        ├── Departments (Site Features)
        ├── Employees (HR)
        ├── Vendors
        ├── Finance
        └── Inventory
```

---

## 1. Platform Superadmin — eHMS Provider

**Role:** `platform_super_admin`

The eHMS platform operator. Operates outside any tenant shard. Manages the entire multi-tenant infrastructure.

### Responsibilities
- **Tenant Lifecycle:** Create new tenant shards (`/tenants` page), suspend/activate tenants
- **Subscription Management:** Manage tenant subscription plans, charges, payment tracking
- **Support Tickets:** Receive and respond to support tickets from tenants
- **Payments & Reminders:** Track subscription payments, send payment reminders
- **Broadcasting:** Send platform-wide announcements, feature updates, advertisements
- **Monitoring:** Audit all tenant activity, usage metrics

### Access Scope
- Restricted to `/dashboard/admin/tenants`, `/dashboard/admin/tickets`, and `/dashboard/admin/broadcasts`
- No tenant-specific data access
- No property/hotel/workspace operations
- Bypasses journey filtering in sidebar — sees only platform administration nav items

### Auth Flow
- Login via **Platform Admin Sign In** modal on `/login`
- Authenticates against `public.platform_admins` table
- JWT contains `is_platform_admin: true`, no tenant context

---

## 2. Tenant Superadmin — Subscription Owner

**Role:** `super_admin`

The owning organization's top-level administrator. Full, unrestricted access to every feature, property, and module within the tenant shard.

### Responsibilities
- **Global Oversight:** Full access across all verticals (hotels, apartments, rental, workplace)
- **User Management:** Create/manage all users, assign roles, configure permissions
- **Property Setup:** Create properties, buildings, units across all verticals
- **Finance & Accounts:** Full GL, billing, vendor bills, budget, tax filings
- **HR & Payroll:** Full HRMS, employee records, payroll, compliance
- **Operations:** Front desk, housekeeping, maintenance — all modules
- **Audit:** View audit trail, sessions, backup management
- **Branding & Settings:** Configure tenant branding, system settings

### Access Scope
- No restrictions — all routes, all verticals, all properties
- `ROLE_ACCESS.super_admin` grants access to all route prefixes
- Sidebar shows all nav items (via `all` journey or bypass)
- Can operate in any journey context

### Auth Flow
- Login via tenant shard selection → email/password
- JWT contains full tenant context (`tenant_code`, `tenant_schema`, `tenant_verticals`)

---

## 3. Property Admin — Workspace Manager

**Role:** `property_manager`

Operational administrator scoped to specific workspaces/properties. Has administrative access across multiple operational domains but only within assigned workspaces.

### Responsibilities
- **Workspace Setup:** Configure properties, buildings, units within assigned workspaces
- **Department Oversight:** Manage site features, departments, and operational workflows
- **Employees:** View and manage staff within assigned workspace (via `user_roles.property_id` scoping)
- **Vendors:** Manage vendor relationships, services, purchase orders
- **Inventory:** Track items, transactions, warehouses
- **Compliance:** Workspace-level compliance and reporting
- **Settings:** Workspace-level configuration and branding

### Access Scope (by domain)
| Domain | Access |
|---|---|
| Dashboard | ✅ |
| Hotels/Apts/Rental/Workplace | ✅ (scoped to assignment) |
| Front Desk | ✅ (scoped to assigned workspace) |
| Housekeeping | ✅ (scoped to assigned workspace) |
| Maintenance | ✅ (scoped to assigned workspace) |
| Finance | ✅ (scoped to assigned workspace) |
| HRMS | ✅ (scoped to assigned workspace) |
| Admin (Users, Settings) | ✅ (scoped by `property_id`) |
| Procurement / Vendors | ✅ |
| Inventory | ✅ |

### Scoping Mechanism
- `user_roles.property_id` determines which workspace(s) the admin manages
- `NULL` property_id = global scope within tenant (legacy)
- Non-null `property_id` strictly scopes all CRUD operations
- Cannot create/edit users outside assigned workspace
- Cannot assign `super_admin` role

### Auth Flow
- Login via tenant shard selection → picks specific workspace from dropdown
- Sidebar scoped to selected workspace journey
- Redirected to `/dashboard/{vertical}` after login

---

## 4. Department Roles (Operational)

Workspace-level operational staff. Each role is scoped to specific functional domains.

### Department Hierarchy
```
Property Admin
    │
    ├── Front Desk Agent (front_desk)
    │     └── Check-in/out, reservations, guest management
    │
    ├── Housekeeping (housekeeping_staff / housekeeping_supervisor)
    │     └── Tasks, linen, inspections, staff allocation
    │
    ├── Maintenance (maintenance_staff / maintenance_supervisor)
    │     └── Tickets, parts, assets, preventive maintenance
    │
    ├── HR (hr_manager / hr_executive)
    │     └── Employees, timesheets, leave, payroll, compliance
    │
    ├── Finance (finance_manager / finance_executive)
    │     └── GL, invoices, receivables, payables, budget, tax
    │
    ├── Vendors (vendor_user)
    │     └── Vendor portal, service requests
    │
    ├── Security (security_staff)
    │     └── Visitor management, access control
    │
    └── Workplace (workplace_facility_manager)
          └── Memberships, visitors, desk allocation
```

### Scoping Rules
- Department staff operate strictly within their assigned property/workspace
- No cross-property data access
- No access to User Management console (except supervisors with `✅(s)`)
- Data queries filter by `property_id` automatically

---

## 5. Vertical-Based Navigation Filtering

```
JOURNEY_ALLOWED_ITEMS:
  all:         [all nav items — for super_admin / executive]
  hotels:      [hotel + ops + finance + hr + admin]
  apartments:  [apt + ops + finance + hr + admin]
  rental:      [rental + hk + maint + finance + hr + admin]
  workplace:   [workplace + hk + maint + finance + hr + admin]
```

- **Platform Superadmin:** Bypasses journey filter entirely; sees only role-allowed items
- **Tenant Superadmin:** Uses `all` journey to see everything, or a specific vertical journey
- **Property Admin:** Must select a specific workspace at login; sidebar scoped to that journey
- **Department Staff:** Role-based filtering restricts to their functional domain

---

## 6. Sidebar Filtering Logic

The sidebar applies a 3-layer filter (in order):

1. **Role Gate** — `item.roles.includes(user.role_name)` — eliminates items the role cannot access
2. **RBAC Gate** — `hasAccess(role, item.href)` — validates against `ROLE_ACCESS` route map
3. **Journey Gate** — `JOURNEY_ALLOWED_ITEMS[activeJourney].includes(item.label)` — scopes to vertical

*Note: Platform Superadmin bypasses the Journey Gate (step 3).*

---

## 7. Multi-Tenant Seeding Pipeline & Platform Operations

eHMS utilizes a deterministic 7-stage seeding engine (`npm run seed` via `scripts/seed-only.mjs`) to populate comprehensive end-to-end operational data across all 4 business verticals and platform management layers:

```
[seed.sql]
  └── Base demo users, system roles, user_roles mapping across tenants
[seed_v2.sql]
  └── Ocean View Hotel (OVH) rich metrics: units, bookings, payments, guests
[seed_csa.sql]
  └── City Center Serviced Apartments (CSA): long/short stay units, corporate leases
[seed_v3.sql]
  └── Comprehensive staff, attendance, payroll, vendor bills across all 4 workspaces
[seed_v4_full.sql]
  └── Admin module (audit trail, backups), Accounts GL, tax filings, F&B orders, ticketing
[seed_v5_yearly.sql]
  └── 1-2 years historical/future bookings, seasonal rate plans, annual housekeeping tasks
[seed_v6_platform_and_workflows.sql]
  └── Platform Provider broadcasts, system announcements, support ticketing workflows
```

### Seeding Guarantees & Idempotency
- **Strict Clean-Up Ordering:** Child tables (`journal_lines`, `depreciation_schedule`, `timesheets`) are cleared before parent entities (`chart_of_accounts`, `fixed_assets`, `employees`) to guarantee zero foreign key violations during re-seeding.
- **Variable Lookups:** Seeding scripts dynamically resolve IDs (`unit_ovh_1`, `uid_admin`, `inv_cat_cleaning`) via explicit joins rather than hardcoded array offsets.
- **Verification Metrics:** The seed engine validates final counts across all core tables upon completion (over 4,000 bookings, 14,000+ payments, 2,700+ housekeeping tasks, and full platform support/broadcast data).
