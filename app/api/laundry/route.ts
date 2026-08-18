export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess, validateMutationPropertyAccess } from "@/lib/property-scope";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const status = searchParams.get("status");
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;

    const rows = await sql`
      SELECT
        lo.*,
        json_build_object('first_name', g.first_name, 'last_name', g.last_name, 'phone', g.phone) AS guest,
        u.unit_label,
        v.company_name AS vendor_name
      FROM laundry_orders lo
      LEFT JOIN guest_profiles g ON g.id = lo.guest_id
      LEFT JOIN units u ON u.id = lo.unit_id
      LEFT JOIN vendors v ON v.id = lo.vendor_id
      WHERE 1=1
        ${propertyId ? sql`AND lo.property_id = ${propertyId}` : scope.assignedPropertyIds.length > 0 ? sql`AND lo.property_id = ANY(${scope.assignedPropertyIds})` : sql``}
        ${status ? sql`AND lo.status = ${status}` : sql``}
      ORDER BY lo.created_at DESC
      LIMIT 100
    `;
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[laundry GET]", error);
    return NextResponse.json({ error: "Failed to fetch laundry orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const accessErr = validateMutationPropertyAccess(req, body.property_id);
    if (accessErr) return accessErr;

    const orderNumber = `LND-${Date.now().toString(36).toUpperCase()}`;

    // Create order
    const orderRows = await sql`
      INSERT INTO laundry_orders (property_id, booking_id, guest_id, unit_id, order_number, total_amount, is_complimentary, special_instructions, estimated_delivery, created_by)
      VALUES (
        ${body.property_id}, ${body.booking_id || null}, ${body.guest_id || null}, ${body.unit_id || null},
        ${orderNumber}, ${body.total_amount || 0}, ${body.is_complimentary || false},
        ${body.special_instructions || null}, ${body.estimated_delivery || null}, ${body.created_by || null}
      )
      RETURNING *
    `;
    const order = orderRows[0] as Record<string, unknown>;

    // Create line items
    if (body.items && Array.isArray(body.items)) {
      for (const item of body.items) {
        await sql`
          INSERT INTO laundry_order_items (order_id, item_name, item_type, quantity, unit_price, wash_type, notes)
          VALUES (${order.id}, ${item.item_name}, ${item.item_type || null}, ${item.quantity || 1}, ${item.unit_price || 0}, ${item.wash_type || "regular"}, ${item.notes || null})
        `;
      }
    }

    return NextResponse.json({ data: order }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create laundry order";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
