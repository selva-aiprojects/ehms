-- Viswa Group: Workspace to Vertical Mapping
-- File: database/042_viswa_vertical_mapping.sql
-- Purpose: Map Viswa's existing workspaces to the new vertical system
-- Date: 2026-08-13

SET search_path TO public, viswa;

-- ============================================================
-- STEP 1: Add subscribed_verticals to Viswa config
-- ============================================================

-- Update Viswa tenant config to include subscribed_verticals
UPDATE public.tenants
SET 
  config = config || jsonb_build_object(
    'subscribed_verticals', jsonb_build_array(
      'hospitality_hotels',
      'hospitality_serviced_apartments',
      'apartment_rental',
      'workplace_management'
    ),
    'vertical_mapping', jsonb_build_object(
      'hotels', 'hospitality_hotels',
      'apartments', 'hospitality_serviced_apartments',
      'rental', 'apartment_rental',
      'workplace', 'workplace_management'
    ),
    'workspace_to_vertical', jsonb_build_array(
      jsonb_build_object(
        'workspace_type', 'hotels',
        'workspace_name', 'Vishwa Hotels & Resorts',
        'vertical', 'hospitality_hotels',
        'properties_count', 2
      ),
      jsonb_build_object(
        'workspace_type', 'apartments',
        'workspace_name', 'Vishwa Service Apartments',
        'vertical', 'hospitality_serviced_apartments',
        'properties_count', 1
      ),
      jsonb_build_object(
        'workspace_type', 'rental',
        'workspace_name', 'Vishwa Rental Properties',
        'vertical', 'apartment_rental',
        'properties_count', 0
      ),
      jsonb_build_object(
        'workspace_type', 'workplace',
        'workspace_name', 'Vishwa Workplace Solutions',
        'vertical', 'workplace_management',
        'properties_count', 0
      )
    )
  ),
  updated_at = now()
WHERE code = 'VISWA';

-- ============================================================
-- STEP 2: Verify and Display Viswa Configuration
-- ============================================================

-- Select and display Viswa's complete configuration
SELECT 
  id,
  name,
  code,
  schema_name,
  config->>'subscribed_verticals' as subscribed_verticals,
  config->'workspace_to_vertical' as workspace_mapping,
  created_at,
  updated_at
FROM public.tenants
WHERE code = 'VISWA';

-- ============================================================
-- STEP 3: Document Viswa's Vertical Access
-- ============================================================

-- Create a comment documenting the configuration
COMMENT ON TABLE public.tenants IS 
'Multi-tenant registry. Each tenant has isolated PostgreSQL schema.
Viswa Group of Estates (VISWA) is configured with 4 subscribed verticals:
  1. hospitality_hotels - Main hotel operations
  2. hospitality_serviced_apartments - Service apartment management  
  3. apartment_rental - Long-term rental/leasing properties
  4. workplace_management - Coworking and shared workspace solutions';

-- ============================================================
-- STEP 4: Seed Feature Overrides for Viswa (Optional)
-- ============================================================

-- Enable hospitality features by default (already active)
-- Disable commercial features for Viswa (they don't use them)
-- Disable industrial features for Viswa
-- Disable land promotion features for Viswa

-- Note: These are optional - features are disabled by default for security
-- Uncomment below if you want to explicitly set them in the overrides table

/*
-- Disable commercial-only features for Viswa
INSERT INTO feature_flag_overrides (
  feature_flag_id,
  scope,
  enterprise_id,
  is_enabled,
  reason,
  approval_status
)
SELECT 
  ff.id,
  'enterprise',
  t.id,
  FALSE,
  'Commercial features not in Viswa subscription',
  'approved'
FROM feature_flags ff
CROSS JOIN public.tenants t
WHERE t.code = 'VISWA'
  AND ff.category = 'commercial'
ON CONFLICT (feature_flag_id, scope, enterprise_id, property_id, user_id) DO NOTHING;

-- Disable industrial-only features for Viswa
INSERT INTO feature_flag_overrides (
  feature_flag_id,
  scope,
  enterprise_id,
  is_enabled,
  reason,
  approval_status
)
SELECT 
  ff.id,
  'enterprise',
  t.id,
  FALSE,
  'Industrial features not in Viswa subscription',
  'approved'
FROM feature_flags ff
CROSS JOIN public.tenants t
WHERE t.code = 'VISWA'
  AND ff.category = 'industrial'
ON CONFLICT (feature_flag_id, scope, enterprise_id, property_id, user_id) DO NOTHING;

-- Disable land promotion features for Viswa
INSERT INTO feature_flag_overrides (
  feature_flag_id,
  scope,
  enterprise_id,
  is_enabled,
  reason,
  approval_status
)
SELECT 
  ff.id,
  'enterprise',
  t.id,
  FALSE,
  'Land promotion features not in Viswa subscription',
  'approved'
FROM feature_flags ff
CROSS JOIN public.tenants t
WHERE t.code = 'VISWA'
  AND ff.category = 'land'
ON CONFLICT (feature_flag_id, scope, enterprise_id, property_id, user_id) DO NOTHING;
*/

-- ============================================================
-- STEP 5: Viswa's Features by Vertical (Reference Documentation)
-- ============================================================

/*
VISWA SUBSCRIPTION DETAILS
==========================

Tenant: Viswa Group of Estates
Code: VISWA
Schema: viswa
Status: Active

SUBSCRIBED VERTICALS:
├─ hospitality_hotels (PRIMARY)
├─ hospitality_serviced_apartments
├─ apartment_rental
└─ workplace_management

WORKSPACES (within tenant):
├─ Vishwa Hotels & Resorts (hospitality_hotels)
│  └─ Properties: 
│     ├─ Viswa Grand Hotel (OVH) - 50 rooms
│     └─ Viswa Downtown Hotel - TBD
│
├─ Vishwa Service Apartments (hospitality_serviced_apartments)
│  └─ Properties:
│     └─ CSA (Chennai Service Apartments) - 45 units
│
├─ Vishwa Rental Properties (apartment_rental)
│  └─ Properties: (Currently 0, can add later)
│
└─ Vishwa Workplace Solutions (workplace_management)
   └─ Properties: (Currently 0, can add later)

AVAILABLE FEATURES BY VERTICAL:

hospitality_hotels:
  ✅ hospitality_base - Core hotel operations
  ✅ frontdesk_operations - Check-in/out, guest management
  ✅ housekeeping_module - Task management, inspections
  ✅ maintenance_module - Ticket management, vendor coordination
  ✅ revenue_ai - Dynamic pricing & occupancy forecasting
  ✅ propos_asset_agnostic_model - (Advanced, future)
  ✅ ai_maintenance_predictor - (Advanced, beta)

hospitality_serviced_apartments:
  ✅ hospitality_base - Core apartment operations
  ✅ frontdesk_operations - Check-in/out, guest management
  ✅ housekeeping_module - Task management, inspections
  ✅ maintenance_module - Ticket management, vendor coordination
  ✅ revenue_ai - Dynamic pricing & occupancy forecasting
  ✅ propos_asset_agnostic_model - (Advanced, future)
  ✅ ai_maintenance_predictor - (Advanced, beta)

apartment_rental:
  ✅ propos_asset_agnostic_model - Unified asset model
  ✅ propos_space_nodes - Flexible space containers
  ✅ ai_lease_abstractor - PDF lease extraction & analysis
  ✅ ai_leasing_bot - Conversational leasing assistant
  (Other hospitality features NOT available)

workplace_management:
  ✅ propos_asset_agnostic_model - Unified asset model
  ✅ propos_space_nodes - Flexible space containers
  ✅ maintenance_enhancements - Predictive maintenance & tenant portal
  (Other hospitality features NOT available)

NOT AVAILABLE (not subscribed):
  ❌ commercial_module - Office/retail properties
  ❌ cam_reconciliation - Common Area Maintenance
  ❌ revenue_share_invoicing - POS-based rent sharing
  ❌ industrial_module - Warehouse/logistics operations
  ❌ warehouse_3d_mapping - Volumetric warehouse mapping
  ❌ dock_automation - Automated truck scheduling
  ❌ land_promotion_module - Plot tracking
  ❌ plot_layout_tracker - Land subdivision tracking
  ❌ ai_regulatory_tracker - Compliance monitoring
  ❌ ai_dock_scheduler - Logistics automation
  ❌ ai_cam_reconciliation - Automatic CAM allocation
  ❌ ai_leasing_bot - (For commercial, not apartment_rental)

FUTURE EXPANSION OPTIONS:
  • Add 'commercial' vertical to access commercial/office features
  • Add 'industrial' vertical to access warehouse/logistics features
  • Add 'land_promotion' vertical to access land development features
  • Enable advanced AI agents as they become available
  • Enable beta features for testing (requires approval)

MIGRATION PATH:
  1. To add commercial to Viswa:
     UPDATE public.tenants
     SET config->'subscribed_verticals' = config->'subscribed_verticals' || '"commercial"'
     WHERE code = 'VISWA';
  
  2. To disable a feature:
     INSERT INTO feature_flag_overrides (...)
     VALUES (flag_id, 'enterprise', tenant_id, FALSE, reason)
  
  3. To enable beta features:
     INSERT INTO beta_feature_access (beta_tester_id, feature_flag_id)
     VALUES (tester_id, flag_id)
*/

-- ============================================================
-- END OF VISWA MAPPING
-- ============================================================
COMMIT;
