import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getRequestAuth } from "@/lib/features/api";

interface RequestAccessBody {
  flag?: string;
}

export async function POST(req: NextRequest) {
  const auth = getRequestAuth(req);
  if (!auth.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RequestAccessBody;
  try {
    body = (await req.json()) as RequestAccessBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const flag = body.flag;
  if (!flag) {
    return NextResponse.json({ error: "Flag is required" }, { status: 400 });
  }

  try {
    const db = getDb();
    const rows = (await db.query(
      `SELECT id FROM feature_flags WHERE flag_key = $1 LIMIT 1`,
      [flag]
    )) as unknown as { id: string }[];

    if (rows.length === 0) {
      return NextResponse.json(
        { error: `Feature flag '${flag}' not found` },
        { status: 404 }
      );
    }

    const existing = (await db.query(
      `SELECT id FROM feature_flag_overrides
       WHERE feature_flag_id = $1 AND scope = 'user' AND user_id = $2
       LIMIT 1`,
      [rows[0].id, auth.userId]
    )) as unknown as { id: string }[];

    if (existing.length > 0) {
      await db.query(
        `UPDATE feature_flag_overrides
         SET is_enabled = TRUE, requested_by = $2, approval_status = 'pending',
             approved_by = NULL, approved_at = NULL, updated_at = now(),
             reason = 'User requested access'
         WHERE id = $1`,
        [existing[0].id, auth.userId]
      );
    } else {
      await db.query(
        `INSERT INTO feature_flag_overrides
         (feature_flag_id, scope, user_id, is_enabled, reason, requested_by, approval_status)
         VALUES ($1, 'user', $2, TRUE, 'User requested access', $2, 'pending')`,
        [rows[0].id, auth.userId]
      );
    }

    return NextResponse.json({
      success: true,
      message: "Access request submitted for approval",
    });
  } catch (error) {
    console.error("[features/request-access POST]", error);
    const message =
      error instanceof Error ? error.message : "Failed to submit access request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
