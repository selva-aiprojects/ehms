import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await req.json();
    const { item_name, price, category, is_available, is_veg, prep_time_mins, description, photo_url } = body;
    const sql = getDb();

    const rows = await sql`
      UPDATE f_and_b_menu SET
        item_name = COALESCE(${item_name || null}, item_name),
        price = COALESCE(${price ?? null}, price),
        category = COALESCE(${category || null}, category),
        is_available = COALESCE(${is_available ?? null}, is_available),
        is_veg = COALESCE(${is_veg ?? null}, is_veg),
        prep_time_mins = COALESCE(${prep_time_mins ?? null}, prep_time_mins),
        description = COALESCE(${description || null}, description),
        photo_url = COALESCE(${photo_url || null}, photo_url)
      WHERE id = ${id}
      RETURNING *
    `;
    if ((rows as any[]).length === 0) return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    return NextResponse.json({ data: (rows as any[])[0] });
  } catch (error: any) {
    console.error("[menu PUT]", error);
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const sql = getDb();

    const rows = await sql`
      UPDATE f_and_b_menu SET is_available = false WHERE id = ${id} RETURNING *
    `;
    if ((rows as any[]).length === 0) return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    return NextResponse.json({ data: (rows as any[])[0] });
  } catch (error: any) {
    console.error("[menu DELETE]", error);
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
