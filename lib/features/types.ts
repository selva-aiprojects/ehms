// Feature Flag Types & Interfaces
// File: lib/features/types.ts
// Purpose: TypeScript definitions for feature flag system

export type FeatureFlagScope = 'global' | 'enterprise' | 'property' | 'user' | 'beta';

// Business Vertical Types
export type Vertical = 
  | 'hospitality_hotels' 
  | 'hospitality_serviced_apartments' 
  | 'apartment_rental' 
  | 'commercial' 
  | 'industrial' 
  | 'land_promotion' 
  | 'workplace_management';

export type FeatureFlagStatus = 'planning' | 'in_development' | 'beta' | 'active' | 'deprecated' | 'archived';

export type RolloutStrategy = 'all' | 'none' | 'percentage' | 'whitelist' | 'blacklist' | 'time_based' | 'geo_based' | 'custom_rule';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

// ============================================================
// Feature Flag Definitions
// ============================================================

export interface FeatureFlag {
  id: string;
  flag_key: string;
  name: string;
  description?: string;
  category: string;
  owner_team?: string;
  status: FeatureFlagStatus;
  default_enabled: boolean;
  rollout_strategy: RolloutStrategy;
  rollout_percentage: number;
  config: Record<string, any>;
  documentation_url?: string;
  changelog: ChangelogEntry[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface ChangelogEntry {
  version: string;
  release_date: string;
  what_changed: string;
  why_changed?: string;
  breaking_changes?: string;
}

// ============================================================
// Feature Flag Overrides (Multi-Level)
// ============================================================

export interface FeatureFlagOverride {
  id: string;
  feature_flag_id: string;
  scope: FeatureFlagScope;
  enterprise_id?: string;
  property_id?: string;
  user_id?: string;
  is_enabled: boolean;
  reason?: string;
  rollout_percentage: number;
  enabled_from?: string;
  enabled_until?: string;
  requested_by?: string;
  approved_by?: string;
  approval_status: ApprovalStatus;
  approval_reason?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Feature Availability & Dependencies
// ============================================================

export interface FeatureAvailability {
  id: string;
  feature_flag_id: string;
  vertical_name: Vertical;  // Which vertical this feature is available in
  min_tier?: string;  // Minimum subscription tier (basic, professional, enterprise)
  requires_verticals?: string[];  // Other verticals required for this feature
  conflicts_with?: string[];  // Verticals this conflicts with
  created_at: string;
}

export interface FeatureDependency {
  id: string;
  dependent_flag_id: string;
  required_flag_id: string;
  dependency_type: 'requires' | 'conflicts_with' | 'supersedes';
  description?: string;
}

// ============================================================
// Feature Rollout & Monitoring
// ============================================================

export interface FeatureRolloutPlan {
  id: string;
  feature_flag_id: string;
  plan_name?: string;
  description?: string;
  rollout_start_date: string;
  rollout_end_date: string;
  target_percentage: number;
  target_segment: SegmentCriteria;
  success_metrics: SuccessMetrics;
  rollback_criteria: RollbackCriteria;
  status: 'planned' | 'in_progress' | 'completed' | 'rolled_back';
  created_by?: string;
  approved_by?: string;
  rolled_back_at?: string;
  rollback_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface SegmentCriteria {
  regions?: string[];
  tiers?: string[];
  user_ids?: string[];
  enterprise_ids?: string[];
  property_ids?: string[];
}

export interface SuccessMetrics {
  max_error_rate?: number;
  min_uptime?: number;
  min_adoption_rate?: number;
  response_time_threshold_ms?: number;
}

export interface RollbackCriteria {
  error_rate_exceeds?: number;
  downtime_exceeds_minutes?: number;
  critical_errors_threshold?: number;
}

export interface FeatureFlagMetrics {
  id: string;
  feature_flag_id: string;
  metric_date: string;
  users_with_access: number;
  properties_with_access: number;
  api_calls_made: number;
  feature_actions_performed: number;
  avg_response_time_ms?: number;
  error_rate_pct?: number;
  adoption_rate_pct?: number;
  created_at: string;
}

// ============================================================
// Beta Program
// ============================================================

export interface BetaTester {
  id: string;
  user_id: string;
  enterprise_id: string;
  is_active: boolean;
  beta_tier: 'early_access' | 'beta' | 'release_candidate';
  enrolled_at: string;
  enrolled_by?: string;
}

export interface BetaFeatureAccess {
  id: string;
  beta_tester_id: string;
  feature_flag_id: string;
  granted_at: string;
  granted_by?: string;
  feedback?: string;
  feedback_submitted_at?: string;
}

// ============================================================
// Feature Flag Context (Request-Scoped)
// ============================================================

export interface FeatureFlagContext {
  user_id?: string;
  property_id?: string;
  enterprise_id?: string;
  vertical?: Vertical;  // NEW: Active business vertical/journey
  region?: string;
  tier?: string;
  user_agent?: string;
  is_beta_tester?: boolean;
}

// ============================================================
// Feature Check Result
// ============================================================

export interface FeatureCheckResult {
  flag_key: string;
  is_enabled: boolean;
  scope_matched: FeatureFlagScope;
  reason: string;
  rollout_percentage: number;
  available_from?: string;
  available_until?: string;
}

// ============================================================
// Admin Operations
// ============================================================

export interface CreateFeatureFlagRequest {
  flag_key: string;
  name: string;
  description?: string;
  category: string;
  owner_team?: string;
  default_enabled: boolean;
  rollout_strategy: RolloutStrategy;
  rollout_percentage?: number;
  config?: Record<string, any>;
  documentation_url?: string;
}

export interface UpdateFeatureFlagRequest {
  name?: string;
  description?: string;
  status?: FeatureFlagStatus;
  default_enabled?: boolean;
  rollout_strategy?: RolloutStrategy;
  rollout_percentage?: number;
  config?: Record<string, any>;
}

export interface CreateOverrideRequest {
  feature_flag_id: string;
  scope: FeatureFlagScope;
  enterprise_id?: string;
  property_id?: string;
  user_id?: string;
  is_enabled: boolean;
  reason?: string;
  rollout_percentage?: number;
  enabled_from?: string;
  enabled_until?: string;
  requires_approval?: boolean;
}

export interface ApproveOverrideRequest {
  override_id: string;
  approved: boolean;
  approval_reason?: string;
}

// ============================================================
// Audit & Logging
// ============================================================

export interface FeatureFlagAuditLog {
  id: string;
  feature_flag_id: string;
  action: string;
  change_details?: Record<string, any>;
  changed_by?: string;
  changed_at: string;
  impact_estimate?: 'low' | 'medium' | 'high';
}

// ============================================================
// Standard Feature Flags (PropOS Modules)
// ============================================================

export const FEATURE_FLAGS = {
  // PropOS Core Infrastructure
  PROPOS_ASSET_AGNOSTIC_MODEL: 'propos_asset_agnostic_model',
  PROPOS_SPACE_NODES: 'propos_space_nodes',

  // AI Agents
  AI_LEASE_ABSTRACTOR: 'ai_lease_abstractor',
  AI_LEASING_BOT: 'ai_leasing_bot',
  AI_CAM_RECONCILIATION: 'ai_cam_reconciliation',
  AI_MAINTENANCE_PREDICTOR: 'ai_maintenance_predictor',
  AI_DOCK_SCHEDULER: 'ai_dock_scheduler',
  AI_REGULATORY_TRACKER: 'ai_regulatory_tracker',

  // Commercial Module
  COMMERCIAL_MODULE: 'commercial_module',
  CAM_RECONCILIATION: 'cam_reconciliation',
  REVENUE_SHARE_INVOICING: 'revenue_share_invoicing',

  // Industrial & Logistics
  INDUSTRIAL_MODULE: 'industrial_module',
  WAREHOUSE_3D_MAPPING: 'warehouse_3d_mapping',
  DOCK_AUTOMATION: 'dock_automation',

  // Land Promotion
  LAND_PROMOTION_MODULE: 'land_promotion_module',
  PLOT_LAYOUT_TRACKER: 'plot_layout_tracker',

  // Maintenance
  MAINTENANCE_ENHANCEMENTS: 'maintenance_enhancements',

  // Hospitality (Existing, should always be enabled)
  HOSPITALITY_BASE: 'hospitality_base',
  REVENUE_AI: 'revenue_ai',
  FRONTDESK_OPERATIONS: 'frontdesk_operations',
  HOUSEKEEPING_MODULE: 'housekeeping_module',
  MAINTENANCE_MODULE: 'maintenance_module',
} as const;

// ============================================================
// Module Dependencies
// ============================================================

export const MODULE_DEPENDENCIES: Record<string, {
  requires: string[];
  conflicts_with: string[];
  min_tier?: string;
}> = {
  // Commercial requires asset model
  [FEATURE_FLAGS.COMMERCIAL_MODULE]: {
    requires: [FEATURE_FLAGS.PROPOS_ASSET_AGNOSTIC_MODEL],
    conflicts_with: [],
    min_tier: 'professional',
  },
  
  // Industrial requires asset model
  [FEATURE_FLAGS.INDUSTRIAL_MODULE]: {
    requires: [FEATURE_FLAGS.PROPOS_ASSET_AGNOSTIC_MODEL],
    conflicts_with: [],
    min_tier: 'professional',
  },

  // Land requires asset model
  [FEATURE_FLAGS.LAND_PROMOTION_MODULE]: {
    requires: [FEATURE_FLAGS.PROPOS_ASSET_AGNOSTIC_MODEL],
    conflicts_with: [],
    min_tier: 'professional',
  },

  // CAM requires commercial module
  [FEATURE_FLAGS.CAM_RECONCILIATION]: {
    requires: [FEATURE_FLAGS.COMMERCIAL_MODULE],
    conflicts_with: [],
    min_tier: 'professional',
  },

  // Revenue-share requires commercial module
  [FEATURE_FLAGS.REVENUE_SHARE_INVOICING]: {
    requires: [FEATURE_FLAGS.COMMERCIAL_MODULE],
    conflicts_with: [],
    min_tier: 'professional',
  },

  // Dock automation requires industrial module
  [FEATURE_FLAGS.DOCK_AUTOMATION]: {
    requires: [FEATURE_FLAGS.INDUSTRIAL_MODULE],
    conflicts_with: [],
    min_tier: 'professional',
  },
};
