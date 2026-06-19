import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase/db";

export async function GET(req: NextRequest) {
  try {
    const supabase = await db();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const deptId = searchParams.get("department_id");

    let query = supabase
      .from("employees")
      .select(`*, department:departments(id, name), user:users(id, first_name, last_name, email, avatar_url)`)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (deptId) query = query.eq("department_id", deptId);

    const { data, error } = await query;
    if (error) throw error;

    // Filter by name/code client-side if search provided
    const filtered = search
      ? (data || []).filter(e =>
          e.employee_code?.toLowerCase().includes(search.toLowerCase()) ||
          e.user?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
          e.designation?.toLowerCase().includes(search.toLowerCase())
        )
      : data;

    return NextResponse.json({ data: filtered });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}
