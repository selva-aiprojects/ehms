import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase/db";

export async function GET(req: NextRequest) {
  try {
    const supabase = await db();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    let query = supabase
      .from("maintenance_tickets")
      .select(`*, unit:units(id, unit_label), reporter:users!maintenance_tickets_reported_by_fkey(id, first_name, last_name), assignee:users!maintenance_tickets_assigned_to_fkey(id, first_name, last_name)`)
      .order("created_at", { ascending: false });

    if (propertyId) query = query.eq("property_id", propertyId);
    if (status) query = query.eq("status", status);
    if (priority) query = query.eq("priority", priority);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await db();
    const body = await req.json();
    const { data, error } = await supabase
      .from("maintenance_tickets")
      .insert({
        property_id: body.property_id,
        unit_id: body.unit_id,
        title: body.title,
        description: body.description,
        priority: body.priority || "medium",
        category: body.category,
        reported_by: body.reported_by,
        status: "open",
      })
      .select()
      .single();
    if (error) throw error;
    // Set unit to maintenance if ticket is for a unit
    if (body.unit_id) await supabase.from("units").update({ status: "maintenance" }).eq("id", body.unit_id);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
