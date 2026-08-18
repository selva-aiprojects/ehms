import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sql = getDb();
    const body = await req.json();

    const result = await sql`
      UPDATE visitor_logs SET check_out = COALESCE(${body.check_out || null}, NOW())
      WHERE id = ${id} AND check_out IS NULL
      RETURNING *
    ` as any[];

    if (result.length === 0) {
      return NextResponse.json({ error: "Visitor not found or already checked out" }, { status: 404 });
    }

    return NextResponse.json({ data: result[0] });
  } catch (error: any) {
    console.error("[visitors PUT]", error);
    return NextResponse.json({ error: error?.message || "Failed to update visitor" }, { status: 500 });
  }
}
