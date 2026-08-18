-- PropOS Database Migration Guide
-- File: 039_asset_agnostic_model.sql
-- Purpose: Create unified asset-agnostic data model without breaking existing hospitality workflows
-- Status: FOUNDATION PHASE (Week 1-2)

-- ============================================================
-- PHASE 1: CREATE NEW ASSET INFRASTRUCTURE TABLES
-- ============================================================

-- 1. Asset Type Catalog
CREATE TABLE IF NOT EXISTS asset_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url TEXT,
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert standard asset types
INSERT INTO asset_types (key, name, description) VALUES
    ('residential_tower', 'Residential Tower', 'Multi-unit residential buildings (hotels, apartments, service apartments)'),
    ('commercial_office', 'Commercial Office', 'Office complexes, corporate parks, business centers'),
    ('retail_mall', 'Retail Mall', 'Shopping centers, retail parks with common areas'),
    ('industrial_warehouse', 'Industrial Warehouse', 'Logistics parks, cold storage, 3PL facilities'),
    ('land_plot', 'Land Plot / Subdivision', 'Raw land development, land promotions'),
    ('mixed_use', 'Mixed-Use Property', 'Combined residential, commercial, retail'),
    ('hospitality', 'Hospitality (Legacy)', 'Hotels and service apartments (backward compatibility)'),
    ('workplace', 'Workplace / Co-working', 'Desks, cabins, memberships, co-working spaces')
ON CONFLICT(key) DO NOTHING;

-- 2. Portfolio Management
CREATE TABLE IF NOT EXISTS portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    portfolio_type VARCHAR(50) NOT NULL,
    description TEXT,
    strategy JSONB DEFAULT '{}',
    total_capital DECIMAL(15,2),
    target_roi DECIMAL(5,2),
    inception_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(enterprise_id, name)
);

-- 3. Core Asset Registry (Unified Properties Container)
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    asset_type_id UUID NOT NULL REFERENCES asset_types(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL,
    
    -- Geographic location
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    
    -- Physical characteristics
    total_sq_ft DECIMAL(12,2),
    year_built INT,
    land_value DECIMAL(15,2),
    building_value DECIMAL(15,2),
    total_units INT,
    
    -- Operational metadata
    occupancy_status VARCHAR(20) DEFAULT 'active',
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(portfolio_id, code)
);

-- Indices for common queries
CREATE INDEX idx_assets_portfolio_id ON assets(portfolio_id);
CREATE INDEX idx_assets_asset_type_id ON assets(asset_type_id);
CREATE INDEX idx_assets_city ON assets(city);
CREATE INDEX idx_assets_is_active ON assets(is_active);

-- 4. Space Nodes (Flexible Unit Container)
CREATE TABLE IF NOT EXISTS space_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    space_type VARCHAR(50) NOT NULL,
    label VARCHAR(50) NOT NULL,
    description TEXT,
    
    -- Physical dimensions
    sq_ft DECIMAL(8,2),
    floor_level INT,
    zone VARCHAR(50),
    
    -- Operational classification
    base_rent DECIMAL(10,2),
    occupancy_status VARCHAR(20) DEFAULT 'vacant',
    max_occupants INT,
    
    config JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(asset_id, label)
);

-- Indices for common space queries
CREATE INDEX idx_space_nodes_asset_id ON space_nodes(asset_id);
CREATE INDEX idx_space_nodes_occupancy_status ON space_nodes(occupancy_status);
CREATE INDEX idx_space_nodes_zone ON space_nodes(zone);

-- 5. Space Features (Granular Amenities)
CREATE TABLE IF NOT EXISTS space_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_node_id UUID NOT NULL REFERENCES space_nodes(id) ON DELETE CASCADE,
    feature_key VARCHAR(100) NOT NULL,
    feature_value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_space_features_space_node_id ON space_features(space_node_id);

-- 6. Tenant Registry (Broader Than Current Guests)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    legal_name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50), -- 'individual', 'pvt_ltd', 'llp', 'partnership', 'trust'
    tax_id VARCHAR(50), -- PAN / GST ID
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    
    -- KYC & Credit
    kyc_status VARCHAR(20) DEFAULT 'pending',
    credit_score INT,
    relationship_type VARCHAR(20) DEFAULT 'tenant',
    
    -- Operational flags
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(enterprise_id, tax_id)
);

CREATE INDEX idx_tenants_enterprise_id ON tenants(enterprise_id);
CREATE INDEX idx_tenants_kyc_status ON tenants(kyc_status);

-- 7. Financial Contracts (Unified Lease/Sale/License Container)
CREATE TABLE IF NOT EXISTS financial_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_node_id UUID NOT NULL REFERENCES space_nodes(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id),
    
    contract_type VARCHAR(50) NOT NULL, -- 'sales_deed', 'lease', 'rental', 'license', 'revenue_share'
    contract_number VARCHAR(100) NOT NULL,
    
    -- Dates
    start_date DATE NOT NULL,
    end_date DATE,
    signed_date DATE,
    
    -- Financial terms
    base_amount DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'INR',
    contract_status VARCHAR(20) DEFAULT 'draft',
    
    -- Core terms stored as JSONB
    terms JSONB NOT NULL, -- { "rent_escalation": "5% annually", "lock_in": 24, "notice_period": 90, "exclusive_use": [...], ... }
    amendments JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(space_node_id, contract_number)
);

-- Indices for contract queries
CREATE INDEX idx_contracts_space_node_id ON financial_contracts(space_node_id);
CREATE INDEX idx_contracts_tenant_id ON financial_contracts(tenant_id);
CREATE INDEX idx_contracts_status ON financial_contracts(contract_status);
CREATE INDEX idx_contracts_type ON financial_contracts(contract_type);

-- 8. Lease Abstracts (Cached Parsed Lease Data)
CREATE TABLE IF NOT EXISTS lease_abstracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    financial_contract_id UUID NOT NULL REFERENCES financial_contracts(id) ON DELETE CASCADE,
    
    -- Extracted key clauses
    lock_in_months INT,
    rent_escalation VARCHAR(255),
    fit_out_period_days INT,
    notice_period_days INT,
    exclusive_use TEXT,
    maintenance_responsibility VARCHAR(100),
    renewal_options TEXT,
    caps_and_limits JSONB,
    
    -- Risk assessment
    risk_flags JSONB DEFAULT '[]',
    extraction_confidence DECIMAL(3,2),
    
    raw_extraction JSONB,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Billing Schedules (Recurring Payments)
CREATE TABLE IF NOT EXISTS billing_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    financial_contract_id UUID NOT NULL REFERENCES financial_contracts(id) ON DELETE CASCADE,
    
    billing_cycle VARCHAR(20) NOT NULL, -- 'monthly', 'quarterly', 'annual', 'milestone'
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    description VARCHAR(255),
    
    next_due_date DATE NOT NULL,
    is_auto_invoice BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_billing_schedules_contract_id ON billing_schedules(financial_contract_id);
CREATE INDEX idx_billing_schedules_next_due_date ON billing_schedules(next_due_date);

-- 10. CAM Allocations (Common Area Maintenance)
CREATE TABLE IF NOT EXISTS cam_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    space_node_id UUID NOT NULL REFERENCES space_nodes(id) ON DELETE CASCADE,
    
    billing_month DATE NOT NULL,
    allocation_basis VARCHAR(50), -- 'square_feet', 'meter_reading', 'tiered', 'equal'
    
    -- Calculated values
    electricity_cost DECIMAL(12,2) DEFAULT 0,
    water_cost DECIMAL(12,2) DEFAULT 0,
    maintenance_cost DECIMAL(12,2) DEFAULT 0,
    total_cam DECIMAL(12,2) GENERATED ALWAYS AS (electricity_cost + water_cost + maintenance_cost) STORED,
    
    variance_pct DECIMAL(5,2), -- vs. budgeted
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(asset_id, space_node_id, billing_month)
);

-- 11. Revenue Share Log (POS-Based Percentage Rent)
CREATE TABLE IF NOT EXISTS revenue_share_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    financial_contract_id UUID NOT NULL REFERENCES financial_contracts(id) ON DELETE CASCADE,
    
    revenue_month DATE NOT NULL,
    gross_sales DECIMAL(12,2),
    share_percentage DECIMAL(5,2),
    calculated_rent DECIMAL(12,2),
    min_rent DECIMAL(12,2),
    payable_rent DECIMAL(12,2) GENERATED ALWAYS AS (GREATEST(min_rent, calculated_rent)) STORED,
    
    invoice_id UUID,
    payment_status VARCHAR(20),
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(financial_contract_id, revenue_month)
);

-- 12. Maintenance Prediction Log (ML-Based Alerts)
CREATE TABLE IF NOT EXISTS maintenance_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    space_node_id UUID REFERENCES space_nodes(id) ON DELETE SET NULL,
    
    asset_name VARCHAR(255),
    asset_category VARCHAR(100),
    
    failure_probability DECIMAL(3,2),
    days_to_failure INT,
    confidence_score DECIMAL(3,2),
    recommended_action VARCHAR(255),
    
    prediction_date DATE,
    work_order_created BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PHASE 2: ADD FOREIGN KEYS TO EXISTING TABLES
-- ============================================================

-- Extend properties table to link to assets (backward compatibility)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS asset_id UUID REFERENCES assets(id) ON DELETE SET NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS portfolio_id UUID REFERENCES portfolios(id) ON DELETE SET NULL;

-- Link existing units to space_nodes (via view, no direct FK)
-- CREATE VIEW unit_to_space_node_mapping AS ...

-- ============================================================
-- PHASE 3: DATA MIGRATION HELPERS (SQL Functions)
-- ============================================================

-- Function: Migrate a single property to asset + space_nodes
CREATE OR REPLACE FUNCTION migrate_property_to_asset(
    p_property_id UUID,
    p_portfolio_id UUID
) RETURNS TABLE(asset_id UUID, space_count INT) AS $$
DECLARE
    v_asset_id UUID;
    v_space_count INT := 0;
BEGIN
    -- 1. Create asset from property
    INSERT INTO assets (
        portfolio_id, asset_type_id, name, code,
        latitude, longitude, address, city,
        total_sq_ft, year_built, total_units,
        is_active, created_at
    )
    SELECT
        p_portfolio_id,
        (SELECT id FROM asset_types WHERE key = 'hospitality'),
        p.name, p.code,
        p.latitude, p.longitude, p.address, NULL,
        NULL, NULL, NULL,
        p.is_active, p.created_at
    FROM properties p
    WHERE p.id = p_property_id
    RETURNING assets.id INTO v_asset_id;

    -- 2. Migrate units to space_nodes
    INSERT INTO space_nodes (
        asset_id, space_type, label,
        sq_ft, floor_level,
        base_rent, occupancy_status,
        max_occupants, created_at
    )
    SELECT
        v_asset_id,
        u.unit_type::VARCHAR,
        u.unit_label,
        u.sq_ft, f.floor_number,
        u.base_rate, u.status::VARCHAR,
        u.max_occupancy, u.created_at
    FROM units u
    JOIN floors f ON u.floor_id = f.id
    JOIN buildings b ON f.building_id = b.id
    WHERE b.property_id = p_property_id
    ON CONFLICT (asset_id, label) DO NOTHING;

    SELECT COUNT(*) INTO v_space_count FROM space_nodes WHERE asset_id = v_asset_id;

    RETURN QUERY SELECT v_asset_id, v_space_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PHASE 4: VIEWS FOR BACKWARD COMPATIBILITY
-- ============================================================

-- View: Provide legacy property API compatibility
CREATE OR REPLACE VIEW v_properties_compat AS
SELECT
    p.id,
    p.name,
    p.code,
    p.vertical_type,
    p.booking_model,
    a.id as asset_id,
    COALESCE(a.total_sq_ft, 0) as sq_ft,
    (SELECT COUNT(*) FROM space_nodes sn WHERE sn.asset_id = a.id) as unit_count,
    p.is_active,
    p.created_at,
    p.updated_at
FROM properties p
LEFT JOIN assets a ON p.asset_id = a.id;

-- View: Provide legacy unit API compatibility
CREATE OR REPLACE VIEW v_units_compat AS
SELECT
    sn.id,
    sn.asset_id as property_id,
    sn.label as unit_label,
    sn.space_type as unit_type,
    sn.sq_ft,
    sn.base_rent as base_rate,
    sn.occupancy_status as status,
    sn.max_occupants,
    sn.created_at
FROM space_nodes sn;

-- ============================================================
-- PHASE 5: AUDIT & LOGGING
-- ============================================================

-- Add audit table for migration tracking
CREATE TABLE IF NOT EXISTS asset_migration_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_table VARCHAR(50),
    source_id UUID,
    target_table VARCHAR(50),
    target_id UUID,
    migration_status VARCHAR(20), -- 'success', 'pending', 'error'
    error_message TEXT,
    migrated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PHASE 6: PERMISSIONS & CONSTRAINTS
-- ============================================================

-- Add RLS (Row-Level Security) policies for multi-tenant isolation
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (to be customized per enterprise schema)
-- CREATE POLICY assets_isolation ON assets
--     USING (enterprise_id = current_setting('app.enterprise_id')::uuid);

-- ============================================================
-- PHASE 7: INDEXES FOR PERFORMANCE
-- ============================================================

-- Create common query indices
CREATE INDEX IF NOT EXISTS idx_space_nodes_asset_occupancy ON space_nodes(asset_id, occupancy_status);
CREATE INDEX IF NOT EXISTS idx_contracts_space_node_status ON financial_contracts(space_node_id, contract_status);
CREATE INDEX IF NOT EXISTS idx_contracts_tenant_status ON financial_contracts(tenant_id, contract_status);
CREATE INDEX IF NOT EXISTS idx_billing_schedules_due_date ON billing_schedules(next_due_date, financial_contract_id);
CREATE INDEX IF NOT EXISTS idx_cam_allocations_month ON cam_allocations(asset_id, billing_month);

-- ============================================================
-- END OF MIGRATION
-- ============================================================
-- Next steps:
-- 1. Run migration script in development environment
-- 2. Backfill test data using migrate_property_to_asset() function
-- 3. Test all views and API queries
-- 4. Run in production after validation
-- 5. Schedule data backfill during low-traffic window

COMMIT;
