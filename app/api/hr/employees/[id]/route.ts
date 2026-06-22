import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb();
    const { id } = await params;
    const body = await req.json();

    const rows = await sql`
      UPDATE employees SET
        department_id        = COALESCE(${body.department_id}, department_id),
        designation          = COALESCE(${body.designation}, designation),
        employment_type      = COALESCE(${body.employment_type}, employment_type),
        doj                  = COALESCE(${body.doj}::date, doj),
        base_salary          = COALESCE(${body.base_salary}::numeric, base_salary),
        bank_account         = COALESCE(${body.bank_account}, bank_account),
        bank_ifsc            = COALESCE(${body.bank_ifsc}, bank_ifsc),
        pan_number           = COALESCE(${body.pan_number}, pan_number),
        uan_number           = COALESCE(${body.uan_number}, uan_number),
        esi_number           = COALESCE(${body.esi_number}, esi_number),
        reporting_manager_id = COALESCE(${body.reporting_manager_id}, reporting_manager_id),
        shift_id             = COALESCE(${body.shift_id}, shift_id),
        band_id              = COALESCE(${body.band_id}, band_id)
      WHERE id = ${id}
      RETURNING *
    `;

    if (!rows[0]) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    return NextResponse.json({ data: rows[0] });
  } catch (error) {
    console.error("[hr/employees PUT]", error);
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb();
    const { id } = await params;

    const rows = await sql`
      UPDATE employees SET is_active = false WHERE id = ${id} RETURNING id
    `;

    if (!rows[0]) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[hr/employees DELETE]", error);
    return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 });
  }
}
