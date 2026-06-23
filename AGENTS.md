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
- Next.js uses `middleware.ts` in the app root, which acts as a wrapper calling `proxy` from `proxy.ts`.
- The middleware matcher is defined in `proxy.ts`.
- **CRITICAL:** The matcher must exclude `_next` entirely (`/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)`) to prevent intercepting Next.js internal paths and HMR WebSockets, which causes `ERR_INVALID_HTTP_RESPONSE` connection failures on `_next/webpack-hmr`.

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

