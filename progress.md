# Progress Status — Feature Flag System (13 Aug 2026)

## Session 2 (14 Aug 2026): Subscription-Based Provisioning (Nexus Management)

### Status
Implemented + smoke tested end-to-end. **Not yet committed.**

### What Was Done
1. **DB migration `044_subscription_provisioning.sql`** (public schema, applied to live DB via `scripts/run-044.mjs`):
   - `public.subscription_plans` — code/name/tier/price (PLACEHOLDER pricing: BASIC ₹2499, PROFESSIONAL ₹7999, ENTERPRISE ₹19999)
   - `public.tenant_subscriptions` — one row per tenant (tier, status, subscribed_verticals JSONB, price, billing)
   - `public.get_tenant_subscription(schema)` helper function
   - Backfill: VISWA seeded `professional/active` with 4 verticals (hospitality_hotels, hospitality_serviced_apartments, apartment_rental, workplace_management)
2. **`lib/features/subscription.ts`** — subscription contract + provisioning engine:
   - `getTenantSubscriptionBySchema`, `upsertTenantSubscription`, `getSubscriptionPlans`
   - `enforceSubscriptionForFlag` (subscription gate)
   - `syncTenantFeatures` (grant/revoke global-scope overrides in tenant shard, incl. flag catalog sync from `viswa` template)
   - `deriveWorkspaces` / `syncWorkspaces` (config.workspaces + property activation + public.tenants config/column sync)
3. **Enforcement**: `lib/features/server.ts` `enableFeature()` now takes `tenantSchema` and blocks enables not covered by the subscription. Verified live: tenant enabling `warehouse_3d_mapping` → 400 "not included in the 'professional' subscription... Contact Nexus Management to upgrade."
4. **Platform API**: `app/api/platform/tenants/[code]/provision/route.ts` — `GET` (tenant+subscription+plans+verticals+flag matrix) and `POST` (upsert subscription → sync overrides → workspaces). Platform-admin only.
5. **Tenant creation** (`app/api/admin/tenants` POST): now seeds feature_flags/feature_availability/feature_flag_dependencies catalog from `viswa` + creates default subscription from workspaces.
6. **Access**: `proxy.ts` + `lib/role-access.ts` + sidebar let platform superadmin reach `/dashboard/admin/provisioning`.
7. **Admin UI**: `app/dashboard/admin/provisioning/page.tsx` — tenant list, plan/tier/status/price form, vertical chips, provision button, live flag matrix (granted/revoked per category).

### Verification
- `npx tsc --noEmit` → clean; `eslint` on new/changed files → 0 errors (only pre-existing `lib/features/client.tsx` warnings)
- Smoke test `scripts/test-provisioning.mjs` (real platform + tenant logins, `viswa` shard):
  - Platform GET/POST provision ✓
  - Tenant blocked enabling non-subscribed flag ✓
  - Provision `commercial` + `enterprise` → 15 granted, tenant can now enable ✓
  - Downgrade (remove commercial) → revoked, flag returns to off ✓
- Final shard state consistent: 22 global overrides (hospitality/apartment/workplace ON; commercial/industrial/land OFF)

### Notes
- Global-scope overrides in a tenant shard are now platform-owned (subscription grants). Tenant admins can still manage property-scope toggles; their global-scope enables above subscription are blocked by the gate.
- Price fields are placeholders; finalize pricing + wire to billing later.

---

## Original Session 1 (13 Aug 2026)

### Overall Status
Feature flag management implementation is **COMPLETE and committed/pushed** to `origin/main`.

## Commits
- `2588875` — `feat(features): complete feature flag API layer and fix migrations`
- `9016fdb` — `feat(db): seed demo users for tenant shards (043)`

Branch `main` is up to date with `origin/main`. Ready for Vercel deployment check.

## What Was Done This Session
1. **API layer** (previously `app/api/features/` was an empty dir — admin UI + hooks 404'd):
   - `POST /api/features` — `get-all` / `enable` / `disable` (RBAC: `super_admin`, `executive`, `property_manager`; hospitality flags locked at global scope; dependency gating)
   - `POST /api/features/check` → `getFeatureCheckResult`
   - `POST /api/features/check-batch` → `checkFeatures`
   - `POST /api/features/log-usage` → `logFeatureUsage`
   - `POST /api/features/request-access` → pending user override
   - `GET /api/features/check-dependencies?flag=` → `missing_flags` / `can_enable` / `reason`
   - `GET /api/features/metrics/[flag]`
   - New helper: `lib/features/api.ts` (`getRequestAuth`, `isFeatureAdmin`, `buildFeatureContext`, `resolveEnterpriseId`)
2. **Migrations**:
   - Fixed `040_feature_flags_module.sql` (added `vertical_name`, idempotent types/indexes, `public.`-qualified functions)
   - Fixed `041_feature_flags_vertical_extension.sql` (`public.tenants` qualification, approval_status filter)
   - `040`, `041`, `042` **already applied to live DB** via `scripts/run-feature-flags.mjs`
   - `043` (shard demo-user seeding) committed; `scripts/run-043.mjs` added
   - `scripts/migrate.mjs` SQL_FILES now includes 039–042; splitter strips `/* */` comments
3. **Bug fixes** (found during smoke test):
   - `server.ts` enable/disable select-then-upsert (Postgres UNIQUE treats NULLs as distinct)
   - `log_feature_flag_usage` ON CONFLICT ambiguity → qualified RHS with table name
   - Cleaned lint errors / `any` usages in `server.ts`, `types.ts`, `client.tsx`, admin features page

## Verification (done end-to-end)
- `npx tsc --noEmit` → exit 0 (clean)
- `npx eslint app/api/features lib/features` → 0 errors
- Live API smoke test (real login cookie, `viswa` schema):
  - check-batch: `hospitality_base`=true, `commercial_module`=false, `revenue_ai`=true ✓
  - check / check-dependencies / metrics / log-usage / request-access / get-all (22 flags) ✓
  - RBAC: frontdesk → 403 ✓; hospitality global enable → 403 (locked) ✓
  - `commercial_module` enable blocked on unmet dependency ✓
- Test data cleaned from DB (overrides/metrics/audit = 0 rows)
- Admin page `/dashboard/admin/features` loads (200)

## Pending / Next Steps
- [ ] Verify Vercel deployment once pushed code deploys
- [ ] If DB is re-provisioned on deploy, run `npm run migrate` (includes 040–042) + `node scripts/run-043.mjs`
- [ ] Feature flag tables live in `viswa` (tenant template) schema; helper functions in `public` schema
- [ ] Note: repo-wide `npm run lint` has ~1839 pre-existing errors in unrelated files (not from this work)

## Key Files
- `app/api/features/` (7 route files), `lib/features/api.ts`, `lib/features/server.ts`, `lib/features/types.ts`, `lib/features/client.tsx`
- `database/040_feature_flags_module.sql`, `041_feature_flags_vertical_extension.sql`, `042_viswa_vertical_mapping.sql`, `043_seed_shard_demo_users.sql`
- `scripts/migrate.mjs`, `scripts/run-feature-flags.mjs`, `scripts/run-043.mjs`
- `app/dashboard/admin/features/page.tsx`
