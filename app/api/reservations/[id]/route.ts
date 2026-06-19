import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await db();
    const { id } = await params;
    const { data, error } = await supabase
      .from("bookings")
      .select(`*, guest:guest_profiles(*), unit:units(*), property:properties(*)`)
      .eq("id", id)
      .single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await db();
    const { id } = await params;
    const body = await req.json();

    const updatePayload: Record<string, unknown> = {};
    if (body.status) updatePayload.status = body.status;
    if (body.status === "checked_in") updatePayload.checked_in_at = new Date().toISOString();
    if (body.status === "checked_out") updatePayload.checked_out_at = new Date().toISOString();
    if (body.special_requests !== undefined) updatePayload.special_requests = body.special_requests;
    if (body.paid_amount !== undefined) updatePayload.paid_amount = body.paid_amount;

    const { data, error } = await supabase
      .from("bookings")
      .update(updatePayload as any)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    // Sync unit status
    if (data?.unit_id) {
      const unitStatus =
        body.status === "checked_in" ? "occupied" :
        body.status === "checked_out" ? "dirty" :
        body.status === "cancelled" ? "vacant" : null;
      if (unitStatus) {
        await supabase.from("units").update({ status: unitStatus } as any).eq("id", data.unit_id);
      }
    }
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await db();
    const { id } = await params;
    const { data: booking } = await supabase.from("bookings").select("unit_id").eq("id", id).single();
    const { error } = await supabase.from("bookings").update({ status: "cancelled" } as any).eq("id", id);
    if (error) throw error;
    if (booking?.unit_id) {
      await supabase.from("units").update({ status: "vacant" } as any).eq("id", booking.unit_id);
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
