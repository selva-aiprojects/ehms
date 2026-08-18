import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("vendor_id");

    let query = sql`SELECT * FROM vendor_services WHERE 1=1`;
    if (vendorId) {
      query = sql`${query} AND vendor_id = ${vendorId}`;
    }
    query = sql`${query} ORDER BY service_type ASC`;

    const rows = await query;
    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[vendors/services GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch vendor services" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    if (!body.vendor_id || !body.service_type) {
      return NextResponse.json({ error: "vendor_id and service_type are required" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO vendor_services (vendor_id, service_type, description, rate, rate_unit)
      VALUES (${body.vendor_id}, ${body.service_type}, ${body.description || null}, ${body.rate || null}, ${body.rate_unit || null})
      RETURNING *
    ` as any[];

    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (error: any) {
    console.error("[vendors/services POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to create vendor service" }, { status: 500 });
  }
}
