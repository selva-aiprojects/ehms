import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    if (type === "countries") {
      const rows = await sql`
        SELECT id, name, code, phone_code, currency
        FROM countries
        WHERE is_active = true
        ORDER BY name
      `;
      return NextResponse.json({ data: rows });
    }

    if (type === "states") {
      const countryId = searchParams.get("country_id");
      if (!countryId) {
        return NextResponse.json({ error: "country_id is required" }, { status: 400 });
      }
      const rows = await sql`
        SELECT s.id, s.name, s.code, s.tax_region, c.name AS country_name
        FROM states s
        JOIN countries c ON c.id = s.country_id
        WHERE s.is_active = true AND s.country_id = ${countryId}
        ORDER BY s.name
      `;
      return NextResponse.json({ data: rows });
    }

    if (type === "cities") {
      const stateId = searchParams.get("state_id");
      if (!stateId) {
        return NextResponse.json({ error: "state_id is required" }, { status: 400 });
      }
      const rows = await sql`
        SELECT ct.id, ct.name, s.name AS state_name, c.name AS country_name
        FROM cities ct
        JOIN states s ON s.id = ct.state_id
        JOIN countries c ON c.id = s.country_id
        WHERE ct.is_active = true AND ct.state_id = ${stateId}
        ORDER BY ct.name
      `;
      return NextResponse.json({ data: rows });
    }

    return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
  } catch (error) {
    console.error("[masters/locations GET]", error);
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 });
  }
}
