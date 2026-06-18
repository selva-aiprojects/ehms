import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await db();
    const { id } = await params;
    const body = await req.json();
    const update: Record<string, unknown> = { status: body.status };
    if (body.status === "in_progress") update.started_at = new Date().toISOString();
    if (body.status === "resolved") {
      update.completed_at = new Date().toISOString();
      const { data: task } = await supabase.from("housekeeping_tasks").select("unit_id").eq("id", id).single();
      if (task?.unit_id) {
        await supabase.from("units").update({ status: "inspection" } as any).eq("id", task.unit_id);
      }
    }
    if (body.assigned_to) update.assigned_to = body.assigned_to;
    if (body.notes) update.notes = body.notes;

    const { data, error } = await supabase
      .from("housekeeping_tasks")
      .update(update as any)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
