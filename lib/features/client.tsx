// Feature Flag Client-Side Hooks & Components
// File: lib/features/client.ts & components
// Purpose: React hooks and components for feature flag usage

'use client';

import { useEffect, useState, useContext, createContext } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useJourney, type VerticalJourney } from '@/components/providers/JourneyProvider';
import type { FeatureFlagContext, FeatureCheckResult } from './types';
import type { FEATURE_FLAGS } from './types';

function getFeatureVertical(activeJourney: VerticalJourney | 'all') {
  if (activeJourney === 'all') return undefined;

  const journeyToVertical: Record<Exclude<VerticalJourney, 'all'>, FeatureFlagContext['vertical']> = {
    hotels: 'hospitality_hotels',
    apartments: 'hospitality_serviced_apartments',
    rental: 'apartment_rental',
    workplace: 'workplace_management',
  };

  return journeyToVertical[activeJourney];
}

// ============================================================
// FEATURE FLAG CONTEXT
// ============================================================

interface FeatureFlagContextType {
  checkFeature: (flagKey: keyof typeof FEATURE_FLAGS) => Promise<boolean>;
  getFeatureDetails: (flagKey: keyof typeof FEATURE_FLAGS) => Promise<FeatureCheckResult>;
  isLoading: boolean;
  error: string | null;
  cache: Map<string, boolean>;
}

const FeatureFlagContextProvider = createContext<FeatureFlagContextType | null>(null);

// ============================================================
// SINGLE FEATURE CHECK HOOK
// ============================================================

/**
 * Check if a single feature is enabled
 * Usage: const isEnabled = useFeatureFlag('commercial_module');
 */
export function useFeatureFlag(
  flagKey: keyof typeof FEATURE_FLAGS,
  options?: {
    skipLoading?: boolean;
    cacheDuration?: number; // milliseconds
  },
): {
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  details?: FeatureCheckResult;
} {
  const { user } = useAuth();
  const { activeJourney, selectedPropertyId } = useJourney();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<FeatureCheckResult>();

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const checkFeature = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const context: FeatureFlagContext = {
          user_id: user?.id,
          property_id: selectedPropertyId || undefined,
          enterprise_id: user?.tenant_code || undefined,
          vertical: getFeatureVertical(activeJourney),
        };

        // Fetch feature check result
        const response = await fetch('/api/features/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flagKey, context }),
        });

        if (!response.ok) throw new Error('Failed to check feature');

        const data = await response.json();

        if (isMounted) {
          setIsEnabled(data.result.is_enabled);
          setDetails(data.result);
        }

        // Log usage
        if (data.result.is_enabled) {
          await fetch('/api/features/log-usage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ flagKey, context }),
          }).catch(() => {
            // Silently fail on logging
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setIsEnabled(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (!options?.skipLoading) {
      checkFeature();
    }

    if (options?.cacheDuration) {
      timeoutId = setTimeout(checkFeature, options.cacheDuration);
    }

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [flagKey, user?.id, selectedPropertyId, user?.tenant_code, activeJourney]);

  return { isEnabled, isLoading, error, details };
}

// ============================================================
// MULTIPLE FEATURES CHECK HOOK
// ============================================================

/**
 * Check multiple features at once
 * Usage: const features = useFeatures(['commercial_module', 'industrial_module']);
 */
export function useFeatures(
  flagKeys: (keyof typeof FEATURE_FLAGS)[],
): {
  features: Record<keyof typeof FEATURE_FLAGS, boolean>;
  isLoading: boolean;
  error: string | null;
} {
  const { user } = useAuth();
  const { activeJourney, selectedPropertyId } = useJourney();
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkFeatures = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const context: FeatureFlagContext = {
          user_id: user?.id,
          property_id: selectedPropertyId || undefined,
          enterprise_id: user?.tenant_code || undefined,
          vertical: getFeatureVertical(activeJourney),
        };

        const response = await fetch('/api/features/check-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flagKeys, context }),
        });

        if (!response.ok) throw new Error('Failed to check features');

        const data = await response.json();

        if (isMounted) {
          setFeatures(data.results);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkFeatures();

    return () => {
      isMounted = false;
    };
  }, [flagKeys.join(','), user?.id, selectedPropertyId, user?.tenant_code, activeJourney]);

  return { features, isLoading, error };
}

// ============================================================
// FEATURE GUARD COMPONENT (Conditional Rendering)
// ============================================================

interface FeatureGuardProps {
  flag: keyof typeof FEATURE_FLAGS;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  requireAll?: boolean; // If true, show fallback while loading
}

/**
 * Conditionally render children based on feature flag
 * Usage:
 * <FeatureGuard flag="commercial_module">
 *   <CommercialModule />
 * </FeatureGuard>
 */
export function FeatureGuard({
  flag,
  fallback = null,
  children,
  requireAll = false,
}: FeatureGuardProps) {
  const { isEnabled, isLoading } = useFeatureFlag(flag);

  if (isLoading && requireAll) {
    return <>{fallback}</>;
  }

  if (!isEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ============================================================
// FEATURE DISABLED BANNER (Admin View)
// ============================================================

interface FeatureDisabledBannerProps {
  flag: keyof typeof FEATURE_FLAGS;
  onEnableClick?: () => void;
}

export function FeatureDisabledBanner({
  flag,
  onEnableClick,
}: FeatureDisabledBannerProps) {
  const { isEnabled } = useFeatureFlag(flag);

  if (isEnabled) return null;

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-yellow-700">
            This feature ({flag}) is currently disabled.
            {onEnableClick && (
              <button
                onClick={onEnableClick}
                className="ml-2 font-medium underline hover:text-yellow-900"
              >
                Enable it
              </button>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// FEATURE REQUEST BUTTON (For Disabled Features)
// ============================================================

interface FeatureRequestButtonProps {
  flag: keyof typeof FEATURE_FLAGS;
  label?: string;
  onRequest?: () => Promise<void>;
}

export function FeatureRequestButton({
  flag,
  label = 'Request Feature',
  onRequest,
}: FeatureRequestButtonProps) {
  const { isEnabled } = useFeatureFlag(flag);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (isEnabled) return null;

  const handleRequest = async () => {
    setIsLoading(true);
    try {
      if (onRequest) {
        await onRequest();
      } else {
        // Default: Send request to backend
        await fetch('/api/features/request-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flag }),
        });
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium"
      >
        ✓ Request sent
      </button>
    );
  }

  return (
    <button
      onClick={handleRequest}
      disabled={isLoading}
      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
    >
      {isLoading ? 'Sending...' : label}
    </button>
  );
}

// ============================================================
// BETA FEATURE BADGE
// ============================================================

interface BetaFeatureBadgeProps {
  flag: keyof typeof FEATURE_FLAGS;
}

export function BetaFeatureBadge({ flag }: BetaFeatureBadgeProps) {
  const { details } = useFeatureFlag(flag);

  if (!details || details.scope_matched !== 'beta') {
    return null;
  }

  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
      Beta Feature
    </span>
  );
}

// ============================================================
// FEATURE DEPENDENCIES CHECKER
// ============================================================

interface FeatureDependenciesProps {
  flag: keyof typeof FEATURE_FLAGS;
  onDependencyMissing?: (missingFlags: string[]) => void;
}

export function FeatureDependencies({
  flag,
  onDependencyMissing,
}: FeatureDependenciesProps) {
  const [missingDependencies, setMissingDependencies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkDependencies = async () => {
      try {
        const response = await fetch(
          `/api/features/check-dependencies?flag=${flag}`
        );
        const data = await response.json();

        const missing = data.missing_flags || [];
        setMissingDependencies(missing);

        if (missing.length > 0 && onDependencyMissing) {
          onDependencyMissing(missing);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkDependencies();
  }, [flag, onDependencyMissing]);

  if (isLoading || missingDependencies.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
      <p className="text-xs text-red-700 font-medium">
        Missing dependencies: {missingDependencies.join(', ')}
      </p>
    </div>
  );
}

// ============================================================
// FEATURE ROLLOUT PROGRESS (Admin View)
// ============================================================

interface FeatureRolloutProgressProps {
  flag: keyof typeof FEATURE_FLAGS;
}

export function FeatureRolloutProgress({
  flag,
}: FeatureRolloutProgressProps) {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(`/api/features/metrics/${flag}`);
        const data = await response.json();
        setMetrics(data);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [flag]);

  if (isLoading || !metrics) {
    return <div className="animate-pulse h-4 bg-gray-200 rounded" />;
  }

  const latest = metrics[0];
  const adoptionRate = latest.adoption_rate_pct || 0;
  const usersWithAccess = latest.users_with_access || 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span>Adoption Rate</span>
        <span className="font-medium">{adoptionRate.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${adoptionRate}%` }}
        />
      </div>
      <div className="text-xs text-gray-500">
        {usersWithAccess} users have access
      </div>
    </div>
  );
}
