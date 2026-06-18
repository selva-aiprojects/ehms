import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase/db";

export async function GET(req: NextRequest) {
  try {
    const supabase = await db();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("lease_agreements")
      .select(`*, unit:units(id, unit_label), property:properties(id, name), tenant:guest_profiles(id, first_name, last_name, email, phone)`)
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (searchParams.get("renewal_due")) {
      query = query.in("status", ["active", "renewal_due"]);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch leases" }, { status: 500 });
  }
}
