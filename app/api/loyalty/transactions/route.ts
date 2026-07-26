export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess } from "@/lib/property-scope";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const guestId = searchParams.get("guest_id");
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;

    if (!guestId) {
      return NextResponse.json({ data: [] });
    }

    const rows = await sql`
      SELECT lt.*, g.first_name || ' ' || g.last_name AS guest_name
      FROM loyalty_transactions lt
      JOIN guest_profiles g ON g.id = lt.guest_id
      WHERE lt.guest_id = ${guestId}
      ORDER BY lt.created_at DESC
      LIMIT 100
    `;
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[loyalty/transactions GET]", error);
    return NextResponse.json({ error: "Failed to fetch loyalty transactions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    if (!body.guest_id || !body.points || !body.type) {
      return NextResponse.json({ error: "guest_id, points, and type are required" }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO loyalty_transactions (guest_id, booking_id, points, type, description)
      VALUES (${body.guest_id}, ${body.booking_id || null}, ${body.points}, ${body.type}, ${body.description || null})
      RETURNING *
    `;

    // Update guest_profiles loyalty_points
    const delta = body.type === "earned" || body.type === "bonus" ? body.points : -body.points;
    await sql`
      UPDATE guest_profiles
      SET loyalty_points = GREATEST(0, COALESCE(loyalty_points, 0) + ${delta})
      WHERE id = ${body.guest_id}
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create loyalty transaction";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
