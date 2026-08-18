-- Feature Flag System Schema
-- File: database/040_feature_flags_module.sql
-- Purpose: Enable plug-and-play feature management across all modules
-- Allows fine-grained control: Enterprise-level, Property-level, User-level toggles

-- ============================================================
-- FEATURE FLAG ENUMS & TYPES
-- ============================================================

DO $$ BEGIN
    CREATE TYPE feature_flag_scope AS ENUM (
        'global',          -- Platform-wide flag (all tenants, all properties)
        'enterprise',      -- Enterprise-level (affects all properties in tenant)
        'property',        -- Property-level (single property only)
        'user',            -- User-level (individual user override)
        'beta'             -- Beta/experimental flag (opt-in only)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE feature_flag_status AS ENUM (
        'planning',        -- Not yet built
        'in_development',  -- Currently being built
        'beta',            -- Available to beta testers only
        'active',          -- Live and available
        'deprecated',      -- Phasing out
        'archived'         -- No longer available
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE rollout_strategy AS ENUM (
        'all',                    -- Enabled for everyone
        'none',                   -- Disabled for everyone
        'percentage',             -- Enabled for X% of users (gradual rollout)
        'whitelist',              -- Enabled for specific users/properties/enterprises
        'blacklist',              -- Disabled for specific users/properties/enterprises
        'time_based',             -- Enabled at specific dates/times
        'geo_based',              -- Enabled for specific regions/cities
        'custom_rule'             -- Custom evaluation logic
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- FEATURE FLAG DEFINITIONS & REGISTRY
-- ============================================================

CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Flag identification
    flag_key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Category & ownership
    category VARCHAR(50), -- 'hospitality', 'commercial', 'industrial', 'land', 'maintenance', 'admin', 'ai_agents'
    owner_team VARCHAR(100), -- 'backend-team', 'ai-team', etc.
    
    -- Status & lifecycle
    status feature_flag_status DEFAULT 'planning',
    target_release_date DATE,
    deprecated_date DATE,
    
    -- Configuration
    default_enabled BOOLEAN DEFAULT false,
    rollout_strategy rollout_strategy DEFAULT 'none',
    rollout_percentage INT DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    
    -- Metadata
    config JSONB DEFAULT '{}', -- Additional config: { "requires_approval": true, "depends_on": [...], "conflicts_with": [...] }
    documentation_url TEXT,
    changelog JSONB DEFAULT '[]', -- Array of version updates
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID,
    updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(flag_key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_category ON feature_flags(category);
CREATE INDEX IF NOT EXISTS idx_feature_flags_status ON feature_flags(status);

-- ============================================================
-- FEATURE FLAG OVERRIDES (Multi-Level Configuration)
-- ============================================================

CREATE TABLE IF NOT EXISTS feature_flag_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
    
    -- Scope hierarchy
    scope feature_flag_scope NOT NULL,
    enterprise_id UUID REFERENCES enterprises(id) ON DELETE CASCADE,
    property_id UUID,  -- Can reference properties table
    user_id UUID,      -- Can reference users table
    
    -- Override value
    is_enabled BOOLEAN NOT NULL,
    reason TEXT,
    
    -- Rollout control (for gradual rollout)
    rollout_percentage INT DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    
    -- Time-based control
    enabled_from TIMESTAMPTZ,
    enabled_until TIMESTAMPTZ,
    
    -- Approval workflow
    requested_by UUID,
    approved_by UUID,
    approval_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    approval_reason TEXT,
    approved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraint: Prevent duplicates at same scope level
    UNIQUE(feature_flag_id, scope, enterprise_id, property_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_flag_overrides_feature_flag_id ON feature_flag_overrides(feature_flag_id);
CREATE INDEX IF NOT EXISTS idx_flag_overrides_enterprise_id ON feature_flag_overrides(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_flag_overrides_property_id ON feature_flag_overrides(property_id);
CREATE INDEX IF NOT EXISTS idx_flag_overrides_user_id ON feature_flag_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_flag_overrides_scope ON feature_flag_overrides(scope);

-- ============================================================
-- FEATURE FLAG USAGE AUDIT LOG
-- ============================================================

CREATE TABLE IF NOT EXISTS feature_flag_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'created', 'enabled', 'disabled', 'rollout_changed', 'override_added', 'override_removed'
    change_details JSONB,
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT now(),
    impact_estimate VARCHAR(255) -- 'low', 'medium', 'high'
);

CREATE INDEX IF NOT EXISTS idx_flag_audit_log_feature_flag_id ON feature_flag_audit_log(feature_flag_id);
CREATE INDEX IF NOT EXISTS idx_flag_audit_log_changed_at ON feature_flag_audit_log(changed_at DESC);

-- ============================================================
-- FEATURE FLAG DEPENDENCIES
-- ============================================================

CREATE TABLE IF NOT EXISTS feature_flag_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dependent_flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
    required_flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
    
    -- Dependency type
    dependency_type VARCHAR(50), -- 'requires', 'conflicts_with', 'supersedes'
    description TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(dependent_flag_id, required_flag_id, dependency_type)
);

-- ============================================================
-- FEATURE AVAILABILITY MATRIX
-- ============================================================

CREATE TABLE IF NOT EXISTS feature_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
    
    -- What this feature is available for
    module_name VARCHAR(100), -- 'hospitality', 'commercial', 'industrial', 'land_promo', 'maintenance'
    vertical_name VARCHAR(100), -- Business vertical: hospitality_hotels, commercial, industrial, etc.
    min_tier VARCHAR(50), -- 'basic', 'professional', 'enterprise'
    
    -- Compatibility
    requires_modules JSONB DEFAULT '[]', -- ["module1", "module2"]
    conflicts_with JSONB DEFAULT '[]', -- ["module3"]
    
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(feature_flag_id, vertical_name)
);

CREATE INDEX IF NOT EXISTS idx_feature_availability_feature_flag_id ON feature_availability(feature_flag_id);
CREATE INDEX IF NOT EXISTS idx_feature_availability_module ON feature_availability(module_name);

-- ============================================================
-- FEATURE METRICS & MONITORING
-- ============================================================

CREATE TABLE IF NOT EXISTS feature_flag_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
    
    metric_date DATE NOT NULL,
    
    -- Usage metrics
    users_with_access INT DEFAULT 0,
    properties_with_access INT DEFAULT 0,
    api_calls_made INT DEFAULT 0,
    feature_actions_performed INT DEFAULT 0,
    
    -- Performance metrics
    avg_response_time_ms DECIMAL(10,2),
    error_rate_pct DECIMAL(5,2),
    
    -- Adoption metrics
    adoption_rate_pct DECIMAL(5,2),
    
    created_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(feature_flag_id, metric_date)
);

-- ============================================================
-- FEATURE ROLLOUT PLAN & SCHEDULING
-- ============================================================

CREATE TABLE IF NOT EXISTS feature_rollout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
    
    plan_name VARCHAR(255),
    description TEXT,
    
    -- Rollout schedule
    rollout_start_date DATE NOT NULL,
    rollout_end_date DATE NOT NULL,
    target_percentage INT CHECK (target_percentage >= 0 AND target_percentage <= 100),
    
    -- Rollout segments (who gets it)
    target_segment JSONB, -- { "regions": ["TN", "KA"], "tiers": ["enterprise"], "user_ids": [...] }
    
    -- Monitoring during rollout
    success_metrics JSONB, -- { "max_error_rate": 5, "min_uptime": 99.5 }
    rollback_criteria JSONB, -- Conditions triggering rollback
    
    status VARCHAR(20) DEFAULT 'planned', -- 'planned', 'in_progress', 'completed', 'rolled_back'
    
    created_by UUID,
    approved_by UUID,
    rolled_back_at TIMESTAMPTZ,
    rollback_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- BETA TESTER PROGRAM
-- ============================================================

CREATE TABLE IF NOT EXISTS beta_testers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    enterprise_id UUID NOT NULL REFERENCES enterprises(id),
    
    is_active BOOLEAN DEFAULT true,
    beta_tier VARCHAR(50), -- 'early_access', 'beta', 'release_candidate'
    
    enrolled_at TIMESTAMPTZ DEFAULT now(),
    enrolled_by UUID
);

CREATE INDEX IF NOT EXISTS idx_beta_testers_user_id ON beta_testers(user_id);
CREATE INDEX IF NOT EXISTS idx_beta_testers_enterprise_id ON beta_testers(enterprise_id);

CREATE TABLE IF NOT EXISTS beta_feature_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beta_tester_id UUID NOT NULL REFERENCES beta_testers(id) ON DELETE CASCADE,
    feature_flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
    
    granted_at TIMESTAMPTZ DEFAULT now(),
    granted_by UUID,
    feedback TEXT,
    feedback_submitted_at TIMESTAMPTZ,
    
    UNIQUE(beta_tester_id, feature_flag_id)
);

-- ============================================================
-- FEATURE DOCUMENTATION & CHANGELOG
-- ============================================================

CREATE TABLE IF NOT EXISTS feature_changelog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
    
    version VARCHAR(20), -- '1.0.0', '1.1.0', etc.
    release_date DATE,
    
    what_changed TEXT,
    why_changed TEXT,
    migration_guide TEXT,
    breaking_changes TEXT,
    
    documented_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- FEATURE FLAG STATES SNAPSHOT (for caching)
-- ============================================================

CREATE TABLE IF NOT EXISTS feature_flag_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    feature_flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
    scope feature_flag_scope NOT NULL,
    scope_id UUID, -- enterprise_id, property_id, or user_id
    
    is_enabled BOOLEAN NOT NULL,
    cached_at TIMESTAMPTZ DEFAULT now(),
    
    -- Cache TTL (Time To Live)
    cache_expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '1 hour'),
    
    UNIQUE(feature_flag_id, scope, scope_id)
);

CREATE INDEX IF NOT EXISTS idx_feature_flag_cache_expires ON feature_flag_cache(cache_expires_at);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function: Get effective enabled state for a feature (resolving hierarchy)
CREATE OR REPLACE FUNCTION public.is_feature_enabled(
    p_flag_key VARCHAR,
    p_user_id UUID DEFAULT NULL,
    p_property_id UUID DEFAULT NULL,
    p_enterprise_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_flag_id UUID;
    v_enabled BOOLEAN;
    v_default_enabled BOOLEAN;
BEGIN
    -- Get feature flag ID
    SELECT id, default_enabled INTO v_flag_id, v_default_enabled
    FROM feature_flags
    WHERE flag_key = p_flag_key;
    
    IF v_flag_id IS NULL THEN
        -- Feature flag doesn't exist, assume disabled for safety
        RETURN FALSE;
    END IF;
    
    -- Check hierarchy: User > Property > Enterprise > Global > Default
    
    -- 1. User-level override (highest priority)
    IF p_user_id IS NOT NULL THEN
        SELECT is_enabled INTO v_enabled
        FROM feature_flag_overrides
        WHERE feature_flag_id = v_flag_id
          AND scope = 'user'
          AND user_id = p_user_id
          AND (enabled_from IS NULL OR enabled_from <= now())
          AND (enabled_until IS NULL OR enabled_until > now())
        LIMIT 1;
        
        IF v_enabled IS NOT NULL THEN
            RETURN v_enabled;
        END IF;
    END IF;
    
    -- 2. Property-level override
    IF p_property_id IS NOT NULL THEN
        SELECT is_enabled INTO v_enabled
        FROM feature_flag_overrides
        WHERE feature_flag_id = v_flag_id
          AND scope = 'property'
          AND property_id = p_property_id
          AND (enabled_from IS NULL OR enabled_from <= now())
          AND (enabled_until IS NULL OR enabled_until > now())
        LIMIT 1;
        
        IF v_enabled IS NOT NULL THEN
            RETURN v_enabled;
        END IF;
    END IF;
    
    -- 3. Enterprise-level override
    IF p_enterprise_id IS NOT NULL THEN
        SELECT is_enabled INTO v_enabled
        FROM feature_flag_overrides
        WHERE feature_flag_id = v_flag_id
          AND scope = 'enterprise'
          AND enterprise_id = p_enterprise_id
          AND (enabled_from IS NULL OR enabled_from <= now())
          AND (enabled_until IS NULL OR enabled_until > now())
        LIMIT 1;
        
        IF v_enabled IS NOT NULL THEN
            RETURN v_enabled;
        END IF;
    END IF;
    
    -- 4. Global-level override
    SELECT is_enabled INTO v_enabled
    FROM feature_flag_overrides
    WHERE feature_flag_id = v_flag_id
      AND scope = 'global'
      AND (enabled_from IS NULL OR enabled_from <= now())
      AND (enabled_until IS NULL OR enabled_until > now())
    LIMIT 1;
    
    IF v_enabled IS NOT NULL THEN
        RETURN v_enabled;
    END IF;
    
    -- 5. Default from feature flag
    RETURN v_default_enabled;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Log feature flag usage
CREATE OR REPLACE FUNCTION public.log_feature_flag_usage(
    p_flag_key VARCHAR,
    p_user_id UUID DEFAULT NULL,
    p_property_id UUID DEFAULT NULL,
    p_enterprise_id UUID DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_flag_id UUID;
BEGIN
    SELECT id INTO v_flag_id FROM feature_flags WHERE flag_key = p_flag_key;
    
    IF v_flag_id IS NOT NULL THEN
        INSERT INTO feature_flag_metrics (feature_flag_id, metric_date, feature_actions_performed)
        VALUES (v_flag_id, CURRENT_DATE, 1)
        ON CONFLICT (feature_flag_id, metric_date) DO UPDATE
        SET feature_actions_performed = feature_flag_metrics.feature_actions_performed + 1;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- INITIAL FEATURE FLAG DEFINITIONS
-- ============================================================

INSERT INTO feature_flags (flag_key, name, description, category, status, default_enabled) VALUES
-- PropOS Core Modules
('propos_asset_agnostic_model', 'Asset-Agnostic Model', 'New unified asset model replacing property hierarchy', 'admin', 'planning', FALSE),
('propos_space_nodes', 'Space Nodes System', 'Flexible space node container (rooms, suites, plots, docks)', 'admin', 'planning', FALSE),

-- AI Agents
('ai_lease_abstractor', 'AI Lease Abstractor', 'Legal agent for PDF lease extraction', 'ai_agents', 'planning', FALSE),
('ai_leasing_bot', 'AI Leasing Bot', 'Conversational leasing assistant & auto-renewal', 'ai_agents', 'planning', FALSE),
('ai_cam_reconciliation', 'AI CAM Reconciliation', 'Automatic CAM cost allocation engine', 'ai_agents', 'planning', FALSE),
('ai_maintenance_predictor', 'AI Maintenance Predictor', 'ML-based preventive maintenance scheduler', 'ai_agents', 'planning', FALSE),
('ai_dock_scheduler', 'AI Dock Scheduler', 'Logistics dock automation & truck assignment', 'ai_agents', 'planning', FALSE),
('ai_regulatory_tracker', 'AI Regulatory Tracker', 'Land promotion compliance monitoring', 'ai_agents', 'planning', FALSE),

-- Commercial Module
('commercial_module', 'Commercial Properties Module', 'Support for office, retail, mixed-use properties', 'commercial', 'planning', FALSE),
('cam_reconciliation', 'CAM Reconciliation', 'Common Area Maintenance cost tracking', 'commercial', 'planning', FALSE),
('revenue_share_invoicing', 'Revenue-Share Invoicing', 'POS-based percentage rent calculation', 'commercial', 'planning', FALSE),

-- Industrial & Logistics
('industrial_module', 'Industrial & Logistics Module', 'Warehouse, logistics, 3PL operations', 'industrial', 'planning', FALSE),
('warehouse_3d_mapping', 'Warehouse 3D Visualization', 'Volumetric warehouse layout mapping', 'industrial', 'planning', FALSE),
('dock_automation', 'Dock Automation', 'Automated truck-to-dock scheduling', 'industrial', 'planning', FALSE),

-- Land Promotion
('land_promotion_module', 'Land Promotion Module', 'Plot tracking, infrastructure, regulatory', 'land', 'planning', FALSE),
('plot_layout_tracker', 'Plot Layout Tracker', 'Land subdivision & phase tracking', 'land', 'planning', FALSE),

-- Maintenance
('maintenance_enhancements', 'Maintenance Enhancements', 'Predictive maintenance & tenant portal', 'maintenance', 'planning', FALSE),

-- Hospitality (Existing, keep backward compatible)
('hospitality_base', 'Hospitality Base Module', 'Core hotel, service apartment, rental operations', 'hospitality', 'active', TRUE),
('revenue_ai', 'Revenue AI Engine', 'Dynamic pricing & occupancy forecasting', 'hospitality', 'active', TRUE),
('frontdesk_operations', 'Front Desk Operations', 'Check-in/out, guest management', 'hospitality', 'active', TRUE),
('housekeeping_module', 'Housekeeping Operations', 'Task management, inspections', 'hospitality', 'active', TRUE),
('maintenance_module', 'Maintenance & Vendors', 'Ticket management, vendor coordination', 'hospitality', 'active', TRUE)

ON CONFLICT(flag_key) DO NOTHING;

-- ============================================================
-- END OF FEATURE FLAGS SCHEMA
-- ============================================================
COMMIT;
