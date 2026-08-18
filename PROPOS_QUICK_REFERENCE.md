# PropOS Quick Reference Guide

## 🎯 High-Level Transformation Summary

### Current State (HostSphere)
- **Scope:** 4 hospitality verticals (Hotels, Service Apartments, Rental, Workplace)
- **Core Hierarchy:** Property → Building → Floor → Unit
- **Billing Model:** Nightly/Lease/Membership with fixed rate plans
- **AI Capability:** Revenue optimization only (dynamic pricing, occupancy forecasting)

### Target State (PropOS)
- **Scope:** 5 property sectors (+ Hospitality: Commercial, Industrial, Land, Rental/Leasing)
- **Core Hierarchy:** Asset-agnostic → Space_Node (room, office suite, dock, warehouse slot, plot)
- **Billing Model:** Hybrid (milestone + recurring + revenue-share + utility pass-through)
- **AI Capability:** 6 agents (legal, finance, leasing, maintenance, logistics, regulatory)

---

## 🗂️ Data Model Changes

### Key Tables to Create
```
asset_types          ← Asset classifications (residential_tower, commercial_office, etc.)
portfolios           ← Grouping of assets (funds, REITs, developer portfolios)
assets               ← Unified asset container (replaces property)
space_nodes          ← Flexible unit container (replaces buildings/floors/units)
space_features       ← Granular amenity tracking per space
financial_contracts  ← Unified lease/sale/license container
tenants              ← Broader tenant registry (vs. current guests)
billing_schedules    ← Recurring/milestone billing tied to contracts
lease_abstracts      ← Cached parsed lease data (from PDF)
cam_allocations      ← CAM split calculations
revenue_share_log    ← POS-based percentage rent tracking
```

### Backward Compatibility Strategy
- Existing `properties` table remains but gets `asset_id` foreign key
- Existing `units` table can be queried as space_nodes via view
- All APIs continue returning old format during 8-week transition
- No data loss; all hospitality workflows preserved

---

## 🤖 AI Agent Implementation Roadmap

### Phase 1: Legal & Leasing (Weeks 2–5)

**1. Lease PDF Abstractor**
```
Input:  Commercial lease agreement (PDF)
Output: {
  lock_in_months: 24,
  rent_escalation: "5% annually + CPI",
  fit_out_period: 90,
  notice_period: 180,
  exclusive_use: ["HVAC", "Parking"],
  maintenance_responsibility: "Tenant pays CAM",
  renewal_options: ["5 years at market rate"],
  risks: ["Unilateral termination clause detected"]
}
API: POST /api/legal/lease-analyzer
Tech: Claude Vision API (PDF parsing)
```

**2. Leasing Bot**
```
User: "What office spaces are available in my area?"
Bot: "I found 3 available spaces. Smallest is 1000 sq.ft @ ₹45/sq.ft. Want details?"
Bot capabilities:
  - Real-time availability query
  - Pricing negotiation hints
  - Auto-draft lease renewals (based on market rate + previous terms)
  - Tenant KYC integration (CIBIL, GST lookup)
  - Document e-signing workflow
API: POST /api/leasing/chat, POST /api/leasing/renew-draft
Tech: Claude (conversational) + existing contract data
```

### Phase 2: Finance & Commercial (Weeks 7–12)

**3. CAM Reconciliation Engine**
```
Input:  Utility bills (PDF/CSV)
        { "electricity": ₹50 per kWh, "water": ₹80 per kL, "common_area_maintenance": 15% }
Output: Tenant allocations:
  - Tenant A: ₹125K (1500 sq.ft × share% + metered usage)
  - Tenant B: ₹87K  (1000 sq.ft × share% + metered usage)
  - Variance report: "Electricity usage up 22% this month"

API: POST /api/finance/cam-reconciliation, GET /api/finance/cam-variance
Tech: PDF parser + allocation algorithms (sq.ft., tiered, smart-meter)
```

**4. Revenue-Share Invoicing**
```
Input:  Tenant POS data (daily retail sales)
Output: Calculated rent:
  Rent = MAX(Min Rent ₹50K, Revenue × 5%)
  Auto-issue invoice for percentage rent component
API: POST /api/leasing/pos-webhook, GET /api/leasing/revenue-share-calc
Tech: Webhook integration + existing Finance module
```

### Phase 3: Logistics (Weeks 15–22)

**5. Dock Scheduling Optimizer**
```
Input:  Incoming truck: { type: "refrigerated", weight: 5T, time_window: "9-11am" }
Output: { dock_id: "DOCK-A3", assigned_bay: 5, estimated_load_time: 45min, equipment_prepared: true }

Optimization goal: Minimize wait time, maximize throughput
API: POST /api/logistics/dock-schedule
Tech: Constraint satisfaction or integer linear programming
```

### Phase 4: Maintenance (Weeks 33–36)

**6. Predictive Maintenance Alerts**
```
Input:  Asset age, maintenance history, sensor data (temperature, vibration)
Output: [
  { asset: "HVAC-Unit-3B", failure_probability: 78%, days_to_failure: 15, recommended_action: "Schedule PM" },
  { asset: "Elevator-A", failure_probability: 23%, days_to_failure: 45, recommended_action: "Monitor" }
]
Auto-creates work orders for high-risk assets
API: GET /api/maintenance/predictive-alerts
Tech: Time-series ML model (ARIMA, Prophet)
```

---

## 📊 API Route Structure

### Assets Module
```
GET    /api/assets/                          ← List assets (filters: type, status, city)
POST   /api/assets/                          ← Create asset
GET    /api/assets/[assetId]                 ← Asset detail
PUT    /api/assets/[assetId]                 ← Update asset config
DELETE /api/assets/[assetId]                 ← Deactivate

GET    /api/assets/[assetId]/spaces          ← List space nodes
POST   /api/assets/[assetId]/spaces          ← Add space
PUT    /api/spaces/[nodeId]                  ← Update space
DELETE /api/spaces/[nodeId]                  ← Remove space
```

### Contracts Module
```
GET    /api/contracts/                       ← List contracts
POST   /api/contracts/                       ← Create contract (with lease PDF)
GET    /api/contracts/[contractId]           ← Detail + parsed terms
PUT    /api/contracts/[contractId]           ← Amend contract
POST   /api/contracts/[contractId]/renew     ← Auto-draft renewal
GET    /api/contracts/[contractId]/schedule  ← Billing schedule
```

### Tenants Module
```
GET    /api/tenants/                         ← List tenants
POST   /api/tenants/                         ← Register tenant (KYC)
GET    /api/tenants/[tenantId]               ← Detail + contract history
PUT    /api/tenants/[tenantId]               ← Update info
POST   /api/tenants/[tenantId]/kyc           ← KYC verification
```

### Finance Module (Additions)
```
POST   /api/finance/cam-reconciliation       ← Process utility bills
GET    /api/finance/cam-variance             ← Variance analysis
POST   /api/leasing/revenue-share-calc       ← POS → percentage rent
GET    /api/finance/lease-escalation         ← Upcoming rent increases
```

### Logistics Module (New)
```
POST   /api/logistics/dock-schedule          ← Assign truck to dock
GET    /api/logistics/warehouse-utilization  ← Real-time occupancy
POST   /api/logistics/pallet-track           ← Track pallet movement
```

### Maintenance Module (Enhancements)
```
GET    /api/maintenance/predictive-alerts    ← ML failure predictions
POST   /api/maintenance/work-order-auto      ← Auto-dispatch
GET    /api/maintenance/vendor-costs         ← Cost benchmarking
```

---

## 🎨 Frontend Page Structure

### New Admin Pages
- `/dashboard/admin/assets/` — Asset portfolio view
- `/dashboard/admin/assets/[id]/` — Asset detail (tabs: overview, spaces, contracts, finance)
- `/dashboard/admin/contracts/` — Contract management
- `/dashboard/admin/tenants/` — Tenant registry + KYC
- `/dashboard/admin/cam-reconciliation/` — Utility bill processing

### New Tenant-Facing Pages
- `/dashboard/leasing/inquiry-bot/` — Chatbot interface
- `/dashboard/leasing/renewals/` — Lease renewal pipeline
- `/dashboard/logistics/warehouse-layout/` — 3D warehouse visualization
- `/dashboard/logistics/dock-schedule/` — Real-time dock availability
- `/dashboard/maintenance/predictive-alerts/` — Maintenance recommendations

---

## 🔄 Migration Path (Zero-Downtime)

### Week 1–2: Infrastructure
- Create new tables (asset_types, portfolios, assets, space_nodes, etc.)
- Build dual-read API layer (can read from old or new schema)

### Week 3–6: Backfill & Validation
- Migrate all existing hospitality data to new model
- Run parallel read tests (both old & new queries should return same result)
- Fix any discrepancies

### Week 7–14: Gradual Cutover
- Update frontend to read from `/api/assets/` instead of `/api/properties/`
- Keep old endpoints alive for safety
- Monitor error rates; rollback if needed

### Week 15+: Cleanup
- Deprecate old endpoints
- Archive old tables (keep for 12 months for auditability)
- Optimize indices on new tables based on usage patterns

---

## 📈 Expected Outcomes

### Q1 Post-Launch (Months 1–3)
| Metric | Target | Impact |
|--------|--------|--------|
| Migration success | 100% data integrity | Zero customer disruption |
| Lease abstraction accuracy | 90%+ | Reduce lease review time 70% |
| CAM invoice automation | 80% reduction in manual work | Finance team productivity ↑ 2x |

### Q2 Post-Launch (Months 4–6)
| Metric | Target | Impact |
|--------|--------|--------|
| Commercial tenant onboarding | 60% faster | Add $500K+ in lease revenue |
| First logistics partner live | 50+ truck/day facility | New vertical validation |
| Predictive maintenance accuracy | >80% | Reduce emergency repairs 40% |

### 12-Month Vision
- ✅ 5 property sectors supported (50K+ units across all types)
- ✅ 6 AI agents handling 70% of routine operations
- ✅ $5M+ incremental revenue from new verticals
- ✅ 2–3x productivity gain for operations teams

---

## ⚠️ Critical Dependencies & Risks

### Must-Have from Week 1
- ✅ Claude API key for lease extraction
- ✅ Database scaling plan (current NeonDB capacity for 12+ months)
- ✅ Backup/recovery plan for 8-week dual-read period

### High-Risk Areas
- **Lease abstraction hallucination:** Mitigation → Start with 5 key clauses only; require human approval before contract goes "active"
- **Migration data loss:** Mitigation → Parallel backup; extensive testing; incremental cutover
- **CAM allocation disputes:** Mitigation → Transparent audit trail; tenant dispute workflow; publish allocation formula

---

## 🚀 Next Immediate Steps (This Week)

1. **DB:** Write `039_asset_agnostic_model.sql` (table DDL)
2. **API:** Build dual-read layer in `lib/db.ts`
3. **AI:** Set up Claude PDF vision in `lib/ai/lease-abstractor.ts`
4. **UI:** Scaffold `/dashboard/admin/assets` pages
5. **Test:** Backfill test data; validate queries match

**Owner:** Cross-functional team (Backend, DB, Frontend, AI, QA)
**Duration:** 1 week
**Blockers:** None (proceeding with full confidence)

