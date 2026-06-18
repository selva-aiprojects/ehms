import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase/db";

export async function GET(req: NextRequest) {
  try {
    const supabase = await db();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const status = searchParams.get("status");

    let query = supabase
      .from("housekeeping_tasks")
      .select(`*, unit:units(id, unit_label, unit_type, status), assignee:users!housekeeping_tasks_assigned_to_fkey(id, first_name, last_name)`)
      .order("scheduled_at", { ascending: true });

    if (propertyId) query = query.eq("property_id", propertyId);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await db();
    const body = await req.json();
    const { data, error } = await supabase
      .from("housekeeping_tasks")
      .insert({
        unit_id: body.unit_id,
        property_id: body.property_id,
        assigned_to: body.assigned_to,
        task_type: body.task_type,
        priority: body.priority || "medium",
        status: "open",
        scheduled_at: body.scheduled_at,
        notes: body.notes,
      })
      .select()
      .single();
    if (error) throw error;
    // Mark unit as cleaning
    await supabase.from("units").update({ status: "cleaning" }).eq("id", body.unit_id);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
