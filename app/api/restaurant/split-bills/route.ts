import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess, validateMutationPropertyAccess } from "@/lib/property-scope";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const sql = getDb();
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;

    const orderId = req.nextUrl.searchParams.get("order_id");

    const rows = await sql`
      SELECT
        sb.id, sb.property_id, sb.order_id, sb.split_type,
        sb.total_amount, sb.guest_count, sb.status, sb.created_at,
        (
          SELECT COALESCE(
            json_agg(
              json_build_object(
                'id', sbi.id,
                'label', sbi.label,
                'amount', sbi.amount,
                'percentage', sbi.percentage,
                'is_paid', sbi.is_paid,
                'paid_at', sbi.paid_at,
                'payment_method', sbi.payment_method,
                'order_item_id', sbi.order_item_id
              )
            ),
            '[]'::json
          )
          FROM split_bill_items sbi
          WHERE sbi.split_bill_id = sb.id
        ) AS items
      FROM split_bills sb
      WHERE 1=1
      ${scope.assignedPropertyIds.length > 0 ? sql`AND sb.property_id = ANY(${scope.assignedPropertyIds})` : sql``}
      ${orderId ? sql`AND sb.order_id = ${orderId}` : sql``}
      ORDER BY sb.created_at DESC
    `;
    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[split-bills GET]", error);
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const { property_id, order_id, split_type, guest_count, custom_amounts } = body;
    if (!property_id || !order_id) {
      return NextResponse.json({ error: "property_id and order_id required" }, { status: 400 });
    }
    const accessErr = validateMutationPropertyAccess(req, property_id);
    if (accessErr) return accessErr;
    const sql = getDb();

    const orderRows = await sql`SELECT total_amount FROM f_and_b_orders WHERE id = ${order_id}` as any[];
    if (orderRows.length === 0) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    const totalAmount = Number(orderRows[0].total_amount);
    const guests = guest_count || 2;
    const type = split_type || "equal";

    const billRows = await sql`
      INSERT INTO split_bills (property_id, order_id, split_type, total_amount, guest_count)
      VALUES (${property_id}, ${order_id}, ${type}, ${totalAmount}, ${guests})
      RETURNING *
    `;
    const bill = (billRows as any[])[0];

    const itemRows = await sql`SELECT id, item_name, unit_price FROM f_and_b_order_items WHERE order_id = ${order_id}` as any[];

    if (type === "equal") {
      const perGuest = Math.round((totalAmount / guests) * 100) / 100;
      for (let i = 0; i < guests; i++) {
        await sql`
          INSERT INTO split_bill_items (split_bill_id, label, amount)
          VALUES (${bill.id}, ${`Guest ${i + 1}`}, ${i === guests - 1 ? totalAmount - perGuest * (guests - 1) : perGuest})
        `;
      }
    } else if (type === "custom" && Array.isArray(custom_amounts)) {
      for (let i = 0; i < custom_amounts.length; i++) {
        const amt = Number(custom_amounts[i]);
        const pct = Math.round((amt / totalAmount) * 10000) / 100;
        await sql`
          INSERT INTO split_bill_items (split_bill_id, label, amount, percentage)
          VALUES (${bill.id}, ${`Guest ${i + 1}`}, ${amt}, ${pct})
        `;
      }
    } else if (type === "by_item") {
      for (const item of itemRows) {
        await sql`
          INSERT INTO split_bill_items (split_bill_id, order_item_id, label, amount)
          VALUES (${bill.id}, ${item.id}, ${item.item_name || "Guest 1"}, ${item.unit_price})
        `;
      }
    } else {
      const perGuest = Math.round((totalAmount / guests) * 100) / 100;
      for (let i = 0; i < guests; i++) {
        await sql`
          INSERT INTO split_bill_items (split_bill_id, label, amount)
          VALUES (${bill.id}, ${`Guest ${i + 1}`}, ${i === guests - 1 ? totalAmount - perGuest * (guests - 1) : perGuest})
        `;
      }
    }

    return NextResponse.json({ data: bill }, { status: 201 });
  } catch (error: any) {
    console.error("[split-bills POST]", error);
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
