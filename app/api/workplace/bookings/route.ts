import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase/db";

export async function GET(req: NextRequest) {
  try {
    const supabase = await db();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const bookingType = searchParams.get("booking_type");
    const date = searchParams.get("date");

    let query = supabase
      .from("workplace_bookings")
      .select(`*,
        member:member_id(id, first_name, last_name, email),
        unit:unit_id(id, unit_label, unit_type)
      `)
      .order("start_time", { ascending: true });

    if (status) query = query.eq("status", status);
    if (bookingType) query = query.eq("booking_type", bookingType);
    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      query = query.gte("start_time", dayStart.toISOString()).lte("start_time", dayEnd.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}
