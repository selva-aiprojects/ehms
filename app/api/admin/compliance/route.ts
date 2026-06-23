import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const { property_id, certificate_type, reference_number, issued_date, expiry_date, status, document_url } = body;

    if (!property_id || !certificate_type || !expiry_date) {
      return NextResponse.json({ error: "Property, certificate type, and expiry date are required" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO compliance_records (property_id, certificate_type, reference_number, issued_date, expiry_date, status, document_url)
      VALUES (${property_id}, ${certificate_type}, ${reference_number || null}, ${issued_date || null}, ${expiry_date}, ${status || 'active'}, ${document_url || null})
      RETURNING *
    ` as any[];

    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (error: any) {
    console.error("[admin/compliance POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to create compliance record" }, { status: 500 });
  }
}
