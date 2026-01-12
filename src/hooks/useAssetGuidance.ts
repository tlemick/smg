/**
 * useAssetGuidance Hook
 * 
 * Generates teen-friendly pros/cons guidance for asset investment decisions.
 * 
 * Architecture Compliance:
 * - Calls AssetGuidanceService for business logic
 * - Returns pre-formatted data ready for display
 * - No calculations in this hook (delegated to service)
 * - Returns consistent { data, isLoading, error } pattern (though synchronous)
 * 
 * @example
 * const guidance = useAssetGuidance({
 *   asset,
 *   quote,
 *   riskMeasures,
 *   userHoldings,
 *   authenticated
 * });
 * 
 * @returns {GuidanceResult} Structured guidance with pros, cons, and context
 */

import { useMemo } from 'react';
import type { GuidanceResult, GuidanceParams } from '@/types';
import { AssetGuidanceService } from '@/lib/asset-guidance-service';

/**
 * Generate asset guidance based on asset data and user holdings
 */
export function useAssetGuidance(params: GuidanceParams): GuidanceResult {
  // Use useMemo to prevent unnecessary recalculation
  // Service is synchronous and pure, so memoization is appropriate
  // We depend on params which is a stable reference from the component
  const guidance = useMemo(() => {
    return AssetGuidanceService.generateGuidance(params);
  }, [params]);

  return guidance;
}
