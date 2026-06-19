import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase/db";

export async function GET(req: NextRequest) {
  try {
    const supabase = await db();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("visitor_logs")
      .select(`*,
        host:host_employee_id(id, first_name, last_name, email)
      `)
      .order("check_in", { ascending: false })
      .limit(limit);

    if (propertyId) query = query.eq("property_id", propertyId);
    if (status === "checked_in") query = query.is("check_out", null);
    if (status === "checked_out") query = query.not("check_out", "is", null);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch visitors" }, { status: 500 });
  }
}
