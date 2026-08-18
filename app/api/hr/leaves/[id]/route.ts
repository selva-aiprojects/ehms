import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb();
    const { id } = await params;
    const body = await req.json();
    const currentYear = new Date().getFullYear();

    const existing = await sql`SELECT employee_id, leave_type_id, total_days, status FROM leave_requests WHERE id = ${id}`;
    if (!existing[0]) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    const leave = existing[0] as { employee_id: string; leave_type_id: string; total_days: number; status: string };
    const newStatus = body.status || leave.status;

    if (newStatus === "approved" && leave.status === "pending") {
      await sql`
        UPDATE leave_balances
        SET used = used + ${leave.total_days}, pending = pending - ${leave.total_days}
        WHERE employee_id = ${leave.employee_id}
          AND leave_type_id = ${leave.leave_type_id}
          AND period_year = ${currentYear}
      `;
    } else if (newStatus === "rejected" && leave.status === "pending") {
      await sql`
        UPDATE leave_balances
        SET pending = pending - ${leave.total_days}
        WHERE employee_id = ${leave.employee_id}
          AND leave_type_id = ${leave.leave_type_id}
          AND period_year = ${currentYear}
      `;
    }

    const rows = await sql`
      UPDATE leave_requests SET
        status          = ${newStatus},
        approved_by     = COALESCE(${body.approved_by}, approved_by),
        approved_at     = CASE WHEN ${newStatus} IN ('approved','rejected') THEN COALESCE(${body.approved_at}::timestamptz, NOW()) ELSE approved_at END,
        reviewer_notes  = COALESCE(${body.reviewer_notes}, reviewer_notes)
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] });
  } catch (error) {
    console.error("[hr/leaves PUT]", error);
    return NextResponse.json({ error: "Failed to update leave request" }, { status: 500 });
  }
}
