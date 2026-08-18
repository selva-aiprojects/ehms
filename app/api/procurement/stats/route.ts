import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");

    let filter = sql`WHERE 1=1`;
    if (propertyId) filter = sql`${filter} AND po.property_id = ${propertyId}`;

    const totals = await sql`
      SELECT
        COUNT(*)::int AS total_pos,
        COUNT(*) FILTER (WHERE po.status = 'draft')::int AS draft_count,
        COUNT(*) FILTER (WHERE po.status = 'sent')::int AS sent_count,
        COUNT(*) FILTER (WHERE po.status = 'approved')::int AS approved_count,
        COUNT(*) FILTER (WHERE po.status = 'received')::int AS received_count,
        COUNT(*) FILTER (WHERE po.status = 'closed')::int AS closed_count,
        COALESCE(SUM(po.total_amount) FILTER (WHERE po.status NOT IN ('draft', 'closed')), 0)::numeric(12,2) AS total_pending_amount,
        COALESCE(SUM(po.total_amount), 0)::numeric(12,2) AS total_amount
      FROM purchase_orders po
      ${filter}
    `;

    const recentPos = await sql`
      SELECT po.id, po.po_number, po.po_date, po.status, po.total_amount,
             v.company_name as vendor_name
      FROM purchase_orders po
      LEFT JOIN vendors v ON v.id = po.vendor_id
      ${filter}
      ORDER BY po.created_at DESC
      LIMIT 10
    `;

    const vendorStats = await sql`
      SELECT COUNT(*)::int AS total_vendors,
             COUNT(*) FILTER (WHERE v.status = 'approved')::int AS active_vendors
      FROM vendors v
      ${propertyId ? sql`WHERE v.property_id = ${propertyId}` : sql``}
    `;

    const grnCount = await sql`
      SELECT COUNT(*)::int AS total_grns
      FROM goods_received_notes grn
      ${propertyId ? sql`LEFT JOIN purchase_orders po ON po.id = grn.po_id WHERE po.property_id = ${propertyId}` : sql``}
    `;

    return NextResponse.json({
      data: {
        ...totals[0],
        recent_pos: recentPos,
        ...vendorStats[0],
        ...grnCount[0],
      },
    });
  } catch (error: any) {
    console.error("[procurement/stats GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch procurement stats" }, { status: 500 });
  }
}
