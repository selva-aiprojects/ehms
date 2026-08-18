import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sql = getDb();
    
    // Group menu items by category
    const rows = await sql`
      SELECT id, category, item_name, description, price, currency, is_available
      FROM f_and_b_menu
      WHERE is_available = true
      ORDER BY category, item_name
    `;

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[menu GET]", error);
    return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 });
  }
}
