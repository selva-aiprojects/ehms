# EstateFlow → PropOS: Comprehensive Expansion Implementation Plan
**Status:** Strategic Planning | **Date:** August 13, 2026 | **Version:** 1.0

---

## Executive Summary

**Current State:** HostSphere is a specialized **hospitality & facilities management system** serving Hotels, Service Apartments, Rental Apartments, and Workplace Services—optimized for the construction-to-operations workflow with fixed project hierarchies (Project → Tower → Floor → Unit).

**Target State:** **PropOS** (Property Operating System)—a comprehensive **property and asset lifecycle platform** serving:
1. ✅ **Hospitality** (existing: Hotels, Service Apartments, Rentals, Workplace)
2. 🔄 **Commercial & Office** (complex leases, CAM, retail revenue-share)
3. 🔄 **Industrial & Logistics** (volumetric asset tracking, dock automation, 3PL)
4. 🔄 **Land Promotion** (land plotting, infrastructure tracking, regulatory)
5. 🔄 **Rental & Leasing Ops** (continuous tenant lifecycle, dynamic pricing, predictive maintenance)

**Primary Challenge:** Moving from a fixed **project milestone** billing model to dynamic **multi-tenant ongoing lease/rental workflows** without breaking the existing hospitality stack.

---

## Part 1: Architectural Transformation

### 1.1 Core Data Model Evolution

#### Current Hierarchy (Project-Centric)
```
Enterprise
  └─ Region
      └─ Property (Hotel/Apt/Workplace)
          └─ Building
              └─ Floor
                  └─ Unit (Room/Desk/Apt)
                      └─ Booking/Lease
```

**Problem:** Fixed hierarchy doesn't accommodate:
- Warehouse zones (multiple floor levels in one "level")
- Commercial suites (not traditional floors)
- Land plots (2D grid, not vertical hierarchy)
- Multiple space types per property (retail + office in same building)

#### Target: Asset-Agnostic Node Model
```
Enterprise
  └─ Portfolio / Fund (new)
      └─ Asset (Residential Tower, Office Park, Logistics Park, Land Subdivision)
          └─ Space / Node (flexible: Room, Suite, Dock, Office, Plot, Warehouse Slot)
              └─ Financial Contract (Sales Deed, Commercial Lease, Rental Agreement, License)
                  └─ Operational Event (Check-in, Maintenance, Renewal, Payment)
```

**Benefits:**
- ✅ Unified asset tracking across all property types
- ✅ Flexible space taxonomies per asset type
- ✅ Multi-contract support (e.g., one suite with office lease + retail revenue share)
- ✅ Backward compatible: Hospitality can keep existing hierarchy as a "special case"

### 1.2 New Database Tables (Schema Extension)

**Phase 1: Core Asset Infrastructure (001-level migration)**

```sql
-- NEW TABLE: Asset Classification
CREATE TABLE asset_types (
    id UUID PRIMARY KEY,
    key VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Asset type keys: 'residential_tower', 'commercial_office', 'industrial_warehouse', 
--                  'land_plot', 'retail_mall', 'mixed_use', 'hospitality'

-- NEW TABLE: Portfolio Management
CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    portfolio_type VARCHAR(50) NOT NULL, -- 'residential', 'commercial', 'industrial', 'mixed'
    strategy JSONB, -- { "focus": "yield", "target_roi": 12.5, "exit_year": 2032 }
    total_capital DECIMAL(15,2),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(enterprise_id, name)
);

-- NEW TABLE: Asset Registry (extends properties)
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    asset_type_id UUID NOT NULL REFERENCES asset_types(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    address TEXT,
    -- Asset-specific metadata
    total_sq_ft DECIMAL(12,2),
    year_built INT,
    land_value DECIMAL(15,2),
    building_value DECIMAL(15,2),
    total_units INT,
    config JSONB DEFAULT '{}', -- { "zoning": "commercial", "parking_ratio": 1.5, ... }
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(portfolio_id, code)
);

-- NEW TABLE: Space Nodes (flexible unit container)
CREATE TABLE space_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    space_type VARCHAR(50) NOT NULL, -- 'room', 'office_suite', 'retail_unit', 'warehouse_slot', 'plot'
    label VARCHAR(50) NOT NULL,
    sq_ft DECIMAL(8,2),
    floor_level INT, -- nullable for land plots
    zone VARCHAR(50), -- for warehouses: 'cold_storage', 'general', 'loading'
    base_rent DECIMAL(10,2),
    occupancy_status VARCHAR(20) DEFAULT 'vacant', -- 'vacant', 'leased', 'sold', 'reserved'
    max_occupants INT,
    config JSONB DEFAULT '{}', -- { "exclusive_use": true, "parking_spots": 2, ... }
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(asset_id, label)
);

-- NEW TABLE: Space Features (space-level amenities)
CREATE TABLE space_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_node_id UUID NOT NULL REFERENCES space_nodes(id) ON DELETE CASCADE,
    feature_key VARCHAR(100) NOT NULL,
    feature_value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- NEW TABLE: Multi-Tenancy Contracts
CREATE TABLE financial_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_node_id UUID NOT NULL REFERENCES space_nodes(id) ON DELETE CASCADE,
    contract_type VARCHAR(50) NOT NULL, -- 'sales_deed', 'lease', 'rental', 'license', 'revenue_share'
    tenant_id UUID REFERENCES tenants(id), -- NULL for sales
    contract_number VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE, -- NULL for sales
    signed_date DATE,
    base_amount DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'INR',
    contract_status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'signed', 'active', 'renewal_pending', 'terminated'
    terms JSONB NOT NULL, -- { "rent_escalation": 5%, "lock_in": 24, "notice_period": 90, ... }
    amendments JSONB DEFAULT '[]', -- Array of amendment records
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(space_node_id, contract_number)
);

-- NEW TABLE: Tenant Registry (broader than current "guests")
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    legal_name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50), -- 'individual', 'pvt_ltd', 'llp', 'partnership', 'trust'
    tax_id VARCHAR(50), -- PAN / GST / TAX_ID
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    kyc_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    credit_score INT,
    relationship_type VARCHAR(20) DEFAULT 'tenant', -- 'tenant', 'buyer', 'partner', 'licensee'
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(enterprise_id, tax_id)
);

-- NEW TABLE: Contract Billing Schedule
CREATE TABLE billing_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    financial_contract_id UUID NOT NULL REFERENCES financial_contracts(id) ON DELETE CASCADE,
    billing_cycle VARCHAR(20) NOT NULL, -- 'monthly', 'quarterly', 'annual', 'milestone'
    next_due_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description VARCHAR(255),
    is_auto_invoice BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- EXTEND: Existing "units" table deprecated, migrated to space_nodes
-- EXTEND: Add to properties table:
--   asset_id UUID REFERENCES assets(id)
--   portfolio_id UUID REFERENCES portfolios(id)
```

---

## Part 2: AI Agent Framework Expansion

### 2.1 Current AI Capabilities
- ✅ **Revenue AI** (`lib/revenue-ai.ts`): Dynamic pricing, occupancy forecasting, competitor rate tracking
  - Implemented: Rate recommendations, occupancy-based adjustments, seasonal factors
  - Gaps: No lease abstraction, no CAM calculation, no maintenance prediction

### 2.2 New AI Agents Required

#### **Agent 1: Legal Lease Abstractor** (Priority: P1)
**Use Case:** Commercial leases are 50–200 pages with critical operational clauses scattered throughout.

**Capabilities:**
- Extract from PDF/images: lock-in periods, escalation clauses (e.g., +15% annually), fit-out periods, notice windows, exclusive use, maintenance responsibilities, renewal options
- Parse escalation formulas: `Rent = Base × (1 + CPI + 5%) for Year 2–5`
- Flag risk clauses: unilateral termination, rent review disputes, CAM caps
- Auto-generate lease summary card: key dates, cost projections, compliance checkpoints

**Technology Stack:**
- **Claude API** with vision (PDF parsing) or integrate **Llama2/Mistral** locally
- Store extracted data in `financial_contracts.terms` JSONB
- API: `POST /api/legal/lease-analyzer` → processes PDF, returns structured JSON

**Database:** `lease_abstracts` table with cached extraction results

#### **Agent 2: Finance CAM Reconciliation Engine** (Priority: P1)
**Use Case:** Commercial properties split electricity, water, common area maintenance (CAM) by square footage or meter readings.

**Capabilities:**
- Ingest utility bills (PDF or CSV) → parse unit costs (INR/kWh, INR/kL)
- Allocate to tenants by: (a) sq. ft. ratio, (b) smart meter API, (c) direct sub-metering
- Handle tiered charges: first 100 units free, overage at premium rate
- Auto-generate reconciliation reports: actual vs. budgeted, variance analysis
- Pre-audit: flag anomalies (e.g., +40% month-on-month spike)

**Technology Stack:**
- Extend `Finance Agent` from existing Revenue AI
- API: `POST /api/finance/cam-reconciliation`
- Database: `cam_allocations`, `utility_consumption`, `cam_variance_log`

**Workflow:**
1. Upload utility bill → Extract headers, readings
2. Match to contract terms → Apply allocation formula
3. Calculate tenant share → Generate invoice line items
4. Track actual vs. budget → Flag variances

#### **Agent 3: Maintenance Predictive Scheduler** (Priority: P2)
**Use Case:** Instead of reactive repairs, predict failures and schedule preventive maintenance.

**Capabilities:**
- Ingest: Asset age, maintenance history, work order patterns, IoT sensor data
- Predict: Probability of HVAC failure in next 30/60 days, elevator breakdown risk
- Recommend: Best maintenance window (off-peak hours), optimal vendor, spare parts inventory
- Auto-dispatch: Create work order, email technician, book time slot with tenant

**Technology Stack:**
- ML model: Time-series forecasting (ARIMA or Prophet)
- API: `GET /api/maintenance/predictive-alerts`
- Database: `asset_lifecycle_history`, `maintenance_predictions`, `vendor_availability`

#### **Agent 4: Dock Automation & Yard Scheduler** (Priority: P2)
**Use Case:** Logistics parks receive 50+ trucks daily. Manual dock scheduling causes 4–6 hour delays.

**Capabilities:**
- Ingest incoming freight requests: truck type, cargo weight, cold-storage need, time window
- Match to available bays: loading dock assignments, optimal dock sequencing
- Reduce wait time: AI reassigns dock based on real-time availability
- Optimize labor: Pre-alert warehouse staff, stagger shifts, cross-train resources

**Technology Stack:**
- Optimization algorithm: Constraint satisfaction or integer linear programming
- API: `POST /api/logistics/dock-schedule` → returns dock assignment + ETA
- Integrations: Truck tracking APIs (IrrKel, Geotab), IoT dock sensors

#### **Agent 5: Leasing Bot & Renewal Engine** (Priority: P1)
**Use Case:** Handle 100s of tenant inquiries, auto-draft lease renewals, dynamic asking rent.

**Capabilities:**
- Chat interface: Answer "What's availability?", "What's rent?", "Can I get a 3-year deal?"
- Background checks: Integrate with CIBIL API, GST validation
- Auto-draft: Generate lease renewals based on market rates + previous terms
- Dynamic pricing: Adjust asking rent based on occupancy rate, local market, tenant credit score
- Renewal alerts: Trigger renewal workflow 90 days before expiry

**Technology Stack:**
- LLM: Claude or GPT-4 for conversational + contract generation
- API: `POST /api/leasing/chat`, `POST /api/leasing/renew-draft`
- Database: `leasing_inquiries`, `renewal_workflows`

#### **Agent 6: Regulatory & Zoning Compliance Tracker** (Priority: P3)
**Use Case:** Land promoters need to track environmental clearances, zoning modifications, layout approvals.

**Capabilities:**
- Track: Municipal approvals, environmental NOCs, land entitlement documents
- Flag risks: "Layout approval pending >6 months—risk of missed launch"
- Monitor: Local zoning rule changes that affect project profitability
- Generate reports: Compliance status dashboard, audit trail

**Technology Stack:**
- Database: `regulatory_events`, `approval_tracker`, `zoning_rules`
- API: `GET /api/legal/regulatory-status`
- Alerts: Email/Slack notifications when approval status changes

---

## Part 3: Module-by-Module Expansion Roadmap

### **Phase 1: Foundation (Weeks 1–6) — Critical Path**

#### 1.1 Asset-Agnostic Data Model (Week 1–2)
- [ ] Create asset_types, portfolios, assets, space_nodes tables
- [ ] Migrate existing properties → assets (hospitality properties as special case)
- [ ] Write migration script: `039_asset_agnostic_model.sql`
- [ ] Update `lib/db.ts` to support flexible space_node queries
- [ ] **No UI changes yet** — API-only phase
- **Deliverable:** Backward-compatible API layer that returns hospitality data as before

#### 1.2 Lease Abstractor Agent (Week 2–4)
- [ ] Set up Claude PDF vision integration in `lib/ai/lease-abstractor.ts`
- [ ] Build parser for 5 key lease clauses (lock-in, escalation, fit-out, notice, exclusive)
- [ ] Create API route `POST /api/legal/lease-analyzer`
- [ ] Store extracts in `financial_contracts.terms` JSONB
- [ ] Build admin UI: Upload lease PDF → View extracted summary
- **Deliverable:** MVP lease parser handling 90% of commercial leases

#### 1.3 Leasing Bot (Week 3–5)
- [ ] Implement Claude chatbot for tenant inquiries
- [ ] Connect to space_nodes availability query
- [ ] Auto-draft lease renewals from previous contract + market rates
- [ ] API: `POST /api/leasing/chat`, `POST /api/leasing/renew-draft`
- [ ] UI: Chat widget + lease draft preview
- **Deliverable:** Conversational leasing interface handling 80% of common inquiries

#### 1.4 Admin UI: Asset Registry (Week 4–6)
- [ ] Build pages:
  - `/dashboard/admin/assets` — Portfolio overview + asset list
  - `/dashboard/admin/assets/[assetId]` — Asset detail (spaces, contracts, financials)
  - `/dashboard/admin/space-nodes/[nodeId]` — Space detail + contract management
- [ ] Sidebar integration: Admin can switch between "Properties" (hospitality) and "Assets" (all types)
- **Deliverable:** Navigation and admin interface for new data model

---

### **Phase 2: Commercial Suite (Weeks 7–14) — Revenue-Generating**

#### 2.1 CAM Reconciliation Engine (Week 7–9)
- [ ] Build utility bill parser (PDF + CSV support)
- [ ] Implement allocation algorithms: sq. ft., tiered, smart-meter
- [ ] Create API: `POST /api/finance/cam-reconciliation`
- [ ] Generate CAM invoices as line items in existing Invoice module
- [ ] Admin UI: Upload utility bills → View reconciliation report → Generate invoices
- **Deliverable:** Functional CAM calculator reducing manual data entry by 90%

#### 2.2 Retail Revenue-Share & Escalation Modules (Week 9–12)
- [ ] Extend financial_contracts to support revenue-share terms: `{ "revenue_share_pct": 5, "min_rent": 50000, ... }`
- [ ] Integrate POS system webhooks: Capture daily retail sales
- [ ] Auto-calculate percentage rent: `Rent = MAX(Min Rent, Revenue × Share %)`
- [ ] Build dashboard: Tenant POS analytics, revenue split tracking
- [ ] API routes:
  - `POST /api/leasing/pos-webhook` — Ingest POS sales
  - `GET /api/leasing/revenue-share-calc` — Calculate tenant rent
- **Deliverable:** Functional revenue-share invoicing for retail tenants

#### 2.3 Dynamic CAM & Lease Escalation Pricing (Week 12–14)
- [ ] Extend Revenue AI to handle: rent escalation formulas, CPI-linked adjustments, market rate reviews
- [ ] Parse lease escalation clauses → Auto-calculate next-period rent
- [ ] Build "Lease Renewal Pricing" logic: Show recommended rent increase based on market data
- **Deliverable:** Automated rent escalation reducing renewal cycle time by 50%

---

### **Phase 3: Industrial & Logistics (Weeks 15–24)**

#### 3.1 Volumetric Spatial Mapping (Week 15–18)
- [ ] Design warehouse layout schema: zones, aisles, racks, pallets
- [ ] Build 3D visualization component (Three.js or similar)
- [ ] Track occupancy: pallet slots vs. capacity per zone
- [ ] Real-time utilization dashboard for 3PL operators
- [ ] API: `GET /api/logistics/warehouse-utilization`
- **Deliverable:** Interactive warehouse utilization dashboard

#### 3.2 Dock Automation & Yard Scheduler (Week 19–22)
- [ ] Ingest dock/bay inventory: number of bays, equipment (refrigerated, standard, hazmat)
- [ ] Build truck scheduling engine: match incoming requests to available bays
- [ ] Optimize dock sequence: minimize wait time, maximize throughput
- [ ] Integrations: Truck GPS, IoT dock sensors
- [ ] API: `POST /api/logistics/dock-schedule`
- [ ] Admin UI: Dock dashboard showing real-time bay occupancy + scheduled queue
- **Deliverable:** Automated dock scheduling reducing avg wait time from 4h to 45min

#### 3.3 3PL Tenant Portal (Week 22–24)
- [ ] Portal features:
  - View warehouse utilization in real-time
  - Request inbound freight slots
  - Track inventory across zones
  - View dock assignments and ETAs
- [ ] Mobile app: QR code scan for pallet tracking
- **Deliverable:** Operational self-service portal for logistics tenants

---

### **Phase 4: Land Promotion & Development (Weeks 25–32)**

#### 4.1 Plot Layout Matrix & Phase Infrastructure Tracker (Week 25–28)
- [ ] Design plot subdivision schema:
  - Plots table: individual land parcels
  - Infrastructure milestones: road, electricity, water, sewage phases
- [ ] Build 2D plot layout visualizer (similar to room heatmap, but for land)
- [ ] Track phase completion: % roads laid, % utilities connected
- [ ] Database: `land_plots`, `infrastructure_milestones`, `phase_progress`
- [ ] Dashboard: Plot availability, phase status, occupancy timeline
- **Deliverable:** Plot tracking dashboard with infrastructure milestone visibility

#### 4.2 Regulatory & Approval Tracker (Week 28–30)
- [ ] Schema: approval types (layout, environmental, zoning, land entitlement)
- [ ] Workflow: Track submission date, expected approval date, actual approval date
- [ ] AI compliance checks: Flag overdue approvals, predict risks
- [ ] Integrations: Sync with municipal systems (if APIs available)
- [ ] Reports: Compliance status, approval timeline vs. project milestone
- **Deliverable:** Regulatory dashboard with risk flagging

#### 4.3 Fractional Investment & REIT Support (Week 30–32)
- [ ] Extend financial_contracts to support:
  - Equity shares (e.g., "Investor owns 15% of asset")
  - Revenue distributions (quarterly investor payouts)
  - Exit clauses (secondary market, buyback terms)
- [ ] Portfolio view: Show all investors, share distribution, ROI tracking
- [ ] Automated distributions: Calculate quarterly returns, auto-generate payouts
- **Deliverable:** Framework for fractional ownership & investor management

---

### **Phase 5: Maintenance & Operational Excellence (Weeks 33–40)**

#### 5.1 Predictive Maintenance Scheduler (Week 33–36)
- [ ] Ingest: Asset age, maintenance history, IoT sensor data
- [ ] Train ML model: Predict failure probability (ARIMA/Prophet)
- [ ] Auto-create work orders: Preventive maintenance alerts
- [ ] Recommend optimal maintenance window + vendor matching
- [ ] API: `GET /api/maintenance/predictive-alerts`
- **Deliverable:** Proactive maintenance reducing emergency repairs by 40%

#### 5.2 Tenant Maintenance Portal (Week 36–38)
- [ ] Self-service repair request submission
- [ ] AI parses request description → auto-categorizes, assigns to vendor
- [ ] Mobile app: Photo upload, work order tracking, feedback rating
- [ ] Tenant notifications: Technician ETA, completion status
- **Deliverable:** Self-service maintenance portal reducing help desk load by 50%

#### 5.3 Vendor Cost Intelligence (Week 38–40)
- [ ] Aggregate maintenance costs across all properties
- [ ] Predictive spend: Forecast annual maintenance budget
- [ ] Vendor benchmarking: Compare costs vs. regional averages
- [ ] Optimization: Recommend bulk purchasing, vendor consolidation
- **Deliverable:** Cost intelligence dashboard for finance teams

---

## Part 4: Database Migration Strategy

### Critical: Zero-Downtime Rollout

```
Current Schema:
  units → bookings/leases → invoices

Target Schema:
  space_nodes → financial_contracts → billing_schedules
  (assets, portfolios, tenants as new tables)

Migration Approach:
  1. Week 1: Add new tables (asset_types, portfolios, assets, space_nodes, financial_contracts)
  2. Week 2: Backfill existing hospitality data:
      - Create portfolio "Legacy Hospitality"
      - Convert each property → asset (asset_type = 'hospitality')
      - Convert each unit → space_node
      - Convert each lease/booking → financial_contract
  3. Weeks 3–6: Dual-read API layer
      - /api/properties → still works (reads from assets + space_nodes)
      - /api/assets → new endpoint (reads from assets + space_nodes)
  4. Week 7+: Phase out old endpoints after all UI is migrated
```

**Migration Script:** `039_asset_agnostic_model.sql` + Python backfill script

---

## Part 5: API Route Structure

### New Endpoints (Organized by Module)

```
/api/assets/
  GET    /                   ← List all assets (with filters: type, status)
  POST   /                   ← Create asset
  GET    /[assetId]          ← Get asset detail
  PUT    /[assetId]          ← Update asset config
  DELETE /[assetId]          ← Deactivate asset
  
  GET    /[assetId]/spaces   ← List space nodes
  POST   /[assetId]/spaces   ← Add space to asset
  PUT    /[assetId]/spaces/[nodeId]
  DELETE /[assetId]/spaces/[nodeId]

/api/contracts/
  GET    /                   ← List contracts (filters: type, status, tenant)
  POST   /                   ← Create contract (with lease abstractor)
  GET    /[contractId]       ← Get contract detail + parsed terms
  PUT    /[contractId]       ← Update terms, add amendments
  POST   /[contractId]/renew ← Auto-draft renewal
  GET    /[contractId]/billing-schedule ← Payment schedule

/api/tenants/
  GET    /                   ← List tenants
  POST   /                   ← Register tenant (KYC)
  GET    /[tenantId]         ← Tenant detail + contract history
  PUT    /[tenantId]         ← Update tenant info

/api/legal/
  POST   /lease-analyzer     ← Upload PDF, extract lease terms
  GET    /regulatory-status  ← Compliance dashboard data
  GET    /approval-tracker   ← Land promotion approvals

/api/finance/
  POST   /cam-reconciliation ← Upload utility bill, generate CAM invoices
  GET    /cam-variance       ← CAM variance analysis
  POST   /revenue-share-calc ← POS → percentage rent
  GET    /lease-escalation   ← Upcoming rent increases

/api/leasing/
  POST   /chat               ← Conversational bot
  POST   /renew-draft        ← Auto-generate lease renewal
  POST   /pos-webhook        ← Ingest retail POS sales
  GET    /market-rates       ← Local market rent data

/api/logistics/
  POST   /dock-schedule      ← Assign truck to dock
  GET    /warehouse-utilization ← Real-time zone occupancy
  POST   /pallet-track       ← Track pallet across zones

/api/maintenance/
  GET    /predictive-alerts  ← ML-based failure predictions
  POST   /work-order-auto    ← Dispatch maintenance

/api/portfolio/
  GET    /dashboard          ← Cross-asset financial overview
  GET    /roi-tracking       ← Investor returns (REIT support)
```

---

## Part 6: Frontend Component Architecture

### New Dashboard Pages

```
/dashboard/admin/
  ├── assets/                    ← Asset portfolio manager
  │   ├── page.tsx              ← Grid view: all assets
  │   ├── [assetId]/            ← Asset detail (tabs: overview, spaces, contracts, finance)
  │   └── create/               ← New asset wizard
  ├── space-nodes/
  │   ├── [nodeId]/             ← Space detail + contract viewer
  │   └── [nodeId]/edit/        ← Space configuration
  ├── contracts/
  │   ├── page.tsx              ← Contract list + filters
  │   ├── [contractId]/         ← Contract detail + parsed lease terms
  │   ├── [contractId]/amend/   ← Amendment workflow
  │   └── create/               ← New contract (with lease uploader)
  ├── tenants/
  │   ├── page.tsx              ← Tenant registry
  │   ├── [tenantId]/           ← Tenant KYC + contract history
  │   └── [tenantId]/kyc/       ← KYC verification flow
  ├── cam-reconciliation/        ← Utility bill upload → CAM invoices
  └── revenue-share/            ← POS integration → rent calculation

/dashboard/leasing/              ← Commercial leasing portal
  ├── inquiry-bot/              ← Chatbot interface
  ├── renewals/                 ← Lease renewal pipeline
  ├── market-analysis/          ← Local market rates
  └── tenant-portal/            ← Tenant-facing view

/dashboard/logistics/            ← 3PL operator portal
  ├── warehouse-layout/         ← 3D warehouse visualization
  ├── dock-schedule/            ← Dock assignment + queue
  ├── pallet-tracking/          ← Real-time inventory
  └── utilization-analytics/    ← Zone efficiency metrics

/dashboard/maintenance/
  ├── predictive-alerts/        ← ML failure predictions
  ├── work-orders/              ← Maintenance dispatch
  └── vendor-costs/             ← Cost intelligence
```

---

## Part 7: Implementation Phases & Timeline

| Phase | Duration | Key Deliverables | Revenue Impact |
|-------|----------|------------------|-----------------|
| **Foundation** | Weeks 1–6 | Asset model, Lease agent, Leasing bot, Admin UI | 0 (setup) |
| **Commercial** | Weeks 7–14 | CAM calc, Revenue-share, Escalation pricing | +++++ (new revenue stream) |
| **Industrial** | Weeks 15–24 | Volumetric tracking, Dock automation, 3PL portal | ++++ (new vertical) |
| **Land Promo** | Weeks 25–32 | Plot layout, Regulatory tracker, REIT support | ++++ (new vertical) |
| **Maintenance** | Weeks 33–40 | Predictive maintenance, Tenant portal, Vendor costs | +++ (cost reduction) |

**Total Timeline:** 40 weeks (9.2 months) from start to full PropOS

---

## Part 8: Technology Stack & Integration Points

### New Dependencies
- **PDF Parsing:** `pdfjs-dist` or `pdf-lib` (already in Next.js ecosystem)
- **LLM Integration:** Claude API (`@anthropic-ai/sdk`) for lease abstraction, leasing bot
- **Visualization:** Three.js for 3D warehouse layout
- **ML/Forecasting:** Prophet or AutoML (via cloud services)
- **External APIs:** 
  - CIBIL (tenant credit checks)
  - GST registry (KYC verification)
  - Truck tracking APIs (IrrKel, Geotab)
  - Municipal approval tracking (varies by region)

### Database Additions
- New tables: 12 (asset_types, portfolios, assets, space_nodes, space_features, financial_contracts, tenants, billing_schedules, + 5 supporting tables)
- Extended JSONB: properties.config, financial_contracts.terms, assets.config, space_nodes.config
- Indices: asset_id, space_node_id, contract_status, tenant_id (for fast lookups)

---

## Part 9: Risk & Mitigation

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Breaking hospitality workflow during migration | **CRITICAL** | Use dual-read API layer for 8 weeks; extensive testing before cutover |
| Lease abstractor hallucinating critical terms | **HIGH** | Start with 5 key clauses only; human review required before contract is "active" |
| CAM allocations disputed by tenants | **MEDIUM** | Implement audit trail; allow tenant dispute workflow; transparent reporting |
| Dock scheduling collisions | **MEDIUM** | Use lock/pessimistic locking in DB; add 10-min buffer between assignments |
| Predictive maintenance false positives | **MEDIUM** | Tune ML model on 6–12 months of historical data; start with "advisory only" (no auto-dispatch) |
| Regulatory tracking gaps (local variance) | **MEDIUM** | Start with 3 Indian states (TN, KA, MH); expand based on customer demand |

---

## Part 10: Success Metrics

### Q1 Post-Launch (Months 1–3)
- ✅ 0 data loss during migration
- ✅ 95% of hospitality workflows functioning post-cutover
- ✅ Lease abstractor correctly parsing 90% of commercial leases
- ✅ CAM reconciliation reducing manual invoice time by 80%

### Q2 Post-Launch (Months 4–6)
- ✅ Commercial tenant onboarding time ↓ 60% (lease abstractor + auto-renewal)
- ✅ First 5 commercial properties live on PropOS
- ✅ Revenue-share invoicing handling $10M+ annual retail sales

### Q3 Post-Launch (Months 7–9)
- ✅ First industrial logistics partner using dock automation (50+ truck/day facility)
- ✅ Maintenance predictive accuracy >80%
- ✅ 3 land promotion projects tracking on platform

### 12-Month Target
- ✅ PropOS supporting 5 property types (hospitality, commercial, industrial, land, mixed-use)
- ✅ 50+ commercial properties on platform
- ✅ 10+ logistics/warehouse clients live
- ✅ AI agents handling 70% of routine tenant inquiries
- ✅ Revenue lift: +$2–5M annually from new verticals

---

## Part 11: Go-to-Market Strategy

### Pilot Program (Month 1–2)
- Partner with 2–3 existing Viswa properties expanding into commercial/logistics
- Use internal data for testing & validation
- Refine UX based on operator feedback

### Launch (Month 3)
- Announce PropOS positioning to existing customer base
- Emphasize: "One platform for all property types"
- Pricing: Tiered by property type + asset count

### Sales Strategy
- **Commercial Brokers:** Target office/retail brokers with AI leasing agent & CAM automation
- **Logistics Operators:** Target 3PLs with dock automation & occupancy analytics
- **Land Developers:** Target mid-market promoters with compliance & fractional investment support
- **Enterprise Portfolio Managers:** REITs & family offices with multi-asset visibility

---

## Part 12: Immediate Next Steps (Week 1)

1. **Database:** Write migration `039_asset_agnostic_model.sql` (establish new table structure)
2. **API Layer:** Build dual-read compatibility layer in `lib/db.ts`
3. **Admin UI:** Scaffold `/dashboard/admin/assets`, `/dashboard/admin/space-nodes`
4. **Lease Agent:** Set up Claude API integration, build PDF parser MVP
5. **Testing:** Backfill test data, validate backward compatibility

**Assigned to:** Cross-functional team (1 Backend, 1 DB architect, 1 Frontend, 1 AI engineer, 1 QA)

---

## Appendices

### A. Glossary

- **PropOS:** Property Operating System—unified platform for all property types
- **Space Node:** Flexible asset container (room, office suite, plot, dock, desk)
- **Financial Contract:** Lease/sales agreement tying tenant to space
- **CAM:** Common Area Maintenance—shared facility costs
- **3PL:** Third-party logistics operator
- **Asset-Agnostic:** Data model supporting any property type without custom code

### B. Reference Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      PropOS Platform                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Hospitality│  │ Commercial  │  │  Industrial │          │
│  │  (Hotels,   │  │  (Office,   │  │  (Logistics,│          │
│  │   Apts,     │  │   Retail,   │  │   Warehouse│          │
│  │  Workplace) │  │   Mixed)    │  │   Parks)   │          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
│         │                │                │                 │
│  ┌──────▼────────────────▼────────────────▼──────┐          │
│  │         Asset-Agnostic Data Model             │          │
│  │   (assets, space_nodes, contracts, tenants)   │          │
│  └──────┬─────────────────────────────────────────┘          │
│         │                                                    │
│  ┌──────▼───────────────────────────────────────┐          │
│  │         AI Agent Layer                       │          │
│  │  ┌─────────┐ ┌────────┐ ┌──────────┐        │          │
│  │  │ Lease   │ │Leasing │ │CAM       │        │          │
│  │  │Extractor│ │ Bot    │ │ Calc     │        │          │
│  │  └─────────┘ └────────┘ └──────────┘        │          │
│  │  ┌─────────┐ ┌────────┐ ┌──────────┐        │          │
│  │  │Maintain.│ │Dock    │ │Predictive│        │          │
│  │  │Dispatch │ │Scheduler│ │Pricing   │        │          │
│  │  └─────────┘ └────────┘ └──────────┘        │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
│  ┌─────────────────────────────────────────┐               │
│  │      Multi-Tenant NextJS Frontend        │               │
│  │  (Dashboard, Tenant Portal, Mobile App)  │               │
│  └─────────────────────────────────────────┘               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
   NeonDB PostgreSQL
   (Schema-per-tenant)
```

### C. Commercial Vertical Feature Summary

| Feature | Priority | Complexity | Est. Days | AI Agent |
|---------|----------|-----------|-----------|----------|
| Lease PDF extraction | P1 | Medium | 5 | Legal Abstractor |
| CAM reconciliation | P1 | High | 8 | Finance Calc |
| Revenue-share invoicing | P2 | Medium | 6 | Revenue AI |
| Leasing chatbot | P1 | High | 10 | Leasing Bot |
| Market rate benchmarking | P2 | Low | 3 | Revenue AI |
| Tenant portal | P2 | Medium | 7 | — |

