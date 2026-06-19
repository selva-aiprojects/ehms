import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase/db";

export async function GET(req: NextRequest) {
  try {
    const supabase = await db();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    let query = supabase
      .from("users")
      .select(`*, user_roles(role:roles(id, name, description))`)
      .order("created_at", { ascending: false });

    if (status === "active") query = query.eq("is_active", true);
    if (status === "inactive") query = query.eq("is_active", false);

    const { data, error } = await query;
    if (error) throw error;

    let filtered = data || [];
    if (role) {
      filtered = filtered.filter((u: any) =>
        u.user_roles?.some((ur: any) => ur.role?.name === role)
      );
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((u: any) =>
        u.first_name?.toLowerCase().includes(q) ||
        u.last_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ data: filtered });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
