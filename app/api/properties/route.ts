import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase/db";

export async function GET(req: NextRequest) {
  try {
    const supabase = await db();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const verticalType = searchParams.get("vertical_type");

    let query = supabase
      .from("properties")
      .select(`
        *,
        units:units(id, status)
      `)
      .eq("is_active", true);

    if (propertyId) query = query.eq("id", propertyId);
    if (verticalType) query = query.eq("vertical_type", verticalType);

    const { data, error } = await query;
    if (error) throw error;

    // Compute occupancy per property
    const withOccupancy = (data || []).map(p => {
      const units = (p.units || []) as { status: string }[];
      const total = units.length;
      const occupied = units.filter(u => u.status === "occupied").length;
      return { ...p, total_units: total, occupied_units: occupied, occupancy_pct: total > 0 ? Math.round((occupied / total) * 100) : 0 };
    });

    return NextResponse.json({ data: withOccupancy });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch properties" }, { status: 500 });
  }
}
