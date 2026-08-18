# Multi-Vertical Feature Flags: Complete Guide

**Status:** Ready for Production | **Date:** August 13, 2026  
**File:** Vertical-Scoped Feature Flag Implementation

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Business Verticals](#business-verticals)
3. [How It Works](#how-it-works)
4. [Implementation Guide](#implementation-guide)
5. [Real-World Scenarios](#real-world-scenarios)
6. [API Reference](#api-reference)
7. [Testing](#testing)

---

## Overview

The feature flag system now supports **multi-vertical subscriptions**. A single customer can subscribe to one or multiple business verticals (Hotel, Commercial, Apartment Leasing, etc.), and feature availability is automatically scoped to their active vertical.

### Key Principles

✅ **Vertical Isolation** — Features are only available in their assigned vertical  
✅ **Automatic Routing** — UI and API automatically filter features by active vertical  
✅ **Subscription Control** — Admin defines which verticals each customer can access  
✅ **Journey-Based Activation** — User's active vertical determines what features they see  
✅ **Backward Compatible** — Existing hospitality-only customers unaffected  

---

## Business Verticals

### Supported Verticals

```
┌─────────────────────────────────────────────────────────┐
│                  SUPPORTED VERTICALS                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 1. hospitality_hotels                                   │
│    → Hotels, Resorts, Inns                              │
│    → Features: Check-in/out, Housekeeping, POS         │
│                                                         │
│ 2. hospitality_serviced_apartments                      │
│    → Furnished Service Apartments                       │
│    → Features: Check-in/out, Housekeeping, Utilities   │
│                                                         │
│ 3. apartment_rental                                     │
│    → Long-term Rental, Leasing                          │
│    → Features: Lease Management, Tenant Portal, CAM    │
│                                                         │
│ 4. commercial                                           │
│    → Office, Retail, Mixed-Use Properties              │
│    → Features: CAM, Revenue-Share, Maintenance         │
│                                                         │
│ 5. industrial                                           │
│    → Warehouse, Logistics, 3PL Operations              │
│    → Features: Dock Automation, 3D Mapping, Inventory  │
│                                                         │
│ 6. land_promotion                                       │
│    → Plot Tracking, Land Development                    │
│    → Features: Layout Tracker, Phase Management        │
│                                                         │
│ 7. workplace_management                                 │
│    → Coworking, Shared Desks, Office Services          │
│    → Features: Desk Booking, Conference Rooms          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Vertical Type Definition

```typescript
type Vertical = 
  | 'hospitality_hotels' 
  | 'hospitality_serviced_apartments' 
  | 'apartment_rental' 
  | 'commercial' 
  | 'industrial' 
  | 'land_promotion' 
  | 'workplace_management';
```

---

## How It Works

### Architecture: Three-Layer Filtering

```
┌─────────────────────────────────────────────────────┐
│ LAYER 1: Tenant Subscription                        │
│ (database: tenants.subscribed_verticals)            │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Tenant "VISWA Hotels":                              │
│   subscribed_verticals = [                          │
│     "hospitality_hotels",                           │
│     "hospitality_serviced_apartments"               │
│   ]                                                 │
│                                                     │
│ Tenant "NextDoor Properties":                       │
│   subscribed_verticals = [                          │
│     "apartment_rental",                             │
│     "commercial",                                   │
│     "industrial"                                    │
│   ]                                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
        │
        │ (At login, user selects active vertical)
        ▼
┌─────────────────────────────────────────────────────┐
│ LAYER 2: Active Journey/Vertical                    │
│ (runtime: localStorage.activeJourney)               │
├─────────────────────────────────────────────────────┤
│                                                     │
│ User switches UI to: /dashboard/hospitality_hotels  │
│ activeJourney = "hospitality_hotels"                │
│                                                     │
│ This filters:                                       │
│   - Sidebar navigation (hotel-only modules)         │
│   - API requests (only hotel endpoints)             │
│   - Feature flags (only hotel features)             │
│                                                     │
└─────────────────────────────────────────────────────┘
        │
        │ (Feature check includes vertical context)
        ▼
┌─────────────────────────────────────────────────────┐
│ LAYER 3: Feature Availability Matrix                │
│ (database: feature_availability)                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Feature: "ai_lease_abstractor"                      │
│ Available Verticals: ["apartment_rental", "commercial"]
│                                                     │
│ Feature: "revenue_ai"                               │
│ Available Verticals: ["hospitality_hotels"]         │
│                                                     │
│ Feature: "dock_automation"                          │
│ Available Verticals: ["industrial"]                 │
│                                                     │
│ Availability checked at runtime:                    │
│   is_feature_enabled('revenue_ai', {                │
│     vertical: 'apartment_rental'  ← Different vertical
│   })                                                │
│   → Returns: FALSE                                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Decision Flow

```
User requests feature check:
  isFeatureEnabled('lease_abstractor', {
    vertical: 'apartment_rental'
  })
            │
            ▼
  1. Does tenant have 'apartment_rental' subscribed?
     └─ No → Return FALSE
            │
            ▼
  2. Is this feature available in 'apartment_rental' vertical?
     └─ Query feature_availability table
     └─ No → Return FALSE
            │
            ▼
  3. Check hierarchy overrides (User > Property > Enterprise > Global)
     └─ Similar to before, but now scoped to vertical
            │
            ▼
  4. Return final enabled state
```

---

## Implementation Guide

### Step 1: Store Subscription Info at Tenant Level

```sql
-- In database schema
ALTER TABLE tenants ADD COLUMN subscribed_verticals JSONB;

-- Example data:
UPDATE tenants 
SET subscribed_verticals = '["hospitality_hotels", "hospitality_serviced_apartments"]'
WHERE name = 'VISWA Hotels';

UPDATE tenants 
SET subscribed_verticals = '["apartment_rental", "commercial"]'
WHERE name = 'NextDoor Properties';

UPDATE tenants 
SET subscribed_verticals = '["workplace_management"]'
WHERE name = 'WorkHub Corp';
```

### Step 2: Update Type Definitions

```typescript
// lib/features/types.ts

export type Vertical = 
  | 'hospitality_hotels' 
  | 'hospitality_serviced_apartments' 
  | 'apartment_rental' 
  | 'commercial' 
  | 'industrial' 
  | 'land_promotion' 
  | 'workplace_management';

export interface FeatureFlagContext {
  user_id?: string;
  property_id?: string;
  enterprise_id?: string;
  vertical?: Vertical;  // NEW: Active vertical
  region?: string;
  tier?: string;
}
```

### Step 3: Update SQL Function

```sql
-- In database/041_feature_flags_vertical_extension.sql
-- The is_feature_enabled() function now accepts vertical parameter

SELECT is_feature_enabled(
  'commercial_module',
  'user-123',
  'prop-456',
  'enterprise-789',
  'commercial'  ← NEW: vertical parameter
);
```

### Step 4: Use in React Components

```typescript
// components/Dashboard.tsx
import { useAuth } from '@/lib/auth-context';
import { useFeatureFlag } from '@/lib/features/client';

export function Dashboard() {
  const { activeJourney } = useAuth();  // e.g., 'commercial'
  
  // Feature check automatically includes active vertical
  const { isEnabled } = useFeatureFlag('cam_reconciliation');
  
  // isEnabled will be FALSE if:
  //   - Feature not in 'commercial' vertical
  //   - OR tenant not subscribed to 'commercial'
  
  return isEnabled ? <CamModule /> : <NotAvailable />;
}
```

### Step 5: Update API Routes

```typescript
// app/api/features/check/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { flagKey, context } = body;
  
  // Context now includes vertical from request
  const result = await getFeatureCheckResult(flagKey, context);
  
  return NextResponse.json({ result });
}
```

---

## Real-World Scenarios

### Scenario 1: Customer Subscribes to Single Vertical (Hotel Only)

```
Setup:
  Customer: "ABC Hotels"
  Subscribed Verticals: ["hospitality_hotels"]

Login:
  User: admin@abchotels.com
  Sidebar shows: Only hotel-related options
    ✓ Front Desk
    ✓ Housekeeping
    ✓ Maintenance
    ✗ Commercial (CAM, Revenue-Share)
    ✗ Leasing (Tenant Portal, Lease AI)
    ✗ Industrial (Dock, Warehouse)

Feature Checks:
  isFeatureEnabled('frontdesk_operations', { vertical: 'hospitality_hotels' })
  → TRUE (available in hospitality_hotels)
  
  isFeatureEnabled('cam_reconciliation', { vertical: 'hospitality_hotels' })
  → FALSE (not in hospitality_hotels vertical)
  
  isFeatureEnabled('revenue_share_invoicing', { vertical: 'hospitality_hotels' })
  → FALSE (commercial feature, not in hospitality)
```

### Scenario 2: Customer Subscribes to Multiple Verticals

```
Setup:
  Customer: "NextDoor Properties"
  Subscribed Verticals: ["apartment_rental", "commercial", "industrial"]

Login:
  User: admin@nextdoor.com
  Sidebar shows: Multiple vertical options
    [Switch Vertical] → Dropdown
      ✓ Apartment Rental (active)
      ✓ Commercial
      ✓ Industrial

When in Apartment Rental Vertical:
  URL: /dashboard/apartment_rental
  activeJourney = "apartment_rental"
  
  isFeatureEnabled('ai_lease_abstractor', { vertical: 'apartment_rental' })
  → TRUE (lease features available)
  
  isFeatureEnabled('cam_reconciliation', { vertical: 'apartment_rental' })
  → FALSE (commercial feature)

When switches to Commercial Vertical:
  URL: /dashboard/commercial
  activeJourney = "commercial"
  
  isFeatureEnabled('ai_lease_abstractor', { vertical: 'commercial' })
  → TRUE (lease features also in commercial)
  
  isFeatureEnabled('cam_reconciliation', { vertical: 'commercial' })
  → TRUE (commercial feature now available)

When switches to Industrial Vertical:
  URL: /dashboard/industrial
  activeJourney = "industrial"
  
  isFeatureEnabled('dock_automation', { vertical: 'industrial' })
  → TRUE (industrial feature)
  
  isFeatureEnabled('ai_lease_abstractor', { vertical: 'industrial' })
  → FALSE (leasing not in industrial)
```

### Scenario 3: Admin Enables Feature for Specific Vertical

```
Admin wants to: Enable "ai_lease_abstractor" for NextDoor in apartment_rental only

Command:
  POST /api/features/enable
  {
    "flagKey": "ai_lease_abstractor",
    "scope": "enterprise",
    "scopeId": "nextdoor-id",
    "vertical": "apartment_rental",  ← NEW: Vertical-scoped enable
    "reason": "Pilot program"
  }

Result:
  Feature enabled for:
    ✓ NextDoor + apartment_rental vertical
    ✓ All properties in apartment_rental
    ✓ All users in apartment_rental
  
  NOT enabled for:
    ✗ NextDoor + commercial vertical
    ✗ NextDoor + industrial vertical
    ✗ Other customers
```

---

## API Reference

### Check Feature (Vertical-Aware)

```bash
POST /api/features/check
Content-Type: application/json

{
  "flagKey": "commercial_module",
  "context": {
    "enterprise_id": "tenant-id",
    "user_id": "user-id",
    "property_id": "prop-id",
    "vertical": "commercial"  ← NEW: Required for vertical filtering
  }
}

Response:
{
  "result": {
    "flag_key": "commercial_module",
    "is_enabled": true,
    "scope_matched": "enterprise",
    "reason": "Enabled for commercial vertical",
    "rollout_percentage": 100
  }
}
```

### Get Available Verticals for Tenant

```bash
GET /api/tenants/{tenant-id}/verticals

Response:
{
  "tenant_id": "viswa-id",
  "tenant_name": "VISWA Hotels",
  "subscribed_verticals": [
    {
      "name": "hospitality_hotels",
      "label": "Hotels & Resorts",
      "is_primary": true,
      "enabled_features": 45,
      "disabled_features": 3
    },
    {
      "name": "hospitality_serviced_apartments",
      "label": "Service Apartments",
      "is_primary": false,
      "enabled_features": 42,
      "disabled_features": 6
    }
  ]
}
```

### Add Vertical to Tenant Subscription

```bash
POST /api/tenants/{tenant-id}/verticals
Content-Type: application/json

{
  "vertical": "commercial",
  "primary_workspace_name": "NextDoor - Commercial Division",
  "enable_features": [
    "commercial_module",
    "cam_reconciliation"
  ]
}

Response:
{
  "success": true,
  "message": "Commercial vertical added to NextDoor Properties",
  "subscribed_verticals": ["apartment_rental", "commercial", "industrial"]
}
```

### Query Feature Availability by Vertical

```sql
-- View all features available in a specific vertical
SELECT 
  ff.flag_key,
  ff.name,
  ff.status,
  fa.min_tier,
  COUNT(*) OVER (PARTITION BY fa.vertical_name) as features_in_vertical
FROM feature_flags ff
LEFT JOIN feature_availability fa ON ff.id = fa.feature_flag_id
WHERE fa.vertical_name = 'commercial'
ORDER BY ff.name;
```

---

## Testing

### Test Case 1: Feature NOT Available in Current Vertical

```typescript
// Test: User tries to access feature from wrong vertical
describe('Feature Flag Vertical Scoping', () => {
  it('should return false when feature not in active vertical', async () => {
    const result = await isFeatureEnabled('revenue_ai', {
      enterprise_id: 'viswa',
      vertical: 'commercial'  // Wrong vertical
    });
    
    expect(result).toBe(false);  // revenue_ai only in hospitality
  });
});
```

### Test Case 2: Feature Available in Multiple Verticals

```typescript
it('should return true when feature in active vertical', async () => {
  // ai_lease_abstractor available in both apartment_rental and commercial
  
  const resultApt = await isFeatureEnabled('ai_lease_abstractor', {
    enterprise_id: 'nextdoor',
    vertical: 'apartment_rental'
  });
  expect(resultApt).toBe(true);
  
  const resultCom = await isFeatureEnabled('ai_lease_abstractor', {
    enterprise_id: 'nextdoor',
    vertical: 'commercial'
  });
  expect(resultCom).toBe(true);
});
```

### Test Case 3: Tenant Not Subscribed to Vertical

```typescript
it('should return false when tenant not subscribed to vertical', async () => {
  // VISWA Hotels only subscribed to hospitality verticals
  
  const result = await isFeatureEnabled('commercial_module', {
    enterprise_id: 'viswa',
    vertical: 'commercial'  // VISWA not subscribed to commercial
  });
  
  expect(result).toBe(false);
});
```

### Test Case 4: Vertical Switching in UI

```typescript
it('should update features when vertical changes', async () => {
  const { rerender } = render(<Dashboard />);
  
  // Initially in apartment_rental
  expect(screen.queryByText('CAM Reconciliation')).not.toBeInTheDocument();
  
  // Switch to commercial vertical
  await userEvent.click(screen.getByText('Switch Vertical'));
  await userEvent.click(screen.getByText('Commercial'));
  rerender(<Dashboard />);
  
  // CAM now visible
  expect(screen.getByText('CAM Reconciliation')).toBeInTheDocument();
});
```

---

## Summary: Multi-Vertical Support

| Component | Change | Impact |
|-----------|--------|--------|
| **Database** | Added `subscribed_verticals` to tenants | Stores subscription configuration |
| **SQL Function** | Added `vertical` parameter to `is_feature_enabled()` | Checks vertical availability |
| **Type System** | Added `Vertical` type and updated `FeatureFlagContext` | Type-safe vertical context |
| **React Hooks** | `useFeatureFlag()` now includes `activeJourney` | Auto-scoped to current vertical |
| **API Routes** | Accept `vertical` in request body | Vertical-aware feature checks |
| **Sidebar** | Dynamically show/hide vertical options | Based on subscription |
| **Feature Availability** | Populated with vertical-to-feature mappings | Defines which features per vertical |

---

## Checklist: Before Launching Multi-Vertical Support

- [ ] Database migration 041 executed
- [ ] All 7 verticals defined in feature_availability table
- [ ] useAuth() hook returns activeJourney
- [ ] Sidebar filters navigation by available verticals
- [ ] Feature checks include vertical context
- [ ] API routes handle vertical parameter
- [ ] Tests pass for all vertical combinations
- [ ] Admin UI for tenant vertical management built
- [ ] Documentation updated for each vertical's features
- [ ] Rollback plan prepared

---

## Migration Path: Existing Customers

**For existing hospitality-only customers:**

```sql
-- Automatic on migration 041:
UPDATE tenants 
SET subscribed_verticals = '["hospitality_hotels"]'
WHERE subscribed_verticals IS NULL;

-- Result: Customers not affected, continue seeing only hospitality features
```

**To add new verticals to customer:**

```sql
-- Admin adds commercial vertical to NextDoor
UPDATE tenants 
SET subscribed_verticals = subscribed_verticals || '["commercial"]'
WHERE name = 'NextDoor Properties';

-- Sidebar now shows commercial option
-- All commercial features immediately available
```

---

**Status:** ✅ Implementation complete. Ready for database migration and testing.
