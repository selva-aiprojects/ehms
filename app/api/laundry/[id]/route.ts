export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sql = getDb();
    const { id } = await params;
    const body = await req.json();

    const rows = await sql`
      UPDATE laundry_orders SET
        status = COALESCE(${body.status}, status),
        vendor_id = COALESCE(${body.vendor_id}, vendor_id),
        special_instructions = COALESCE(${body.special_instructions}, special_instructions),
        estimated_delivery = COALESCE(${body.estimated_delivery}::timestamptz, estimated_delivery),
        actual_delivery = COALESCE(${body.actual_delivery}::timestamptz, actual_delivery),
        updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Laundry order not found" }, { status: 404 });
    }

    return NextResponse.json({ data: rows[0] });
  } catch (error) {
    console.error("[laundry PUT]", error);
    return NextResponse.json({ error: "Failed to update laundry order" }, { status: 500 });
  }
}
