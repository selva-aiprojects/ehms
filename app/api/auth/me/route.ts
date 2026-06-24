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

  return NextResponse.json({
    user: {
      id: payload.user_id,
      email: payload.email,
      first_name: payload.first_name,
      last_name: payload.last_name,
      avatar_url: payload.avatar_url,
      role_name: payload.role_name,
      role_id: payload.role_id,
      tenant_code: payload.tenant_code,
      tenant_schema: payload.tenant_schema,
    },
  });
}
