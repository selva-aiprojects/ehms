import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess, validateMutationPropertyAccess } from "@/lib/property-scope";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");

    const rows = await sql`
      SELECT
        rp.*,
        rp.base_rate as base_price,
        COALESCE(rp.rules->>'code', 'RP-' || SUBSTRING(rp.id::text, 1, 4)) as code,
        COALESCE((rp.rules->>'is_refundable')::boolean, true) as is_refundable,
        rp.rules->>'cancellation_policy' as cancellation_policy,
        json_build_object('id', p.id, 'name', p.name) AS property
      FROM rate_plans rp
      LEFT JOIN properties p ON p.id = rp.property_id
      WHERE rp.is_active = true
        ${propertyId ? sql`AND rp.property_id = ${propertyId}` : scope.assignedPropertyIds.length > 0 ? sql`AND rp.property_id = ANY(${scope.assignedPropertyIds})` : sql``}
      ORDER BY rp.effective_from DESC NULLS LAST, rp.name ASC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[masters/rate-plans GET]", error);
    return NextResponse.json({ error: "Failed to fetch rate plans" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const { property_id, unit_type, name, code, base_price, base_rate, currency, is_dynamic, is_refundable, cancellation_policy, rules, effective_from, effective_to } = body;

    if (!property_id || !name || (!base_price && !base_rate)) {
      return NextResponse.json({ error: "property_id, name, and base_price/base_rate are required" }, { status: 400 });
    }

    const accessErr = validateMutationPropertyAccess(req, property_id);
    if (accessErr) return accessErr;

    const rateAmount = parseFloat(String(base_price || base_rate));
    const rulesObj = {
      ...(rules || {}),
      code: code || `RP-${name.toUpperCase().replace(/\s+/g, '-').slice(0, 8)}`,
      is_refundable: is_refundable ?? true,
      cancellation_policy: cancellation_policy || "Standard 24-hour cancellation",
    };

    const rows = await sql`
      INSERT INTO rate_plans (property_id, unit_type, name, base_rate, currency, is_dynamic, rules, effective_from, effective_to, is_active)
      VALUES (
        ${property_id},
        ${unit_type || null}::unit_type,
        ${name},
        ${rateAmount},
        ${currency || "INR"},
        ${is_dynamic ?? false},
        ${JSON.stringify(rulesObj)}::jsonb,
        ${effective_from || null}::date,
        ${effective_to || null}::date,
        true
      )
      RETURNING *, base_rate as base_price
    `;

    return NextResponse.json({ data: rows[0], message: `Rate plan "${name}" created successfully` }, { status: 201 });
  } catch (error: any) {
    console.error("[masters/rate-plans POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to create rate plan" }, { status: 500 });
  }
}
