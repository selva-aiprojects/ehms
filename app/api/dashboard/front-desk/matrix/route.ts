import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess } from "@/lib/property-scope";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;

    const rows = await sql`
      WITH active_bookings_raw AS (
        SELECT 
          b.unit_id,
          b.id as booking_id,
          b.status as booking_status,
          b.check_in,
          b.check_out,
          b.total_amount,
          g.first_name,
          g.last_name,
          NULL as parking_slot,
          (SELECT COUNT(*) FROM guest_requests gr WHERE gr.booking_id = b.id AND gr.status IN ('pending', 'in_progress')) as pending_requests_count,
          ROW_NUMBER() OVER(PARTITION BY b.unit_id ORDER BY CASE WHEN b.status = 'checked_in' THEN 1 WHEN b.status = 'confirmed' THEN 2 ELSE 3 END, b.check_in ASC) as rn
        FROM bookings b
        LEFT JOIN guest_profiles g ON g.id = b.guest_id
        WHERE b.status IN ('confirmed', 'checked_in', 'pending')
        AND (b.check_in::date <= CURRENT_DATE AND b.check_out::date >= CURRENT_DATE)
      ),
      active_bookings AS (
        SELECT * FROM active_bookings_raw WHERE rn = 1
      ),
      unit_children AS (
        SELECT
          child.parent_unit_id,
          COUNT(*) as child_count,
          COUNT(*) FILTER (WHERE child.status = 'occupied') as occupied_children,
          COUNT(*) FILTER (WHERE child.status = 'vacant') as vacant_children,
          COUNT(*) FILTER (WHERE child.status = 'dirty' OR child.status = 'cleaning') as dirty_children,
          COUNT(*) FILTER (WHERE child.status = 'maintenance') as maint_children,
          json_agg(json_build_object(
            'id', child.id,
            'unit_label', child.unit_label,
            'unit_type', child.unit_type,
            'layout_type', child.layout_type,
            'status', child.status,
            'base_rate', COALESCE(child.base_rate, rp.base_rate),
            'attributes', child.attributes
          ) ORDER BY child.unit_label) as children
        FROM units child
        LEFT JOIN (
          SELECT DISTINCT ON (property_id, unit_type) property_id, unit_type, base_rate
          FROM rate_plans 
          WHERE is_active = true 
            AND (effective_from IS NULL OR effective_from <= CURRENT_DATE)
            AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
          ORDER BY property_id, unit_type, created_at DESC
        ) rp ON rp.property_id = (
          SELECT b2.property_id FROM units u2 JOIN floors f2 ON u2.floor_id=f2.id JOIN buildings b2 ON f2.building_id=b2.id WHERE u2.id = child.parent_unit_id
        ) AND rp.unit_type = child.unit_type
        WHERE child.parent_unit_id IS NOT NULL
        GROUP BY child.parent_unit_id
      )
      SELECT 
        u.id,
        u.unit_label,
        u.unit_type,
        u.layout_type,
        u.status,
        u.attributes,
        u.parent_unit_id,
        f.floor_number,
        bl.code as building_code,
        bl.name as building_name,
        p.name as property_name,
        ab.booking_id,
        ab.booking_status,
        CASE WHEN u.parent_unit_id IS NULL THEN ab.first_name || ' ' || ab.last_name ELSE NULL END as guest_name,
        ab.check_in,
        ab.check_out,
        ab.total_amount as rate,
        false as vip,
        ab.parking_slot,
        ab.pending_requests_count,
        COALESCE(u.base_rate, rp.base_rate) as base_rate,
        uc.children,
        uc.child_count,
        uc.occupied_children,
        uc.vacant_children,
        uc.dirty_children,
        uc.maint_children
      FROM units u
      JOIN floors f ON u.floor_id = f.id
      JOIN buildings bl ON f.building_id = bl.id
      JOIN properties p ON bl.property_id = p.id
      LEFT JOIN active_bookings ab ON ab.unit_id = u.id
      LEFT JOIN (
        SELECT DISTINCT ON (property_id, unit_type) property_id, unit_type, base_rate, name as plan_name
        FROM rate_plans 
        WHERE is_active = true 
          AND (effective_from IS NULL OR effective_from <= CURRENT_DATE)
          AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
        ORDER BY property_id, unit_type, created_at DESC
      ) rp ON rp.property_id = p.id AND rp.unit_type = u.unit_type
      LEFT JOIN unit_children uc ON uc.parent_unit_id = u.id
      WHERE p.vertical_type IN ('hotel', 'service_apartment', 'rental_apartment')
      ${propertyId ? sql`AND p.id = ${propertyId}` : scope.assignedPropertyIds.length > 0 ? sql`AND p.id = ANY(${scope.assignedPropertyIds})` : sql``}
      ORDER BY bl.code, f.floor_number, u.unit_label
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[matrix GET]", error);
    return NextResponse.json({ error: "Failed to fetch room matrix" }, { status: 500 });
  }
}
