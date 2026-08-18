import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validateMutationPropertyAccess } from "@/lib/property-scope";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb();
    const { id } = await params;
    const body = await req.json();

    const ts = await sql`
      SELECT e.property_id FROM timesheets t
      LEFT JOIN employees e ON e.id = t.employee_id
      WHERE t.id = ${id} LIMIT 1
    `;
    if (!ts[0]) return NextResponse.json({ error: "Timesheet not found" }, { status: 404 });

    if (ts[0].property_id) {
      const accessErr = validateMutationPropertyAccess(req, ts[0].property_id as string);
      if (accessErr) return accessErr;
    }

    const approvedBy = body.status === "approved" ? body.approved_by : null;
    const approvedAt = body.status === "approved" ? new Date().toISOString() : null;

    const rows = await sql`
      UPDATE timesheets SET
        date         = COALESCE(${body.date ? new Date(body.date).toISOString().split("T")[0] : null}::date, date),
        clock_in     = COALESCE(${body.clock_in ? new Date(body.clock_in).toISOString() : null}::timestamptz, clock_in),
        clock_out    = COALESCE(${body.clock_out ? new Date(body.clock_out).toISOString() : null}::timestamptz, clock_out),
        total_hours  = COALESCE(${body.total_hours}::numeric, total_hours),
        break_hours  = COALESCE(${body.break_hours}::numeric, break_hours),
        project      = COALESCE(${body.project}, project),
        task         = COALESCE(${body.task}, task),
        notes        = COALESCE(${body.notes}, notes),
        status       = COALESCE(${body.status}, status),
        approved_by  = CASE WHEN ${body.status} = 'approved' THEN ${approvedBy} ELSE approved_by END,
        approved_at  = CASE WHEN ${body.status} = 'approved' THEN ${approvedAt}::timestamptz ELSE approved_at END
      WHERE id = ${id}
      RETURNING *
    `;

    if (!rows[0]) return NextResponse.json({ error: "Timesheet not found" }, { status: 404 });
    return NextResponse.json({ data: rows[0] });
  } catch (error) {
    console.error("[hr/timesheets PUT]", error);
    return NextResponse.json({ error: "Failed to update timesheet" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb();
    const { id } = await params;

    const ts = await sql`
      SELECT e.property_id FROM timesheets t
      LEFT JOIN employees e ON e.id = t.employee_id
      WHERE t.id = ${id} LIMIT 1
    `;
    if (!ts[0]) return NextResponse.json({ error: "Timesheet not found" }, { status: 404 });

    if (ts[0].property_id) {
      const accessErr = validateMutationPropertyAccess(req, ts[0].property_id as string);
      if (accessErr) return accessErr;
    }

    const rows = await sql`DELETE FROM timesheets WHERE id = ${id} RETURNING id`;
    if (!rows[0]) return NextResponse.json({ error: "Timesheet not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[hr/timesheets DELETE]", error);
    return NextResponse.json({ error: "Failed to delete timesheet" }, { status: 500 });
  }
}
