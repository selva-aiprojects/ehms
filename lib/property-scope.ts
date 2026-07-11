/**
 * lib/property-scope.ts — Server-side property scoping enforcement
 *
 * Usage in API routes:
 *   const scope = await validatePropertyAccess(request);
 *   if (scope.error) return scope.error;  // returns NextResponse 403
 *   // scope.propertyId is the validated property_id (or null for "all assigned")
 *   // scope.propertyFilter is a SQL fragment like "AND property_id = $1" or "" for all
 */
import { NextRequest, NextResponse } from "next/server";

const ROLES_WITHOUT_RESTRICTION = new Set([
  "super_admin",
  "executive",
  "platform_super_admin",
]);

export interface PropertyScope {
  propertyId: string | null;
  assignedPropertyIds: string[];
  error: NextResponse | null;
}

/**
 * Validates that the requesting user has access to the requested property_id.
 * - super_admin / executive: no restriction, can see all properties
 * - property_manager / dept roles: must have the requested property in their assigned_property_ids
 * - If no property_id is requested, returns all assigned IDs (caller decides how to filter)
 */
export async function validatePropertyAccess(
  request: NextRequest
): Promise<PropertyScope> {
  const role = request.headers.get("x-user-role") || "";
  const requestedPropertyId = request.nextUrl.searchParams.get("property_id");
  const propertyIdsHeader = request.headers.get("x-user-property-ids") || "";
  const assignedPropertyIds = propertyIdsHeader
    ? propertyIdsHeader.split(",").filter(Boolean)
    : [];

  // Super admin / executive can see everything
  if (ROLES_WITHOUT_RESTRICTION.has(role)) {
    return {
      propertyId: requestedPropertyId,
      assignedPropertyIds: [],
      error: null,
    };
  }

  // If user has no property restrictions (empty = all access, e.g. super_admin without assignments)
  if (assignedPropertyIds.length === 0) {
    return {
      propertyId: requestedPropertyId,
      assignedPropertyIds: [],
      error: null,
    };
  }

  // If a specific property is requested, validate it's in the allowed list
  if (requestedPropertyId) {
    if (!assignedPropertyIds.includes(requestedPropertyId)) {
      return {
        propertyId: null,
        assignedPropertyIds,
        error: NextResponse.json(
          { error: "Access denied: you do not have access to this property" },
          { status: 403 }
        ),
      };
    }
    return {
      propertyId: requestedPropertyId,
      assignedPropertyIds,
      error: null,
    };
  }

  // No specific property requested — return all assigned IDs
  return {
    propertyId: null,
    assignedPropertyIds,
    error: null,
  };
}
