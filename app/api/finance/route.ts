export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [invoiceRows, paymentRows, recentRows] = await Promise.all([
      sql`
        SELECT * FROM invoices
        WHERE ${propertyId ? sql`property_id = ${propertyId}` : sql`status = 'paid'`}
        ORDER BY created_at DESC
        LIMIT 50
      `,
      sql`
        SELECT amount, payment_date, payment_method
        FROM payments
        WHERE status = 'completed'
          AND payment_date >= ${startOfMonth.toISOString()}
      `,
      sql`
        SELECT p.*, i.invoice_number
        FROM payments p
        LEFT JOIN invoices i ON i.id = p.invoice_id
        WHERE p.status = 'completed'
        ORDER BY p.payment_date DESC
        LIMIT 10
      `,
    ]);

    const mtdRevenue = (paymentRows as { amount: string }[]).reduce((s, p) => s + Number(p.amount), 0);
    const byMethod: Record<string, number> = {};
    (paymentRows as { payment_method: string; amount: string }[]).forEach(p => {
      byMethod[p.payment_method] = (byMethod[p.payment_method] || 0) + Number(p.amount);
    });

    return NextResponse.json({ invoices: invoiceRows, mtdRevenue, byMethod, recentPayments: recentRows });
  } catch (error) {
    console.error("[finance GET]", error);
    return NextResponse.json({ error: "Failed to fetch finance data" }, { status: 500 });
  }
}
