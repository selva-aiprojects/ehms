import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const propertyId = req.nextUrl.searchParams.get("property_id");
    const sql = getDb();
    
    if (propertyId) {
      const rows = await sql`
        SELECT 
          id, 
          name as title,
          code as offer_code, 
          discount_pct as discount_value, 
          'percentage' as discount_type,
          start_date as valid_from, 
          end_date as valid_until,
          is_active
        FROM promotions
        WHERE is_active = true AND property_id = ${propertyId}
        ORDER BY created_at DESC
      `;
      return NextResponse.json({ data: rows });
    }

    const rows = await sql`
      SELECT 
        id, 
        name as title,
        code as offer_code, 
        discount_pct as discount_value, 
        'percentage' as discount_type,
        start_date as valid_from, 
        end_date as valid_until,
        is_active
      FROM promotions
      WHERE is_active = true
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[offers GET]", error);
    return NextResponse.json({ error: "Failed to fetch offers" }, { status: 500 });
  }
}
