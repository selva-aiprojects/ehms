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

/**
 * Validates that the requesting user has write access to a given property_id.
 * Use this in POST/PUT/DELETE handlers where property_id comes from the request body.
 *
 * Usage:
 *   const body = await req.json();
 *   const accessError = validateMutationPropertyAccess(req, body.property_id);
 *   if (accessError) return accessError;
 */
export function validateMutationPropertyAccess(
  request: NextRequest,
  propertyId: string | null | undefined
): NextResponse | null {
  const role = request.headers.get("x-user-role") || "";
  const propertyIdsHeader = request.headers.get("x-user-property-ids") || "";
  const assignedPropertyIds = propertyIdsHeader
    ? propertyIdsHeader.split(",").filter(Boolean)
    : [];

  // Super admin / executive can write to any property
  if (ROLES_WITHOUT_RESTRICTION.has(role)) {
    return null;
  }

  // If user has no property restrictions (empty = all access)
  if (assignedPropertyIds.length === 0) {
    return null;
  }

  // If a property_id is provided, validate it's in the allowed list
  if (propertyId) {
    if (!assignedPropertyIds.includes(propertyId)) {
      return NextResponse.json(
        { error: "Access denied: you do not have write access to this property" },
        { status: 403 }
      );
    }
  }

  return null;
}

/**
 * Validates that the requesting user has access to a property resolved indirectly.
 * Use this when property_id is not in the body directly, but can be looked up
 * from a parent record (e.g., booking → property_id, lease → property_id, etc.)
 *
 * Usage:
 *   const accessError = await validateIndirectPropertyAccess(req, sql, 'bookings', bookingId);
 *   if (accessError) return accessError;
 */
export async function validateIndirectPropertyAccess(
  request: NextRequest,
  sql: any,
  tableName: string,
  recordId: string,
  idColumn: string = "id",
  propertyColumn: string = "property_id"
): Promise<NextResponse | null> {
  const role = request.headers.get("x-user-role") || "";
  if (ROLES_WITHOUT_RESTRICTION.has(role)) return null;

  const propertyIdsHeader = request.headers.get("x-user-property-ids") || "";
  const assignedPropertyIds = propertyIdsHeader
    ? propertyIdsHeader.split(",").filter(Boolean)
    : [];
  if (assignedPropertyIds.length === 0) return null;

  // Look up the property_id from the parent record
  const queryText = `SELECT "${propertyColumn}" FROM "${tableName}" WHERE "${idColumn}" = $1 LIMIT 1`;
  const result = await sql.query(queryText, [recordId]);
  const rows = result.rows || result;
  if (!rows || rows.length === 0) return null; // Let the main handler deal with not-found
  const propId = rows[0][propertyColumn];
  if (propId && !assignedPropertyIds.includes(String(propId))) {
    return NextResponse.json(
      { error: "Access denied: you do not have write access to this property" },
      { status: 403 }
    );
  }
  return null;
}
