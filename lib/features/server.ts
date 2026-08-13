// Feature Flag Server-Side Utilities
// File: lib/features/server.ts
// Purpose: Server-side feature flag evaluation and management

import { getDb } from '@/lib/db';
import {
  FEATURE_FLAGS,
  MODULE_DEPENDENCIES,
} from './types';
import type {
  FeatureFlagContext,
  FeatureCheckResult,
  FeatureFlagScope,
} from './types';

// ============================================================
// MAIN FEATURE CHECK FUNCTION
// ============================================================

/**
 * Check if a feature is enabled for the given context
 * Resolves hierarchy: User > Property > Enterprise > Global > Default
 */
export async function isFeatureEnabled(
  flagKey: keyof typeof FEATURE_FLAGS,
  context: FeatureFlagContext,
): Promise<boolean> {
  try {
    const db = await getDb();
    
    // Use the SQL function for efficient hierarchy resolution
    // Now includes vertical parameter for multi-vertical support
    const result = await db.query(
      `SELECT is_feature_enabled($1, $2, $3, $4, $5) as enabled`,
      [
        flagKey,
        context.user_id || null,
        context.property_id || null,
        context.enterprise_id || null,
        context.vertical || null,  // NEW: Pass vertical/journey context
      ]
    );

    if (result.length === 0) {
      return false;
    }

    return result[0].enabled === true;
  } catch (error) {
    console.error(`[Feature Flag] Error checking ${flagKey}:`, error);
    // Fail safe: return false on error
    return false;
  }
}

/**
 * Get detailed feature check result with metadata
 */
export async function getFeatureCheckResult(
  flagKey: keyof typeof FEATURE_FLAGS,
  context: FeatureFlagContext,
): Promise<FeatureCheckResult> {
  const db = await getDb();

  // Get feature flag definition
  const flagResult = await db.query(
    `SELECT * FROM feature_flags WHERE flag_key = $1`,
    [flagKey]
  );

  if (flagResult.length === 0) {
    return {
      flag_key: flagKey,
      is_enabled: false,
      scope_matched: 'global',
      reason: 'Feature flag not found',
      rollout_percentage: 0,
    };
  }

  const flag = flagResult[0];

  // Check if enabled
  const isEnabled = await isFeatureEnabled(flagKey, context);

  // Get override details (to determine scope matched)
  let scope_matched: FeatureFlagScope | 'default' = 'default';
  let reason = `Default: ${flag.default_enabled ? 'enabled' : 'disabled'}`;

  // Check hierarchy for which scope matched
  if (context.user_id) {
    const userOverride = await db.query(
      `SELECT * FROM feature_flag_overrides 
       WHERE feature_flag_id = $1 AND scope = 'user' AND user_id = $2
       AND (enabled_from IS NULL OR enabled_from <= now())
       AND (enabled_until IS NULL OR enabled_until > now())
       LIMIT 1`,
      [flag.id, context.user_id]
    );
    if (userOverride.length > 0) {
      scope_matched = 'user';
      reason = `User override: ${userOverride[0].reason || 'No reason provided'}`;
    }
  }

  if (scope_matched === 'default' && context.property_id) {
    const propOverride = await db.query(
      `SELECT * FROM feature_flag_overrides 
       WHERE feature_flag_id = $1 AND scope = 'property' AND property_id = $2
       AND (enabled_from IS NULL OR enabled_from <= now())
       AND (enabled_until IS NULL OR enabled_until > now())
       LIMIT 1`,
      [flag.id, context.property_id]
    );
    if (propOverride.length > 0) {
      scope_matched = 'property';
      reason = `Property override: ${propOverride[0].reason || 'No reason provided'}`;
    }
  }

  if (scope_matched === 'default' && context.enterprise_id) {
    const entOverride = await db.query(
      `SELECT * FROM feature_flag_overrides 
       WHERE feature_flag_id = $1 AND scope = 'enterprise' AND enterprise_id = $2
       AND (enabled_from IS NULL OR enabled_from <= now())
       AND (enabled_until IS NULL OR enabled_until > now())
       LIMIT 1`,
      [flag.id, context.enterprise_id]
    );
    if (entOverride.length > 0) {
      scope_matched = 'enterprise';
      reason = `Enterprise override: ${entOverride[0].reason || 'No reason provided'}`;
    }
  }

  if (scope_matched === 'default') {
    const globalOverride = await db.query(
      `SELECT * FROM feature_flag_overrides 
       WHERE feature_flag_id = $1 AND scope = 'global'
       AND (enabled_from IS NULL OR enabled_from <= now())
       AND (enabled_until IS NULL OR enabled_until > now())
       LIMIT 1`,
      [flag.id]
    );
    if (globalOverride.length > 0) {
      scope_matched = 'global';
      reason = `Global override: ${globalOverride[0].reason || 'No reason provided'}`;
    }
  }

  return {
    flag_key: flagKey,
    is_enabled: isEnabled,
    scope_matched: scope_matched === 'default' ? 'global' : scope_matched,
    reason,
    rollout_percentage: flag.rollout_percentage,
    available_from: flag.target_release_date,
  };
}

// ============================================================
// MULTIPLE FEATURES CHECK (Batch)
// ============================================================

/**
 * Check multiple features at once (more efficient)
 */
export async function checkFeatures(
  flagKeys: (keyof typeof FEATURE_FLAGS)[],
  context: FeatureFlagContext,
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};

  const checks = flagKeys.map(flagKey => isFeatureEnabled(flagKey, context));
  const results_array = await Promise.all(checks);

  flagKeys.forEach((flagKey, index) => {
    results[flagKey] = results_array[index];
  });

  return results;
}

// ============================================================
// DEPENDENCY CHECKING
// ============================================================

/**
 * Check if a feature can be enabled (all dependencies met)
 */
export async function canEnableFeature(
  flagKey: keyof typeof FEATURE_FLAGS,
  context: FeatureFlagContext,
): Promise<{
  can_enable: boolean;
  blocking_flags: string[];
  conflicting_flags: string[];
  reason: string;
}> {
  const deps = MODULE_DEPENDENCIES[flagKey as string];

  if (!deps) {
    return {
      can_enable: true,
      blocking_flags: [],
      conflicting_flags: [],
      reason: 'No dependencies defined',
    };
  }

  // Check required dependencies
  const requiredChecks = await checkFeatures(
    deps.requires as (keyof typeof FEATURE_FLAGS)[],
    context
  );
  const blocking_flags = Object.entries(requiredChecks)
    .filter(([, enabled]) => !enabled)
    .map(([key]) => key);

  // Check conflicts
  const conflictsChecks = await checkFeatures(
    deps.conflicts_with as (keyof typeof FEATURE_FLAGS)[],
    context
  );
  const conflicting_flags = Object.entries(conflictsChecks)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key);

  const can_enable = blocking_flags.length === 0 && conflicting_flags.length === 0;
  let reason = 'All dependencies met';

  if (blocking_flags.length > 0) {
    reason = `Requires: ${blocking_flags.join(', ')}`;
  }
  if (conflicting_flags.length > 0) {
    reason = `Conflicts with: ${conflicting_flags.join(', ')}`;
  }

  return {
    can_enable,
    blocking_flags,
    conflicting_flags,
    reason,
  };
}

// ============================================================
// ENABLE/DISABLE FEATURES (Admin)
// ============================================================

/**
 * Enable a feature globally or for specific scope
 */
export async function enableFeature(
  flagKey: keyof typeof FEATURE_FLAGS,
  scope: 'global' | 'enterprise' | 'property' | 'user',
  scopeId?: string,
  context?: { user_id?: string; enterprise_id?: string; property_id?: string },
  reason?: string,
): Promise<{ success: boolean; message: string }> {
  try {
    // Check dependencies first
    const depCheck = await canEnableFeature(flagKey, context || {});
    if (!depCheck.can_enable) {
      return {
        success: false,
        message: `Cannot enable: ${depCheck.reason}`,
      };
    }

    const db = await getDb();

    // Get feature flag ID
    const flagResult = await db.query(
      `SELECT id FROM feature_flags WHERE flag_key = $1`,
      [flagKey]
    );

    if (flagResult.length === 0) {
      return {
        success: false,
        message: `Feature flag '${flagKey}' not found`,
      };
    }

    const flagId = flagResult[0].id;

    // Create or update override
    const scopeFields = {
      global: { enterprise_id: null, property_id: null, user_id: null },
      enterprise: { enterprise_id: scopeId, property_id: null, user_id: null },
      property: { enterprise_id: null, property_id: scopeId, user_id: null },
      user: { enterprise_id: null, property_id: null, user_id: scopeId },
    };

    const fields = scopeFields[scope];

    const existing = await db.query(
      `SELECT id FROM feature_flag_overrides
       WHERE feature_flag_id = $1 AND scope = $2
         AND enterprise_id IS NOT DISTINCT FROM $3
         AND property_id IS NOT DISTINCT FROM $4
         AND user_id IS NOT DISTINCT FROM $5
       LIMIT 1`,
      [flagId, scope, fields.enterprise_id, fields.property_id, fields.user_id]
    );

    if (existing.length > 0) {
      await db.query(
        `UPDATE feature_flag_overrides
         SET is_enabled = TRUE, updated_at = now(), reason = $2, approval_status = 'approved', approved_at = now()
         WHERE id = $1`,
        [existing[0].id, reason || 'Admin enabled']
      );
    } else {
      await db.query(
        `INSERT INTO feature_flag_overrides
         (feature_flag_id, scope, enterprise_id, property_id, user_id, is_enabled, reason, approval_status)
         VALUES ($1, $2, $3, $4, $5, TRUE, $6, 'approved')`,
        [flagId, scope, fields.enterprise_id, fields.property_id, fields.user_id, reason || 'Admin enabled']
      );
    }

    // Log audit event
    await db.query(
      `INSERT INTO feature_flag_audit_log (feature_flag_id, action, changed_by)
       VALUES ($1, 'enabled', $2)`,
      [flagId, context?.user_id || 'system']
    );

    return {
      success: true,
      message: `Feature '${flagKey}' enabled for ${scope}`,
    };
  } catch (error) {
    console.error(`[Feature Flag] Error enabling ${flagKey}:`, error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Disable a feature
 */
export async function disableFeature(
  flagKey: keyof typeof FEATURE_FLAGS,
  scope: 'global' | 'enterprise' | 'property' | 'user',
  scopeId?: string,
  reason?: string,
  context?: { user_id?: string },
): Promise<{ success: boolean; message: string }> {
  try {
    const db = await getDb();

    const flagResult = await db.query(
      `SELECT id FROM feature_flags WHERE flag_key = $1`,
      [flagKey]
    );

    if (flagResult.length === 0) {
      return {
        success: false,
        message: `Feature flag '${flagKey}' not found`,
      };
    }

    const flagId = flagResult[0].id;
    const scopeFields = {
      global: { enterprise_id: null, property_id: null, user_id: null },
      enterprise: { enterprise_id: scopeId, property_id: null, user_id: null },
      property: { enterprise_id: null, property_id: scopeId, user_id: null },
      user: { enterprise_id: null, property_id: null, user_id: scopeId },
    };

    const fields = scopeFields[scope];

    const existing = await db.query(
      `SELECT id FROM feature_flag_overrides
       WHERE feature_flag_id = $1 AND scope = $2
         AND enterprise_id IS NOT DISTINCT FROM $3
         AND property_id IS NOT DISTINCT FROM $4
         AND user_id IS NOT DISTINCT FROM $5
       LIMIT 1`,
      [flagId, scope, fields.enterprise_id, fields.property_id, fields.user_id]
    );

    if (existing.length > 0) {
      await db.query(
        `UPDATE feature_flag_overrides
         SET is_enabled = FALSE, updated_at = now(), reason = $2, approval_status = 'approved', approved_at = now()
         WHERE id = $1`,
        [existing[0].id, reason || 'Admin disabled']
      );
    } else {
      await db.query(
        `INSERT INTO feature_flag_overrides
         (feature_flag_id, scope, enterprise_id, property_id, user_id, is_enabled, reason, approval_status)
         VALUES ($1, $2, $3, $4, $5, FALSE, $6, 'approved')`,
        [flagId, scope, fields.enterprise_id, fields.property_id, fields.user_id, reason || 'Admin disabled']
      );
    }

    // Log audit event
    await db.query(
      `INSERT INTO feature_flag_audit_log (feature_flag_id, action, changed_by)
       VALUES ($1, 'disabled', $2)`,
      [flagId, context?.user_id || 'system']
    );

    return {
      success: true,
      message: `Feature '${flagKey}' disabled for ${scope}`,
    };
  } catch (error) {
    console.error(`[Feature Flag] Error disabling ${flagKey}:`, error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================
// FEATURE LISTING & STATUS
// ============================================================

/**
 * Get all features with their current status for a context
 */
export async function getAllFeatures(
  context: FeatureFlagContext,
): Promise<Array<{ flag_key: string; is_enabled: boolean; status: string }>> {
  const db = await getDb();

  const flags = await db.query(
    `SELECT flag_key, status FROM feature_flags ORDER BY category, name`
  );

  const results = await Promise.all(
    flags.map(async (flag) => ({
      flag_key: flag.flag_key,
      is_enabled: await isFeatureEnabled(flag.flag_key as keyof typeof FEATURE_FLAGS, context),
      status: flag.status,
    }))
  );

  return results;
}

/**
 * Get available features for an enterprise tier
 */
export async function getFeaturesForTier(
  tier: 'basic' | 'professional' | 'enterprise',
  context: FeatureFlagContext,
): Promise<Array<{ flag_key: string; is_enabled: boolean }>> {
  const db = await getDb();

  const features = await db.query(
    `SELECT DISTINCT ff.flag_key
     FROM feature_flags ff
     LEFT JOIN feature_availability fa ON ff.id = fa.feature_flag_id
     WHERE fa.min_tier IS NULL OR fa.min_tier = ANY($1::VARCHAR[])
     ORDER BY ff.name`,
    [
      tier === 'basic'
        ? ['basic']
        : tier === 'professional'
        ? ['basic', 'professional']
        : ['basic', 'professional', 'enterprise'],
    ]
  );

  const results = await Promise.all(
    features.map(async (feature) => ({
      flag_key: feature.flag_key,
      is_enabled: await isFeatureEnabled(feature.flag_key as keyof typeof FEATURE_FLAGS, context),
    }))
  );

  return results;
}

// ============================================================
// FEATURE METRICS & MONITORING
// ============================================================

/**
 * Log feature usage
 */
export async function logFeatureUsage(
  flagKey: keyof typeof FEATURE_FLAGS,
  context?: FeatureFlagContext,
): Promise<void> {
  try {
    const db = await getDb();
    await db.query(
      `SELECT log_feature_flag_usage($1, $2, $3, $4)`,
      [flagKey, context?.user_id, context?.property_id, context?.enterprise_id]
    );
  } catch (error) {
    // Don't throw on logging errors
    console.error(`[Feature Flag] Error logging usage for ${flagKey}:`, error);
  }
}

/**
 * Get feature metrics
 */
export async function getFeatureMetrics(flagKey: keyof typeof FEATURE_FLAGS) {
  const db = await getDb();

  const flagResult = await db.query(
    `SELECT id FROM feature_flags WHERE flag_key = $1`,
    [flagKey]
  );

  if (flagResult.length === 0) {
    return null;
  }

  const metrics = await db.query(
    `SELECT * FROM feature_flag_metrics 
     WHERE feature_flag_id = $1 
     ORDER BY metric_date DESC LIMIT 30`,
    [flagResult[0].id]
  );

  return metrics;
}
