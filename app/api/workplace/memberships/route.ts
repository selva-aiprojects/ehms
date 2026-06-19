import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase/db";

export async function GET(req: NextRequest) {
  try {
    const supabase = await db();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "active";
    const propertyId = searchParams.get("property_id");

    let query = supabase
      .from("corporate_memberships")
      .select(`*,
        corporate:corporate_accounts(id, name, tax_id),
        plan:membership_plans(id, name, plan_type, price, billing_cycle)
      `)
      .order("created_at", { ascending: false });

    if (status !== "all") query = query.eq("status", status);
    if (propertyId) query = query.eq("plan.property_id", propertyId);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch memberships" }, { status: 500 });
  }
}
