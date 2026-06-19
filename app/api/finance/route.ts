import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase/db";

export async function GET(req: NextRequest) {
  try {
    const supabase = await db();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");

    const startOfMonth = new Date();
    startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

    const [
      { data: invoices },
      { data: payments },
      { data: recentPayments },
    ] = await Promise.all([
      supabase.from("invoices").select("*").eq(propertyId ? "property_id" : "status", propertyId || "paid").order("created_at", { ascending: false }).limit(50),
      supabase.from("payments").select("amount, payment_date, payment_method").eq("status", "completed").gte("payment_date", startOfMonth.toISOString()),
      supabase.from("payments").select("*, invoice:invoices(invoice_number)").eq("status", "completed").order("payment_date", { ascending: false }).limit(10),
    ]);

    const mtdRevenue = (payments || []).reduce((s, p) => s + (p.amount || 0), 0);
    const byMethod: Record<string, number> = {};
    (payments || []).forEach(p => { byMethod[p.payment_method] = (byMethod[p.payment_method] || 0) + p.amount; });

    return NextResponse.json({ invoices, mtdRevenue, byMethod, recentPayments });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch finance data" }, { status: 500 });
  }
}
