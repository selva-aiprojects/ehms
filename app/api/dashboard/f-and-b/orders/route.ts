import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess, validateMutationPropertyAccess } from "@/lib/property-scope";

export const dynamic = "force-dynamic";

// GET — list F&B orders
// Schema: f_and_b_orders has NO unit_id column; get unit via bookings JOIN
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sql = getDb();
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;
    const rows = await sql`
      SELECT
        o.id,
        o.order_type,
        o.status,
        o.total_amount,
        o.is_complimentary,
        o.ordered_at AS created_at,
        b.id   AS booking_id,
        u.unit_label,
        (
          SELECT COALESCE(
            json_agg(
              json_build_object(
                'item_name', oi.item_name,
                'quantity',  oi.quantity,
                'price',     oi.unit_price
              )
            ),
            '[]'::json
          )
          FROM f_and_b_order_items oi
          WHERE oi.order_id = o.id
        ) AS items
      FROM f_and_b_orders o
      LEFT JOIN bookings b ON b.id = o.booking_id
      LEFT JOIN units    u ON u.id = b.unit_id
      WHERE 1=1
      ${scope.assignedPropertyIds.length > 0 ? sql`AND o.property_id = ANY(${scope.assignedPropertyIds})` : sql``}
      ORDER BY o.ordered_at DESC
      LIMIT 50
    `;

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[orders GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch orders" }, { status: 500 });
  }
}

// POST — create a new F&B order
// Schema fixes:
//   f_and_b_orders       — no unit_id column; columns: property_id, booking_id, order_type, total_amount, is_complimentary, notes
//   f_and_b_order_items  — item_name NOT NULL; no subtotal (generated as line_total = quantity*unit_price)
//   invoices             — columns: subtotal, tax_total, grand_total, paid_total (NOT total_amount / balance_due)
//   invoice_lines        — columns: invoice_id, description, quantity, unit_price, tax_rate (NOT amount/line_type)
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { propertyId, bookingId, orderType, isComplimentary, items, notes } = body;

    if (!propertyId || !items || !items.length) {
      return NextResponse.json({ error: "Missing required fields: propertyId and items" }, { status: 400 });
    }

    const accessErr = validateMutationPropertyAccess(req, propertyId);
    if (accessErr) return accessErr;

    const sql = getDb();

    // Calculate total
    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + Number(item.price) * Number(item.quantity),
      0
    );

    // 1. Create order (no unit_id on this table)
    const orderRows = await sql`
      INSERT INTO f_and_b_orders
        (property_id, booking_id, order_type, total_amount, is_complimentary, notes)
      VALUES
        (${propertyId}, ${bookingId || null}, ${orderType || "room_service"}, ${totalAmount}, ${isComplimentary || false}, ${notes || null})
      RETURNING *
    `;
    const order = (orderRows as any[])[0];

    // 2. Insert line items (item_name is NOT NULL, line_total is generated — do NOT insert it)
    for (const item of items) {
      await sql`
        INSERT INTO f_and_b_order_items
          (order_id, menu_item_id, item_name, quantity, unit_price)
        VALUES
          (${order.id}, ${item.id || null}, ${item.item_name || item.name || "Item"}, ${item.quantity}, ${item.price})
      `;
    }

    // 3. Auto-post to folio if linked to a booking and not complimentary
    if (!isComplimentary && bookingId) {
      const invoiceRows = await sql`
        SELECT id FROM invoices WHERE booking_id = ${bookingId} AND status = 'draft' LIMIT 1
      `;
      let invoice = (invoiceRows as any[])[0];

      if (!invoice) {
        const invNum = "INV-FNB-" + Date.now();
        const invRows = await sql`
          INSERT INTO invoices
            (property_id, booking_id, guest_id, invoice_number, due_date, subtotal, tax_total, grand_total, paid_total, status)
          SELECT
            ${propertyId}, ${bookingId}, guest_id, ${invNum},
            CURRENT_DATE + INTERVAL '1 day',
            0, 0, 0, 0, 'draft'
          FROM bookings WHERE id = ${bookingId}
          RETURNING id
        `;
        invoice = (invRows as any[])[0];
      }

      if (invoice) {
        // Add line (invoice_lines: invoice_id, description, quantity, unit_price, tax_rate)
        await sql`
          INSERT INTO invoice_lines (invoice_id, description, quantity, unit_price, tax_rate)
          VALUES (${invoice.id}, ${"F&B – " + (orderType || "Room Service")}, 1, ${totalAmount}, 0)
        `;

        // Update invoice totals (subtotal + grand_total; balance_due is a generated column)
        await sql`
          UPDATE invoices
          SET
            subtotal    = subtotal    + ${totalAmount},
            grand_total = grand_total + ${totalAmount}
          WHERE id = ${invoice.id}
        `;
      }

      // Also increment bookings.total_amount directly
      await sql`
        UPDATE bookings
        SET total_amount = COALESCE(total_amount, 0) + ${totalAmount}
        WHERE id = ${bookingId}
      `;
    }

    return NextResponse.json({ data: order }, { status: 201 });
  } catch (error: any) {
    console.error("[orders POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to create order" }, { status: 500 });
  }
}
