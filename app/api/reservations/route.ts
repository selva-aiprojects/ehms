import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase/db";

export async function GET(req: NextRequest) {
  try {
    const supabase = await db();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const propertyId = searchParams.get("property_id");
    const date = searchParams.get("date"); // filter by check_in date
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    let query = supabase
      .from("bookings")
      .select(`
        *,
        guest:guest_profiles(id, first_name, last_name, email, phone),
        unit:units(id, unit_label, unit_type, status),
        property:properties(id, name, vertical_type)
      `, { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status) query = query.eq("status", status);
    if (propertyId) query = query.eq("property_id", propertyId);
    if (date) query = query.gte("check_in", date).lt("check_in", date + "T23:59:59");

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data, count, page, limit });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch reservations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await db();
    const body = await req.json();

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        property_id: body.property_id,
        unit_id: body.unit_id,
        guest_id: body.guest_id,
        booking_model: body.booking_model || "nightly",
        status: "confirmed",
        source: body.source || "direct",
        check_in: body.check_in,
        check_out: body.check_out,
        adults: body.adults || 1,
        children: body.children || 0,
        total_amount: body.total_amount,
        special_requests: body.special_requests,
      })
      .select()
      .single();

    if (error) throw error;

    // Mark unit as reserved
    if (body.unit_id) {
      await supabase.from("units").update({ status: "reserved" }).eq("id", body.unit_id);
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create reservation" }, { status: 500 });
  }
}
