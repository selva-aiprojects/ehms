-- Feature Flags: Vertical-Scoped Support
-- File: database/041_feature_flags_vertical_extension.sql
-- Purpose: Extend feature flag system to support multi-vertical subscriptions
-- Date: 2026-08-13

-- ============================================================
-- STEP 1: Add Vertical Subscription Support to Tenants
-- ============================================================

-- Add subscribed_verticals column to tenants table
ALTER TABLE IF EXISTS public.tenants 
ADD COLUMN IF NOT EXISTS subscribed_verticals JSONB DEFAULT '["hospitality_hotels"]';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenants_subscribed_verticals 
ON public.tenants USING GIN (subscribed_verticals);

-- ============================================================
-- STEP 2: Define Vertical Constants (in config.jsonb)
-- ============================================================

-- Verticals supported by PropOS:
-- 'hospitality_hotels' - Hotels and Resorts
-- 'hospitality_serviced_apartments' - Serviced Apartments
-- 'apartment_rental' - Long-term Apartment Rental/Leasing
-- 'commercial' - Office, Retail, Mixed-Use
-- 'industrial' - Warehouse, Logistics, 3PL
-- 'land_promotion' - Land Development, Plots
-- 'workplace_management' - Coworking, Desk Sharing, Office Services

-- ============================================================
-- STEP 3: Populate Feature Availability Matrix
-- ============================================================

-- Ensure vertical_name column exists (added in 040, kept idempotent here)
ALTER TABLE feature_availability ADD COLUMN IF NOT EXISTS vertical_name VARCHAR(100);

-- module_name is legacy; 041 maps availability by vertical_name
ALTER TABLE feature_availability ALTER COLUMN module_name DROP NOT NULL;

-- Unique constraint matching the ON CONFLICT target (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_feature_availability_flag_vertical'
    ) THEN
        ALTER TABLE feature_availability
        ADD CONSTRAINT uq_feature_availability_flag_vertical UNIQUE (feature_flag_id, vertical_name);
    END IF;
END $$;

-- Clear existing data
DELETE FROM feature_availability;

-- HOSPITALITY Features
INSERT INTO feature_availability (feature_flag_id, vertical_name, min_tier) VALUES
  ((SELECT id FROM feature_flags WHERE flag_key = 'hospitality_base'), 'hospitality_hotels', 'basic'),
  ((SELECT id FROM feature_flags WHERE flag_key = 'hospitality_base'), 'hospitality_serviced_apartments', 'basic'),
  ((SELECT id FROM feature_flags WHERE flag_key = 'revenue_ai'), 'hospitality_hotels', 'professional'),
  ((SELECT id FROM feature_flags WHERE flag_key = 'revenue_ai'), 'hospitality_serviced_apartments', 'professional'),
  ((SELECT id FROM feature_flags WHERE flag_key = 'frontdesk_operations'), 'hospitality_hotels', 'basic'),
  ((SELECT id FROM feature_flags WHERE flag_key = 'frontdesk_operations'), 'hospitality_serviced_apartments', 'basic'),
  ((SELECT id FROM feature_flags WHERE flag_key = 'housekeeping_module'), 'hospitality_hotels', 'basic'),
  ((SELECT id FROM feature_flags WHERE flag_key = 'housekeeping_module'), 'hospitality_serviced_apartments', 'basic'),
  ((SELECT id FROM feature_flags WHERE flag_key = 'maintenance_module'), 'hospitality_hotels', 'basic'),
  ((SELECT id FROM feature_flags WHERE flag_key = 'maintenance_module'), 'hospitality_serviced_apartments', 'basic')
ON CONFLICT(feature_flag_id, vertical_name) DO NOTHING;

-- COMMERCIAL Features
INSERT INTO feature_availability (feature_flag_id, vertical_name, min_tier) VALUES
  ((SELECT id FROM feature_flags WHERE flag_key = 'commercial_module'), 'commercial', 'enterprise'),
  ((SELECT id FROM feature_flags WHERE flag_key = 'cam_reconciliation'), 'commercial', 'enterprise'),
  ((SELECT id FROM feature_flags WHERE flag_key = 'revenue_share_invoicing'), 'commercial', 'enterprise'),
  ((SELECT id FROM feature_flags WHERE flag_key = 'propos_asset_agnostic_model'), 'commercial', 'enterprise'),
  ((SELECT id FROM feature_flags WHERE flag_key = 'propos_space_nodes'), 'commercial', 'enterprise')
ON CONFLICT(feature_flag_id, vertical_name) DO NOTHING;

-- INDUSTRIAL Features
INSERT INTO feature_availability (feature_flag_id, vertical_name, min_tier) VALUES
  ((SELECT id FROM feature_flags WHERE flag_key = 'industrial_module'), 'industrial', 'enterprise'),
  ((SELECT id FROM feature_flags WHERE flag_key = 'warehouse_3d_mapping'), 'industrial', 'enterprise'),
  ((SELECT id FROM feature_flags WHERE flag_key = 'dock_automation'), 'industrial', 'enterprise'),
  ((SELECT id FROM feature_flags WHERE flag_key = 'propos_asset_agnostic_model'), 'industrial', 'enterprise'),
  ((SELECT id FROM feature_flags WHERE flag_key = 'propos_space_nodes'), 'industrial', 'enterprise')
ON CONFLICT(feature_flag_id, vertical_name) DO NOTHING;

-- APARTMENT RENTAL/LEASING Features
INSERT INTO feature_availability (feature_flag_id, vertical_name, min_tier) VALUES
  ((SELECT id FROM feature_flags WHERE flag_key = 'propos_asset_agnostic_model'), 'apartment_rental', 'professional'),
  ((SELECT id FROM feature_flags WHERE flag_key = 'propos_space_nodes'), 'apartment_rental', 'professional'),
  ((SELECT id FROM feature_flags WHERE flag_key = 'ai_lease_abstractor'), 'apartment_rental', 'professional'),
  ((SELECT id FROM feature_flags WHERE flag_key = 'ai_leasing_bot'), 'apartment_rental', 'professional')
ON CONFLICT(feature_flag_id, vertical_name) DO NOTHING;

-- LAND PROMOTION Features
INSERT INTO feature_availability (feature_flag_id, vertical_name, min_tier) VALUES
  ((SELECT id FROM feature_flags WHERE flag_key = 'land_promotion_module'), 'land_promotion', 'enterprise'),
  ((SELECT id FROM feature_flags WHERE flag_key = 'plot_layout_tracker'), 'land_promotion', 'enterprise'),
  ((SELECT id FROM feature_flags WHERE flag_key = 'propos_asset_agnostic_model'), 'land_promotion', 'enterprise'),
  ((SELECT id FROM feature_flags WHERE flag_key = 'propos_space_nodes'), 'land_promotion', 'enterprise'),
  ((SELECT id FROM feature_flags WHERE flag_key = 'ai_regulatory_tracker'), 'land_promotion', 'enterprise')
ON CONFLICT(feature_flag_id, vertical_name) DO NOTHING;

-- WORKPLACE MANAGEMENT Features
INSERT INTO feature_availability (feature_flag_id, vertical_name, min_tier) VALUES
  ((SELECT id FROM feature_flags WHERE flag_key = 'propos_asset_agnostic_model'), 'workplace_management', 'professional'),
  ((SELECT id FROM feature_flags WHERE flag_key = 'propos_space_nodes'), 'workplace_management', 'professional'),
  ((SELECT id FROM feature_flags WHERE flag_key = 'maintenance_enhancements'), 'workplace_management', 'professional')
ON CONFLICT(feature_flag_id, vertical_name) DO NOTHING;

-- AI AGENTS (Available across verticals with appropriate config)
INSERT INTO feature_availability (feature_flag_id, vertical_name, min_tier) VALUES
  ((SELECT id FROM feature_flags WHERE flag_key = 'ai_lease_abstractor'), 'commercial', 'enterprise'),
  ((SELECT id FROM feature_flags WHERE flag_key = 'ai_leasing_bot'), 'commercial', 'enterprise'),
  ((SELECT id FROM feature_flags WHERE flag_key = 'ai_cam_reconciliation'), 'commercial', 'enterprise'),
  ((SELECT id FROM feature_flags WHERE flag_key = 'ai_maintenance_predictor'), 'hospitality_hotels', 'professional'),
  ((SELECT id FROM feature_flags WHERE flag_key = 'ai_maintenance_predictor'), 'hospitality_serviced_apartments', 'professional'),
  ((SELECT id FROM feature_flags WHERE flag_key = 'ai_dock_scheduler'), 'industrial', 'enterprise')
ON CONFLICT(feature_flag_id, vertical_name) DO NOTHING;

-- ============================================================
-- STEP 4: Enhanced Feature Flag Resolution Function
-- ============================================================

-- Drop and recreate the function with vertical awareness
DROP FUNCTION IF EXISTS public.is_feature_enabled(VARCHAR, UUID, UUID, UUID);

CREATE OR REPLACE FUNCTION public.is_feature_enabled(
    p_flag_key VARCHAR,
    p_user_id UUID DEFAULT NULL,
    p_property_id UUID DEFAULT NULL,
    p_enterprise_id UUID DEFAULT NULL,
    p_vertical VARCHAR DEFAULT NULL  -- NEW: Vertical/journey context
) RETURNS BOOLEAN AS $$
DECLARE
    v_flag_id UUID;
    v_enabled BOOLEAN;
    v_default_enabled BOOLEAN;
BEGIN
    -- Get feature flag ID and default state
    SELECT id, default_enabled INTO v_flag_id, v_default_enabled
    FROM feature_flags
    WHERE flag_key = p_flag_key;
    
    IF v_flag_id IS NULL THEN
        -- Feature flag doesn't exist, assume disabled for safety
        RETURN FALSE;
    END IF;
    
    -- NEW: Check if feature is available for the requested vertical
    IF p_vertical IS NOT NULL THEN
        PERFORM 1 FROM feature_availability
        WHERE feature_flag_id = v_flag_id
        AND vertical_name = p_vertical;
        
        -- Feature not available in this vertical
        IF NOT FOUND THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    -- Check hierarchy: User > Property > Enterprise > Global > Default
    
    -- 1. User-level override (highest priority)
    IF p_user_id IS NOT NULL THEN
        SELECT is_enabled INTO v_enabled
        FROM feature_flag_overrides
        WHERE feature_flag_id = v_flag_id
          AND scope = 'user'
          AND user_id = p_user_id
          AND (approval_status IS NULL OR approval_status = 'approved')
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
          AND (approval_status IS NULL OR approval_status = 'approved')
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
          AND (approval_status IS NULL OR approval_status = 'approved')
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
      AND (approval_status IS NULL OR approval_status = 'approved')
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

-- ============================================================
-- STEP 5: Seed Test Data for Vertical Subscriptions
-- ============================================================

-- Update demo tenant subscriptions
UPDATE public.tenants SET subscribed_verticals = '["hospitality_hotels", "hospitality_serviced_apartments"]' 
WHERE name LIKE '%Hospitality%' OR name LIKE '%Hotel%';

-- Create test tenants if needed (this will be done via app UI)
-- INSERT INTO tenants (name, subscribed_verticals, config) 
-- VALUES (
--   'Test Commercial Company',
--   '["commercial"]',
--   jsonb_build_object('workspaces', jsonb_build_array(...))
-- );

-- ============================================================
-- STEP 6: Verification Query
-- ============================================================

-- Query to verify feature availability across verticals
-- SELECT 
--   ff.flag_key,
--   ff.name,
--   fa.vertical_name,
--   fa.min_tier,
--   COUNT(*) as available_in_verticals
-- FROM feature_flags ff
-- LEFT JOIN feature_availability fa ON ff.id = fa.feature_flag_id
-- GROUP BY ff.id, ff.flag_key, ff.name, fa.vertical_name, fa.min_tier
-- ORDER BY ff.category, ff.name;

-- ============================================================
-- END OF VERTICAL EXTENSION
-- ============================================================
COMMIT;
