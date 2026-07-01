import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("ehms_token")?.value;

  if (!token) {
    return NextResponse.json({ user: null });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ user: null });
  }

  const user: Record<string, unknown> = {
    id: payload.user_id,
    email: payload.email,
    first_name: payload.first_name,
    last_name: payload.last_name,
    avatar_url: payload.avatar_url,
    role_name: payload.role_name,
    is_platform_admin: payload.is_platform_admin || false,
  };

  if (payload.is_platform_admin) {
    // Platform admin — no tenant context
    return NextResponse.json({ user });
  }

  // Shard user — include tenant context
  user.tenant_code = payload.tenant_code;
  user.tenant_schema = payload.tenant_schema;
  user.tenant_name = payload.tenant_name;
  user.tenant_verticals = payload.tenant_verticals;

  try {
    const { getDb } = await import("@/lib/db");
    const db = getDb(payload.tenant_schema);
    const assignments = (await db.query(
      "SELECT property_id FROM user_roles WHERE user_id = $1",
      [payload.user_id]
    )) as Record<string, unknown>[];
    user.assigned_property_ids = assignments.map((r) => r.property_id).filter(Boolean);
  } catch (err) {
    console.error("Failed to fetch user property assignments:", err);
    user.assigned_property_ids = [];
  }

  return NextResponse.json({ user });
}
