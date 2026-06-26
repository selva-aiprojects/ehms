<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# eHMS AI Agent Guidelines

## 1. Repository Structure & Dev Setup
- The workspace is `d:\Training\working\HMS` (a git clone). This is the single source of truth.
- The dev server runs from this directory via `npm run dev`.

## 2. Database (NeonDB)
- The codebase was migrated from Supabase to **NeonDB** (PostgreSQL 16).
- All API routes use `getDb()` from `@/lib/db.ts` (Neon serverless SQL driver).
- Do not use Supabase JS clients or SDKs for database access.
- Seed runner is available via `npm run seed` (`scripts/seed-only.mjs`) and database reset + migrate via `npm run migrate` (`scripts/migrate.mjs`).

## 3. Middleware & Proxy Setup
- Next.js 16 uses `proxy.ts` (NOT `middleware.ts`). The `proxy.ts` file at the app root exports a default `proxy` function and a `config` matcher.
- The matcher must exclude `_next` entirely (`/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)`) to prevent intercepting Next.js internal paths and HMR WebSockets, which causes `ERR_INVALID_HTTP_RESPONSE` connection failures on `_next/webpack-hmr`.
- Do NOT create both `middleware.ts` and `proxy.ts` — Next.js 16 will error: "Both middleware file and proxy file are detected. Please use `proxy.ts` only."

## 4. Authentication & RBAC
- JWT-based authentication using httpOnly cookie `ehms_token`.
- Sidebar navigation and page access are governed by `lib/role-access.ts` (RBAC allowed routes per user role).
- Demo Users (Password for all: `Demo@1234`):
  - Super Admin: `superadmin@ehms.demo`
  - Property Manager: `admin@ehms.demo`
  - Executive: `executive@ehms.demo`
  - Front Desk: `frontdesk@ehms.demo`
  - Housekeeping: `housekeeping@ehms.demo`
  - Maintenance: `maintenance@ehms.demo`
  - HR Manager: `hr@ehms.demo`
  - Finance Manager: `finance@ehms.demo`

## 5. Domain & Workflow Architecture
eHMS is a comprehensive **Subscription-Based** Hospitality and Facilities Management system. It is designed to serve four major verticals:
1. **Hotels**
2. **Serviced Apartments**
3. **Apartment Management (Long-term Rental)**
4. **Workplace Services Management**

**End-to-End Workflow:**
- **OTAs & Bookings:** Hospitality vendors/OTAs (e.g., MakeMyTrip, GoIbibo) and direct users can book units (rooms/flats/desks) via advanced bookings or walk-ins. Features like facilities, grades, and levels are determined by the price tier.
- **Visitor & Access Management:** Once booked, visitors/guests are managed end-to-end.
- **Facilities & Operations:** The user journey triggers downstream workflows starting from the **Frontdesk** (check-in/out), cascading to **Facilities Administrators**, **Housekeeping** (cleaning tasks), and **Maintenance** (vendor availability and repair planning).
- **Back-Office (HR & Finance):** Operations are supported by complete HR processes (Employee Attendance, Shift rotations, Salary/Payroll) and a complete Finance workflow (Invoicing, General Ledger, Bank Reconciliation).

## 6. Business Vertical Isolation & Scoping
- **CRITICAL:** The business verticals (Hotels, Serviced Apartments, Apartment Rental, Workplace Services) operate as strictly isolated contexts.
- **Login Switcher:** The user selects their active vertical context at the Login Screen. Authentication redirects the user to the vertical-scoped route (`/dashboard/${vertical}`) and persists the selected journey.
- **Sidebar & UI Navigation:** Navigation elements must be dynamically filtered using `useJourney()` from `components/providers/JourneyProvider`. Only display navigation items allowed for the active vertical.
- **Operational Separation:** Operations like Front Desk/Onboarding, Housekeeping, Maintenance, Staff (HRMS), and Vendors are scoped specifically to the active vertical and run specialized business logic. Do not write or design global features that mix these operations across different verticals. Make sure query filters restrict database mutations to the correct vertical context.

## 7. Current Session Context (23 Jun 2026)
- **Last built:** Admin Module (sessions/audit/backup/roles CRUD) + Property (Workspace) CRUD + per-property scoping across HR, Housekeeping, Maintenance, Vendors
- **Migration to run:** `020_admin_module.sql` creates `user_sessions`, `login_attempts`, `backup_jobs`, `audit_events`, `admin_notifications`
- **Admin API routes:** `/api/admin/users`, `/api/admin/compliance`, `/api/admin/roles`, `/api/admin/sessions`, `/api/admin/backup`, `/api/admin/audit-events`
- **Admin pages:** Roles & Permissions, Audit Trail, Backup & Restore, Properties
- **New hooks:** `useAdminUsers`, `useAdminUser`, `useAdminRoles`, `useAdminSessions`, `useAdminBackups`, `useAdminAuditEvents`, `useProperty`
- **Mut hooks:** `useCreateAdminUser`, `useUpdateAdminUser`, `useDeleteAdminUser`, `useCreateProperty`, `useUpdateProperty`
- **Per-property scoping:** Most HR, HK, Maint, Vendor hooks now accept optional `property_id` param

## 8. Accounts Module (23 Jun 2026)
- **DB migration:** `021_accounts_module.sql` adds fiscal_years, cost_centers, vendor_bills, bill_line_items, bill_payments, budget_heads, budget_entries, fixed_assets, depreciation_schedule, tax_filings + extends existing finance tables
- **API routes:** `/api/finance/accounts`, `/api/finance/journal-entries`, `/api/finance/ledger`, `/api/finance/vendor-bills`, `/api/finance/bill-payments`, `/api/finance/budget`, `/api/finance/fixed-assets`, `/api/finance/depreciation`, `/api/finance/tax-filings`, `/api/finance/cost-centers`, `/api/finance/fiscal-years`, `/api/finance/reports/*`
- **UI sub-pages (10):** Chart of Accounts, Journal, Ledger, Receivables, Payables, Budget, Tax, Fixed Assets, Reports, Settings
- **New hooks (20):** `useAccounts`, `useJournalEntries`, `useLedger`, `useVendorBills`, `useBudget`, `useFixedAssets`, `useTaxFilings`, `useTrialBalance`, `useProfitLoss`, `useBalanceSheet` etc.
- **New mut hooks (15):** `useCreateAccount`, `useCreateJournalEntry`, `useCreateVendorBill`, `useCreateFixedAsset`, `useCreateBudgetEntry`, etc.
- **Sidebar:** 11 finance nav items

## 10. UI/UX Design Workflow (ui-ux-pro-max skill)

The project uses the **ui-ux-pro-max** skill (v2.x) for AI-driven UI/UX design guidance:

### Global Design System (per project)
Generate and persist a master design system once per project:
```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<product description>" --design-system --persist -p "<ProjectName>"
```
Creates `design-system/<project>/MASTER.md` — global source of truth.

### Per-Page Auto-Design (NEW workflow)
For **each page** you build, use `--page-design` to get auto page-specific guidance:
```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<page description>" --page-design -p "<ProjectName>" [--page "<page-name>"]
```
- Auto-detects page type (dashboard, checkout, login, settings, etc.)
- Checks MASTER.md if it exists and combines with page overrides
- Returns tailored layout, sections, components, and recommendations
- No manual file management needed

### Quick Reference
- `--design-system` — full project design system
- `--page-design` — auto per-page guidance (detects page from query)
- `--domain <domain>` — search specific domain (style, color, ux, typography, etc.)
- `--stack <stack>` — stack-specific guidelines (html-tailwind, react, nextjs)
- `--persist` — save to `design-system/` folder
- `--page <name>` — specify page name (for override files or --page-design hint)

## 11. Property Configuration & Feature Toggles (25 Jun 2026)
- **DB migration:** `025_property_config_features.sql` — documents the `properties.config` JSONB schema with 10 feature toggles
- **Config Schema:** stored in existing `properties.config` JSONB column:
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
- **API routes:** `POST /api/properties` — accepts `config` on create; `PUT /api/properties/[id]` — supports partial config merge via JSONB `||`
- **UI pages:**
  - **Property Detail** (`/dashboard/admin/properties/[id]`) — tabs: Overview (property details, buildings, feature status) + Configuration (10 grouped feature toggles with save/reset)
  - **Create/Edit Modal** — collapsible "Configure Feature Settings" section with toggle buttons for all 10 features
- **Hooks:** `usePropertyFeatures(propertyId)` returns `{ features, isFeatureEnabled(key), isLoading }`
- **Mutation:** `useUpdatePropertyConfig()` — update config without touching other property fields
- **Workflow Integration:** `isFeatureEnabled("restaurant")` pattern allows any module to conditionally show/hide UI based on property feature config
- **Navigation:** Settings icon on property cards navigates to the property detail page
- **Note:** The `GET /api/properties` endpoint was rewritten to use `sql.query()` instead of nested tagged template literals to avoid a driver compatibility issue with empty `sql\`\`` fragments.

## 12. Tenant Workspace Names (26 Jun 2026)
- Tenant creation form (`/tenants`) now supports multiple named workspaces with type, name, and primary flag.
- Workspace names are stored in `tenants.config.workspaces` as `[{ type, name, is_primary }]`.
- Legacy tenants without `config.workspaces` fall back to generic vertical labels.
- New form fields: `workspaces[]`, `primary_contact_name`, `payment_mode`, `subscription_charges_type`, `price`.
- API `POST /api/admin/tenants` accepts `workspaces` array and stores in config JSONB.
- Login page tenant cards and workspace dropdown show workspace names when available.
- Workspace primary flag (radio button) designates the default workspace for the tenant.

## 13. Login Workflow: Platform Superadmin vs Regular Tenant (SHARD)

### Flow Diagram

```
                        ┌─────────────────────────────┐
                        │   Landing Page (/)           │
                        │   "Sign In" / "Get Started"  │
                        └──────────┬──────────────────┘
                                   │ all CTAs → /login
                                   ▼
                        ┌─────────────────────────────┐
                        │   /login                     │
                        │   (no ?tenant= param)        │
                        │                              │
                        │   ┌──────────────────┐       │
                        │   │ Tenant Shard Grid │       │
                        │   │ Pick org card     │       │
                        │   └────────┬─────────┘       │
                        │            │                  │
                        │   ╔════════╧══════════╗       │
                        │   ║ "Platform Admin   ║       │
                        │   ║  Sign In" button  ║       │
                        │   ╚════════╤══════════╝       │
                        └───────────┼───────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  │                                   │
         (click org card)                 (click Platform Admin Sign In)
                  │                                   │
                  ▼                                   ▼
  ┌────────────────────────────┐    ┌──────────────────────────────┐
  │ /login?tenant=VISWA        │    │ Platform Login Modal         │
  │                            │    │ (email + password)           │
  │ ┌──────────────────────┐   │    │                              │
  │ │ Tenant badge (click  │   │    │ POST /api/auth/platform-login│
  │ │ to switch shard)     │   │    └──────────┬───────────────────┘
  │ │ Vertical selector    │   │               │
  │ │ Email + Password     │   │               ▼
  │ │ POST /api/auth/login │   │    ┌──────────────────────────────┐
  │ └──────────┬───────────┘   │    │ /dashboard/admin/tenants     │
  └────────────┼───────────────┘    │ (Provision shards,           │
               │                    │  manage tenants)             │
               ▼                    │ No tenant context            │
  ┌────────────────────────┐        └──────────────────────────────┘
  │ /dashboard             │
  │ -or-                   │
  │ /dashboard/{vertical}  │
  │                        │
  │ Scoped to tenant       │
  │ schema (e.g., `viswa`) │
  └────────────────────────┘
```

### Path A: Regular Tenant (SHARD) User

| Step | Screen | What happens | Key Code |
|------|--------|-------------|----------|
| 1 | **Landing Page** (`/`) | Clicks "Sign In" or "Get Started" | All CTAs link to `/login` (`app/page.tsx`) |
| 2 | **Tenant Selection** (`/login`) | Sees grid of org cards (fetched from `GET /api/admin/tenants`). Picks one (e.g., VISWA). | `app/login/page.tsx` — `!tenantCode` branch shows shard grid |
| 3 | **Login Form** (`/login?tenant=VISWA`) | Sees login form with tenant badge, subscribed vertical badges, vertical workspace dropdown, email/password, demo autofill. Enters credentials and submits. | `app/login/page.tsx` — `tenantCode` branch shows form. `POST /api/auth/login` with `{ email, password, tenant_code }` |
| 4 | **Auth API** | Backend resolves tenant from `public.tenants` by code, sets `search_path = viswa, public`, queries shard's `users`/`roles` tables, validates password, builds JWT with `{ tenant_code, tenant_schema, tenant_name, tenant_verticals, ... }`, sets `ehms_token` httpOnly cookie. | `app/api/auth/login/route.ts` + `lib/db.ts` |
| 5 | **Dashboard** | Client stores `ehms_tenant_verticals`, `ehms_tenant_name` in localStorage. Redirects to `/dashboard` or `/dashboard/{activeJourney}`. Proxy sets `x-tenant-schema` header on every request; API routes call `getDb(tenant_schema)` to scope queries. | `proxy.ts`, `app/login/page.tsx` |

### Path B: Platform Superadmin

| Step | Screen | What happens | Key Code |
|------|--------|-------------|----------|
| 1 | **Landing Page** (`/`) | Clicks "Sign In" or "Get Started" | Same CTA goes to `/login` |
| 2 | **Tenant Selection** (`/login`) | Ignores the org grid. Scrolls down and clicks **"Platform Admin Sign In"** button (gold border, lock icon). | `app/login/page.tsx` — "Platform Admin divider" section below tenant grid |
| 3 | **Platform Login Modal** | Modal opens. Enters platform admin email + password. Submits. **No tenant selection required.** | `app/login/page.tsx` — `showPlatformLogin` modal. `POST /api/auth/platform-login` |
| 4 | **Auth API** | Backend authenticates against platform admin credentials (separate from shard users). On success, sets `ehms_token` cookie with `is_platform_admin: true`. No tenant context. | `app/api/auth/platform-login/route.ts` |
| 5 | **Admin Dashboard** | Redirects to `/dashboard/admin/tenants`. Proxy restricts platform admin to this path only. All tenant-related headers are empty. Can provision new shards via `provision_tenant_schema()`. | `proxy.ts` (line 40-44), `app/tenants/page.tsx` |

### Key Rules

- **Every login starts at `/login`** — there is no separate admin login page. The tenant selection grid + platform admin button coexist on the same page.
- **Platform superadmin is NEVER asked for a tenant shard** — the platform admin login modal bypasses tenant selection entirely.
- **`/tenants` page** still exists for **platform admin shard provisioning only** (accessed via `/dashboard/admin/tenants` or direct URL). Regular users should never need it.
- **`proxy.ts` auth redirects:** Authenticated users on `/`, `/login`, or `/tenants` are redirected away. Platform admins go to `/dashboard/admin/tenants`, shard users go to `/dashboard`.
- **Schema isolation:** Each tenant's data lives in its own PostgreSQL schema (e.g., `viswa`). `lib/db.ts` uses `search_path = {schema}, public` to scope queries.

