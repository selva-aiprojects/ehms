export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess } from "@/lib/property-scope";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;
    const status = searchParams.get("status");
    const vendorId = searchParams.get("vendor_id");

    let query = `
      SELECT vb.*, v.name as vendor_name, v.code as vendor_code
      FROM vendor_bills vb
      LEFT JOIN vendors v ON v.id = vb.vendor_id
      WHERE 1=1
    `;
    const params: any[] = [];
    let idx = 1;
    if (propertyId) { query += ` AND vb.property_id = $${idx++}`; params.push(propertyId); }
    else if (scope.assignedPropertyIds.length > 0) { query += ` AND vb.property_id = ANY($${idx++})`; params.push(scope.assignedPropertyIds); }
    if (status) { query += ` AND vb.status = $${idx++}`; params.push(status); }
    if (vendorId) { query += ` AND vb.vendor_id = $${idx++}`; params.push(vendorId); }
    query += " ORDER BY vb.bill_date DESC LIMIT 100";

    const rows = await sql.query(query, params);
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[finance/vendor-bills GET]", error);
    return NextResponse.json({ error: "Failed to fetch vendor bills" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const { lines, ...bill } = body;

    const bills = await sql`
      INSERT INTO vendor_bills (property_id, vendor_id, bill_number, bill_date, due_date, category, subtotal, tax_total, grand_total, status, notes, created_by)
      VALUES (${bill.property_id}, ${bill.vendor_id}, ${bill.bill_number}, ${bill.bill_date}, ${bill.due_date}, ${bill.category || null}, ${bill.subtotal || 0}, ${bill.tax_total || 0}, ${bill.grand_total || 0}, ${bill.status || 'pending'}, ${bill.notes || null}, ${bill.created_by})
      RETURNING *`;

    if (lines && lines.length > 0) {
      const billId = bills[0].id;
      for (const line of lines) {
        await sql`
          INSERT INTO bill_line_items (bill_id, description, quantity, unit_price, tax_rate, account_id, cost_center_id)
          VALUES (${billId}, ${line.description}, ${line.quantity || 1}, ${line.unit_price}, ${line.tax_rate || 0}, ${line.account_id || null}, ${line.cost_center_id || null})`;
      }
      return NextResponse.json({ data: bills[0] }, { status: 201 });
    }

    return NextResponse.json({ data: bills[0] }, { status: 201 });
  } catch (error) {
    console.error("[finance/vendor-bills POST]", error);
    return NextResponse.json({ error: "Failed to create vendor bill" }, { status: 500 });
  }
}
