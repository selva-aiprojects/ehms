# Feature Flag System: Module Building Guide

**Status:** Ready for Use | **Date:** August 13, 2026  
**File:** Feature Flag Implementation for Plug-and-Play Modules

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Adding a New Module](#adding-a-new-module)
4. [Feature Flag Patterns](#feature-flag-patterns)
5. [Testing & Monitoring](#testing--monitoring)
6. [Admin Operations](#admin-operations)
7. [Common Pitfalls](#common-pitfalls)
8. [Rollout Strategy Examples](#rollout-strategy-examples)

---

## Overview

### What Are Feature Flags?

Feature flags enable you to safely deploy new modules without affecting existing functionality. They allow:

✅ **Plug-and-Play Modules** — Enable/disable features at enterprise, property, or user level  
✅ **Safe Deployments** — Deploy code with features OFF, then gradually enable  
✅ **A/B Testing** — Test features with specific user segments  
✅ **Fast Rollback** — Disable a broken feature in seconds (no redeployment)  
✅ **Beta Programs** — Grant early access to specific users  
✅ **Dependency Management** — Enforce module dependencies automatically  

### Architecture

```
┌─────────────────────────────────────────────────┐
│ Feature Flag System (Database + API + Hooks)    │
├─────────────────────────────────────────────────┤
│                                                 │
│  Define Feature          Use in Code            │
│  ┌──────────────────┐    ┌──────────────────┐  │
│  │ flag_key: string │    │ useFeatureFlag() │  │
│  │ status: active   │    │ isFeatureEnabled()   │
│  │ category: string │    │ FeatureGuard     │  │
│  │ config: JSONB    │    │ @FeatureRoute()  │  │
│  └──────────────────┘    └──────────────────┘  │
│         │                        │               │
│  Manage Overrides       Log Usage & Metrics    │
│  ┌──────────────────┐    ┌──────────────────┐  │
│  │ enterprise       │    │ adoptionRate     │  │
│  │ property         │    │ errorRate        │  │
│  │ user             │    │ apiCalls         │  │
│  │ time-based       │    │ actionCount      │  │
│  └──────────────────┘    └──────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Quick Start

### Step 1: Create Feature Flag Definition (Admin or DB)

```typescript
// In database/040_feature_flags_module.sql:
INSERT INTO feature_flags (flag_key, name, description, category, status, default_enabled)
VALUES (
  'commercial_module',
  'Commercial Properties Module',
  'Support for office, retail, mixed-use properties',
  'commercial',
  'planning',
  FALSE
);
```

### Step 2: Use in React Components

```typescript
// components/commercial/CommercialDashboard.tsx
'use client';

import { FeatureGuard, useFeatureFlag } from '@/lib/features/client';

export function CommercialDashboard() {
  const { isEnabled, isLoading } = useFeatureFlag('commercial_module');

  if (isLoading) return <div>Loading...</div>;

  return (
    <FeatureGuard flag="commercial_module" fallback={<CommercialComingSoon />}>
      <div>
        {/* Commercial module content */}
        <CommercialPropertiesView />
        <CAMReconciliation />
        <RevenueShareAnalytics />
      </div>
    </FeatureGuard>
  );
}
```

### Step 3: Use in API Routes

```typescript
// app/api/commercial/properties/route.ts
import { isFeatureEnabled } from '@/lib/features/server';

export async function GET(request: Request) {
  const context = {
    enterprise_id: req.headers.get('x-enterprise-id'),
    user_id: req.headers.get('x-user-id'),
  };

  // Check if commercial module is enabled
  const commercialEnabled = await isFeatureEnabled(
    'commercial_module',
    context
  );

  if (!commercialEnabled) {
    return Response.json(
      { error: 'Commercial module not enabled' },
      { status: 403 }
    );
  }

  // ... rest of your API logic
}
```

### Step 4: Enable Feature (Admin)

```bash
# Enable for specific enterprise
curl -X POST http://localhost:3000/api/features/enable \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "flagKey": "commercial_module",
    "scope": "enterprise",
    "scopeId": "ENTERPRISE_ID",
    "reason": "Pilot with Viswa commercial team"
  }'

# Enable globally
curl -X POST http://localhost:3000/api/features/enable \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "flagKey": "commercial_module",
    "scope": "global",
    "reason": "Rolling out to all customers"
  }'
```

---

## Adding a New Module

### Phase 1: Design (Before Code)

**1. Define feature flags for your module:**

```sql
-- database/041_my_new_module_features.sql
INSERT INTO feature_flags (flag_key, name, description, category, status, default_enabled)
VALUES
  ('my_module_base', 'My Module - Core', 'Core functionality', 'my_category', 'planning', FALSE),
  ('my_module_advanced', 'My Module - Advanced', 'Advanced features', 'my_category', 'planning', FALSE),
  ('my_module_ai', 'My Module - AI Agent', 'AI-powered component', 'my_category', 'planning', FALSE);

-- Define dependencies (optional)
INSERT INTO feature_flag_dependencies (dependent_flag_id, required_flag_id, dependency_type)
VALUES
  ((SELECT id FROM feature_flags WHERE flag_key = 'my_module_advanced'),
   (SELECT id FROM feature_flags WHERE flag_key = 'my_module_base'),
   'requires');
```

**2. Create module skeleton:**

```
lib/my-module/
├── types.ts             (Types & interfaces)
├── server.ts            (Server functions)
├── client.ts            (React hooks)
└── features.ts          (Feature flag constants)

components/my-module/
├── MyModuleDashboard.tsx
├── MyModuleDetail.tsx
└── MyModuleCard.tsx

app/api/my-module/
├── route.ts             (List, create)
├── [id]/
│   └── route.ts         (Get, update, delete)
```

### Phase 2: Development

**3. Wrap all module exports with feature flag checks:**

```typescript
// lib/my-module/server.ts
import { isFeatureEnabled } from '@/lib/features/server';
import { FEATURE_FLAGS } from '@/lib/features/types';

export async function getMyModuleData(context: FeatureFlagContext) {
  // Check if base module is enabled
  const isEnabled = await isFeatureEnabled(
    FEATURE_FLAGS.MY_MODULE_BASE,
    context
  );

  if (!isEnabled) {
    throw new Error('My Module is not enabled for your account');
  }

  // ... module logic
}
```

**4. Wrap API routes:**

```typescript
// app/api/my-module/route.ts
import { isFeatureEnabled } from '@/lib/features/server';
import { FEATURE_FLAGS } from '@/lib/features/types';

export async function GET(request: Request) {
  const context = {
    enterprise_id: request.headers.get('x-enterprise-id'),
    user_id: request.headers.get('x-user-id'),
  };

  // Check feature enablement
  const isEnabled = await isFeatureEnabled(
    FEATURE_FLAGS.MY_MODULE_BASE,
    context
  );

  if (!isEnabled) {
    return Response.json(
      { error: 'My Module not enabled' },
      { status: 403 }
    );
  }

  // ... rest of logic
}
```

**5. Wrap UI components:**

```typescript
// components/my-module/MyModuleDashboard.tsx
import { FeatureGuard, useFeatureFlag, FeatureDisabledBanner } from '@/lib/features/client';
import { FEATURE_FLAGS } from '@/lib/features/types';

export function MyModuleDashboard() {
  const { isEnabled, isLoading } = useFeatureFlag(FEATURE_FLAGS.MY_MODULE_BASE);

  return (
    <div>
      <FeatureDisabledBanner flag={FEATURE_FLAGS.MY_MODULE_BASE} />
      
      <FeatureGuard flag={FEATURE_FLAGS.MY_MODULE_BASE} fallback={<ModuleComingSoon />}>
        <MyModuleContent />
      </FeatureGuard>
    </div>
  );
}
```

### Phase 3: Testing

**6. Test with features disabled (default state):**

```bash
# Run test suite with all new features disabled (default)
npm test -- --env=feature-flags:all-disabled
```

**7. Test with features enabled:**

```bash
# Run test with specific feature enabled
npm test -- --env=feature-flags:my_module_base:enabled
```

**8. Test with feature flag dependencies:**

```typescript
// __tests__/my-module/dependencies.test.ts
import { canEnableFeature } from '@/lib/features/server';

describe('My Module Dependencies', () => {
  it('should require base module before advanced features', async () => {
    const result = await canEnableFeature('my_module_advanced', {});
    expect(result.can_enable).toBe(false);
    expect(result.blocking_flags).toContain('my_module_base');
  });

  it('should allow advanced when base is enabled', async () => {
    // Enable base module first
    await enableFeature('my_module_base', 'global');
    
    const result = await canEnableFeature('my_module_advanced', {});
    expect(result.can_enable).toBe(true);
  });
});
```

### Phase 4: Rollout

**9. Create rollout plan:**

```sql
INSERT INTO feature_rollout_plans (
  feature_flag_id,
  plan_name,
  rollout_start_date,
  rollout_end_date,
  target_percentage,
  target_segment,
  success_metrics
)
VALUES (
  (SELECT id FROM feature_flags WHERE flag_key = 'my_module_base'),
  'My Module Phase 1 Rollout',
  '2026-09-01',
  '2026-10-15',
  100,
  '{"tiers": ["enterprise"]}',
  '{"max_error_rate": 5, "min_uptime": 99.5}'
);
```

**10. Gradual rollout by percentage:**

```bash
# Day 1: Enable for 10% of users
curl -X POST http://localhost:3000/api/features/enable \
  -d '{
    "flagKey": "my_module_base",
    "scope": "global",
    "rollout_percentage": 10,
    "reason": "Phase 1: 10% rollout"
  }'

# Day 2: Increase to 25%
curl -X POST http://localhost:3000/api/features/enable \
  -d '{
    "flagKey": "my_module_base",
    "scope": "global",
    "rollout_percentage": 25,
    "reason": "Phase 2: 25% rollout"
  }'

# Day 3+: 100% rollout
curl -X POST http://localhost:3000/api/features/enable \
  -d '{
    "flagKey": "my_module_base",
    "scope": "global",
    "rollout_percentage": 100,
    "reason": "Full rollout"
  }'
```

---

## Feature Flag Patterns

### Pattern 1: Simple Feature Toggle

```typescript
const { isEnabled } = useFeatureFlag('my_feature');

if (isEnabled) {
  return <MyFeature />;
} else {
  return <FeatureComingSoon />;
}
```

### Pattern 2: Gradual Degradation (Feature is required but slow)

```typescript
const { isEnabled, isLoading } = useFeatureFlag('my_expensive_feature');

if (isLoading) {
  return <Skeleton />;
}

return (
  <MyContent
    useExpensiveFeature={isEnabled}
    fallbackToLiteVersion={!isEnabled}
  />
);
```

### Pattern 3: Beta Features with Early Access

```typescript
import { BetaFeatureBadge } from '@/lib/features/client';

function BetaModule() {
  return (
    <div>
      <BetaFeatureBadge flag="beta_feature" />
      <BetaContent />
    </div>
  );
}
```

### Pattern 4: Conditional Navigation

```typescript
// components/layout/Sidebar.tsx
function Sidebar() {
  const { features } = useFeatures([
    'commercial_module',
    'industrial_module',
    'land_promotion_module'
  ]);

  return (
    <nav>
      {features['commercial_module'] && (
        <SidebarLink href="/commercial">Commercial</SidebarLink>
      )}
      {features['industrial_module'] && (
        <SidebarLink href="/industrial">Industrial</SidebarLink>
      )}
      {features['land_promotion_module'] && (
        <SidebarLink href="/land">Land</SidebarLink>
      )}
    </nav>
  );
}
```

### Pattern 5: Time-Based Rollout (Launch at specific time)

```typescript
// Enable feature starting from a specific date
await db.query(
  `INSERT INTO feature_flag_overrides (...)
   VALUES (..., enabled_from: '2026-09-01T10:00:00Z', enabled_until: NULL)`
);
```

### Pattern 6: Region-Based Features

```typescript
function checkRegionalFeature(flag: string, region: string) {
  // Can be implemented via custom evaluation logic
  // "geo_based" rollout strategy in feature_flags table
  
  const enabledRegions = ['TN', 'KA', 'MH'];
  return enabledRegions.includes(region);
}
```

---

## Testing & Monitoring

### Monitoring Feature Usage

```typescript
// Automatically logs when feature is used
async function MyFeatureAction() {
  const { logFeatureUsage } = useFeatureFlag('my_feature');
  
  try {
    // Do something
    await logFeatureUsage('my_feature', context);
  } catch (error) {
    // Handle error
  }
}

// Or manually:
import { logFeatureUsage } from '@/lib/features/server';
await logFeatureUsage('my_feature', { user_id, property_id });
```

### Viewing Metrics

```bash
# Get adoption rate, error rate, API calls for a feature
curl http://localhost:3000/api/features/metrics/my_feature
```

### Error Tracking

```typescript
try {
  // Feature code that might fail
  await myFeatureLogic();
} catch (error) {
  // Log error with feature context
  console.error('Feature error', {
    flag: 'my_feature',
    error: error.message,
    userId: context.user_id,
  });
}
```

---

## Admin Operations

### Dashboard Page for Feature Management

**Create:** `app/dashboard/admin/features/page.tsx`

```typescript
// components/admin/FeatureFlagsManager.tsx
export function FeatureFlagsManager() {
  const [features, setFeatures] = useState([]);
  const [selectedFeature, setSelectedFeature] = useState(null);

  const handleEnable = async (flagKey: string, scope: string) => {
    await fetch('/api/features/enable', {
      method: 'POST',
      body: JSON.stringify({ flagKey, scope }),
    });
    // Refresh features
  };

  return (
    <div>
      <h1>Feature Flags</h1>
      <FeaturesList features={features} onEnable={handleEnable} />
      {selectedFeature && (
        <FeatureDetail feature={selectedFeature} />
      )}
    </div>
  );
}
```

### Bulk Operations

```bash
# Disable all experimental features
curl -X POST http://localhost:3000/api/features/bulk-disable \
  -d '{ "status": "experimental" }'

# Enable for all enterprise customers
curl -X POST http://localhost:3000/api/features/bulk-enable \
  -d '{
    "flagKey": "new_feature",
    "scope": "enterprise",
    "enterpriseIds": [...]
  }'
```

---

## Common Pitfalls

### ❌ Pitfall 1: Checking Feature Inside Render Without Memoization

```typescript
// BAD: Re-fetches on every render
function MyComponent() {
  const { isEnabled } = useFeatureFlag('my_feature'); // Called every render!
  return <div>{isEnabled ? 'Feature' : 'Not available'}</div>;
}

// GOOD: Hook caches result
function MyComponent() {
  const { isEnabled } = useFeatureFlag('my_feature'); // Called once, cached
  return useMemo(() => 
    <div>{isEnabled ? 'Feature' : 'Not available'}</div>,
    [isEnabled]
  );
}
```

### ❌ Pitfall 2: Not Checking Dependencies

```typescript
// BAD: May fail if dependencies aren't enabled
async function enableAdvancedFeature() {
  await enableFeature('advanced_feature', 'global');
  // Could fail if 'base_feature' isn't enabled first
}

// GOOD: Check dependencies first
async function enableAdvancedFeature() {
  const deps = await canEnableFeature('advanced_feature', context);
  if (!deps.can_enable) {
    throw new Error(`Must enable: ${deps.blocking_flags.join(', ')}`);
  }
  await enableFeature('advanced_feature', 'global');
}
```

### ❌ Pitfall 3: Hardcoding Feature Names

```typescript
// BAD: Magic strings, prone to typos
if (await isFeatureEnabled('commercal_module', context)) { // Typo!
  // ...
}

// GOOD: Use constants
import { FEATURE_FLAGS } from '@/lib/features/types';
if (await isFeatureEnabled(FEATURE_FLAGS.COMMERCIAL_MODULE, context)) {
  // ...
}
```

### ❌ Pitfall 4: Not Logging Feature Usage

```typescript
// BAD: No metrics to measure adoption
async function MyFeatureAction() {
  // Do something
}

// GOOD: Log usage
async function MyFeatureAction() {
  await logFeatureUsage('my_feature', context);
  // Do something
}
```

### ❌ Pitfall 5: Forgetting to Handle Loading State

```typescript
// BAD: Renders as "disabled" while loading
const { isEnabled } = useFeatureFlag('my_feature');
return isEnabled ? <Feature /> : <Disabled />;

// GOOD: Show loading while fetching
const { isEnabled, isLoading } = useFeatureFlag('my_feature');
if (isLoading) return <Skeleton />;
return isEnabled ? <Feature /> : <Disabled />;
```

---

## Rollout Strategy Examples

### Strategy 1: All-or-Nothing (Default)

```sql
INSERT INTO feature_flag_overrides (
  feature_flag_id, scope, is_enabled, 
  enabled_from, enabled_until
)
VALUES (flag_id, 'global', TRUE, NOW(), NULL);
-- Feature is ON for everyone immediately
```

### Strategy 2: Percentage-Based Gradual Rollout

```sql
INSERT INTO feature_flag_overrides (
  feature_flag_id, scope, is_enabled, 
  rollout_percentage, enabled_from
)
VALUES (flag_id, 'global', TRUE, 10, NOW());
-- 10% of users get the feature (hash-based)

-- Day 2: Increase to 50%
UPDATE feature_flag_overrides 
SET rollout_percentage = 50 
WHERE feature_flag_id = flag_id;

-- Day 3: 100%
UPDATE feature_flag_overrides 
SET rollout_percentage = 100 
WHERE feature_flag_id = flag_id;
```

### Strategy 3: Segment-Based Rollout

```sql
INSERT INTO feature_flag_overrides (
  feature_flag_id, enterprise_id, scope, is_enabled
)
VALUES (flag_id, 'ENTERPRISE_A', 'enterprise', TRUE),
       (flag_id, 'ENTERPRISE_B', 'enterprise', TRUE),
       (flag_id, 'ENTERPRISE_C', 'enterprise', FALSE);
-- Feature ON for ENTERPRISE_A and ENTERPRISE_B only
```

### Strategy 4: Time-Based Rollout (Launch Window)

```sql
INSERT INTO feature_flag_overrides (
  feature_flag_id, scope, is_enabled,
  enabled_from, enabled_until
)
VALUES (
  flag_id, 'global', TRUE,
  '2026-09-15T10:00:00Z', -- Launch date
  '2026-10-15T17:00:00Z'  -- Sunset date
);
-- Feature is automatically ON during launch window, OFF otherwise
```

### Strategy 5: Role-Based Rollout

```sql
INSERT INTO feature_flag_overrides (feature_flag_id, user_id, scope, is_enabled)
SELECT flag_id, u.id, 'user', TRUE
FROM users u
WHERE u.role = 'property_manager' AND u.is_active = TRUE;
-- Feature ON for all active property managers
```

---

## Checklist: Before Launching Your Module

- [ ] Feature flag defined in database (flag_key, name, category)
- [ ] Dependencies defined (if any)
- [ ] API routes wrapped with `isFeatureEnabled()` check
- [ ] React components wrapped with `FeatureGuard`
- [ ] Default status set to `planning` or `in_development`
- [ ] Tests created for feature enabled AND disabled states
- [ ] Rollout plan documented (dates, percentages, success metrics)
- [ ] Admin team trained on enabling/disabling features
- [ ] Monitoring dashboard configured
- [ ] Rollback procedure documented
- [ ] Gradual rollout tested in staging environment
- [ ] Communication plan ready for launch

---

## Quick Reference: Common Commands

```bash
# Check if feature is enabled
curl -X POST http://localhost:3000/api/features/check \
  -d '{"flagKey": "my_feature", "context": {...}}'

# Enable for enterprise
curl -X POST http://localhost:3000/api/features/enable \
  -d '{
    "flagKey": "my_feature",
    "scope": "enterprise",
    "scopeId": "ENTERPRISE_ID"
  }'

# Get metrics
curl http://localhost:3000/api/features/metrics/my_feature

# Check dependencies
curl "http://localhost:3000/api/features/check-dependencies?flag=my_feature"
```

---

## Summary

Feature flags enable you to:
1. ✅ **Deploy safely** — Code ships OFF, enable when ready
2. ✅ **Rollback instantly** — Disable broken features in seconds
3. ✅ **Test gradually** — Rollout to 10% → 50% → 100%
4. ✅ **Manage dependencies** — Enforce module requirements automatically
5. ✅ **Monitor adoption** — Track usage and errors per feature

**Always check for feature flags before building new modules!**

