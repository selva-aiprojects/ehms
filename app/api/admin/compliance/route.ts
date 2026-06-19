import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase/db";

export async function GET(req: NextRequest) {
  try {
    const supabase = await db();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const status = searchParams.get("status");

    let query = supabase
      .from("compliance_records")
      .select(`*, property:properties(id, name)`)
      .order("expiry_date", { ascending: true });

    if (propertyId) query = query.eq("property_id", propertyId);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch compliance records" }, { status: 500 });
  }
}
