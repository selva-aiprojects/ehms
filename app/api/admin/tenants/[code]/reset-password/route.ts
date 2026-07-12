import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDb, getPublicDb } from "@/lib/db";
import { verifyToken, hashPassword } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    const payload = token ? verifyToken(token) : null;

    if (!payload?.is_platform_admin) {
      return NextResponse.json({ error: "Only platform superadmins can reset tenant passwords" }, { status: 403 });
    }

    const { code } = await params;
    const body = await req.json();
    const { admin_email } = body;

    const publicDb = getPublicDb();

    const existing = (await publicDb.query(
      "SELECT id, name, schema_name, config, contact_email FROM public.tenants WHERE code = $1 LIMIT 1",
      [code]
    )) as Record<string, unknown>[];
    const tenantRow = existing[0];
    if (!tenantRow) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const schema = tenantRow.schema_name as string;
    const tenantName = tenantRow.name as string;
    const config = (tenantRow.config as Record<string, unknown>) || {};
    const workspaces = config.workspaces as { type: string; name: string; is_primary?: boolean }[] | undefined;
    const contactEmail = admin_email || (config.contact_email as string) || (tenantRow.contact_email as string);

    if (!contactEmail) {
      return NextResponse.json({ error: "No contact email found for this tenant. Provide admin_email in request." }, { status: 400 });
    }

    const tenantDb = getDb(schema);

    const users = (await tenantDb.query(
      "SELECT id, email, first_name, last_name FROM users WHERE email = $1 LIMIT 1",
      [contactEmail]
    )) as { id: string; email: string; first_name: string | null; last_name: string | null }[];

    if (!users || users.length === 0) {
      return NextResponse.json({ error: `No user found with email ${contactEmail} in tenant schema` }, { status: 404 });
    }

    const targetUser = users[0];
    const newPassword = crypto.randomBytes(4).toString("hex") + "@A1";
    const passwordHash = await hashPassword(newPassword);

    await tenantDb.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2::uuid",
      [passwordHash, targetUser.id]
    );

    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login?tenant=${code}`;
    const adminName = targetUser.first_name || targetUser.email;

    await sendWelcomeEmail(
      targetUser.email,
      tenantName,
      adminName,
      targetUser.email,
      newPassword,
      loginUrl,
      workspaces
    );

    return NextResponse.json({
      success: true,
      message: `Password reset successful. New credentials sent to ${targetUser.email}.`,
      email_sent: true,
      admin_email: targetUser.email,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Password reset failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
