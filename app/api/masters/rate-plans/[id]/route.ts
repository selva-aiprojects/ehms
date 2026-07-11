import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validateMutationPropertyAccess } from "@/lib/property-scope";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sql = getDb();
    const rows = await sql`
      SELECT
        rp.*,
        rp.base_rate as base_price,
        COALESCE(rp.rules->>'code', 'RP-' || SUBSTRING(rp.id::text, 1, 4)) as code,
        COALESCE((rp.rules->>'is_refundable')::boolean, true) as is_refundable,
        rp.rules->>'cancellation_policy' as cancellation_policy
      FROM rate_plans rp
      WHERE rp.id = ${id}
      LIMIT 1
    `;
    if (!rows[0]) return NextResponse.json({ error: "Rate plan not found" }, { status: 404 });
    return NextResponse.json({ data: rows[0] });
  } catch (error: any) {
    console.error("[masters/rate-plans/[id] GET]", error);
    return NextResponse.json({ error: "Failed to fetch rate plan" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sql = getDb();
    const body = await req.json();
    const { name, code, base_price, base_rate, currency, is_dynamic, is_refundable, cancellation_policy, rules, effective_from, effective_to, is_active } = body;

    const existing = await sql`SELECT property_id, rules FROM rate_plans WHERE id = ${id} LIMIT 1`;
    if (!existing[0]) return NextResponse.json({ error: "Rate plan not found" }, { status: 404 });

    const accessErr = validateMutationPropertyAccess(req, (existing[0] as any).property_id);
    if (accessErr) return accessErr;

    const rateAmount = base_price || base_rate ? parseFloat(String(base_price || base_rate)) : null;
    const currentRules = (existing[0] as any).rules || {};
    const rulesObj = {
      ...currentRules,
      ...(rules || {}),
      ...(code !== undefined ? { code } : {}),
      ...(is_refundable !== undefined ? { is_refundable } : {}),
      ...(cancellation_policy !== undefined ? { cancellation_policy } : {}),
    };

    const rows = await sql`
      UPDATE rate_plans SET
        name           = COALESCE(${name ?? null}, name),
        base_rate      = COALESCE(${rateAmount}::numeric, base_rate),
        currency       = COALESCE(${currency ?? null}, currency),
        is_dynamic     = COALESCE(${is_dynamic ?? null}::boolean, is_dynamic),
        rules          = ${JSON.stringify(rulesObj)}::jsonb,
        effective_from = COALESCE(${effective_from ?? null}::date, effective_from),
        effective_to   = COALESCE(${effective_to ?? null}::date, effective_to),
        is_active      = COALESCE(${is_active ?? null}::boolean, is_active)
      WHERE id = ${id}
      RETURNING *, base_rate as base_price
    `;

    return NextResponse.json({ data: rows[0], message: "Rate plan updated successfully" });
  } catch (error: any) {
    console.error("[masters/rate-plans/[id] PUT]", error);
    return NextResponse.json({ error: error?.message || "Failed to update rate plan" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sql = getDb();

    const existing = await sql`SELECT property_id, name FROM rate_plans WHERE id = ${id} LIMIT 1`;
    if (!existing[0]) return NextResponse.json({ error: "Rate plan not found" }, { status: 404 });

    const accessErr = validateMutationPropertyAccess(req, (existing[0] as any).property_id);
    if (accessErr) return accessErr;

    await sql`UPDATE rate_plans SET is_active = false WHERE id = ${id}`;
    return NextResponse.json({ message: `Rate plan "${(existing[0] as any).name}" deactivated successfully` });
  } catch (error: any) {
    console.error("[masters/rate-plans/[id] DELETE]", error);
    return NextResponse.json({ error: error?.message || "Failed to deactivate rate plan" }, { status: 500 });
  }
}
