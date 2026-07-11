export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess, validateMutationPropertyAccess } from "@/lib/property-scope";

// GET /api/rate-plans?property_id=...&unit_type=...&active_only=true&date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const unitType = searchParams.get("unit_type");
    const activeOnly = searchParams.get("active_only") !== "false";
    const checkDate = searchParams.get("date"); // find plan effective on this date

    const rows = await sql`
      SELECT
        rp.*,
        p.name as property_name,
        p.vertical_type
      FROM rate_plans rp
      LEFT JOIN properties p ON p.id = rp.property_id
      WHERE 1=1
        ${propertyId ? sql`AND rp.property_id = ${propertyId}` : scope.assignedPropertyIds.length > 0 ? sql`AND rp.property_id = ANY(${scope.assignedPropertyIds})` : sql``}
        ${unitType   ? sql`AND rp.unit_type = ${unitType}::unit_type` : sql``}
        ${activeOnly ? sql`AND rp.is_active = true` : sql``}
        ${checkDate  ? sql`AND (rp.effective_from IS NULL OR rp.effective_from <= ${checkDate}::date)
                          AND (rp.effective_to IS NULL OR rp.effective_to >= ${checkDate}::date)` : sql``}
      ORDER BY rp.effective_from DESC NULLS LAST, rp.unit_type ASC, rp.base_rate ASC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[rate-plans GET]", error);
    return NextResponse.json({ error: "Failed to fetch rate plans" }, { status: 500 });
  }
}

// POST /api/rate-plans — create a new rate plan
export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const { property_id, unit_type, name, base_rate, currency, is_dynamic, rules, effective_from, effective_to } = body;

    if (!property_id || !name || !base_rate) {
      return NextResponse.json({ error: "property_id, name, and base_rate are required" }, { status: 400 });
    }

    const accessErr = validateMutationPropertyAccess(req, property_id);
    if (accessErr) return accessErr;

    if (parseFloat(String(base_rate)) <= 0) {
      return NextResponse.json({ error: "base_rate must be greater than 0" }, { status: 400 });
    }

    // Check for overlapping active rate plan for same property + unit_type
    if (unit_type && effective_from && effective_to) {
      const overlap = await sql`
        SELECT id FROM rate_plans
        WHERE property_id = ${property_id}
          AND unit_type = ${unit_type}::unit_type
          AND is_active = true
          AND (
            effective_from IS NULL OR effective_to IS NULL
            OR (effective_from <= ${effective_to}::date AND effective_to >= ${effective_from}::date)
          )
        LIMIT 1
      `;
      if (overlap.length > 0) {
        return NextResponse.json({
          error: "An active rate plan for this unit type already covers the selected date range. Deactivate it first or adjust dates.",
        }, { status: 409 });
      }
    }

    const rows = await sql`
      INSERT INTO rate_plans (property_id, unit_type, name, base_rate, currency, is_dynamic, rules, effective_from, effective_to, is_active)
      VALUES (
        ${property_id},
        ${unit_type || null}::unit_type,
        ${name},
        ${parseFloat(String(base_rate))},
        ${currency || "INR"},
        ${is_dynamic ?? false},
        ${JSON.stringify(rules || {})}::jsonb,
        ${effective_from || null}::date,
        ${effective_to || null}::date,
        true
      )
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0], message: `Rate plan "${name}" created` }, { status: 201 });
  } catch (error: any) {
    console.error("[rate-plans POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to create rate plan" }, { status: 500 });
  }
}

// PUT /api/rate-plans — update an existing rate plan
export async function PUT(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const { id, name, base_rate, currency, is_dynamic, rules, effective_from, effective_to, is_active } = body;

    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    // Validate property access on the rate plan being updated
    const existing = await sql`SELECT property_id FROM rate_plans WHERE id = ${id} LIMIT 1`;
    if (existing.length > 0) {
      const accessErr = validateMutationPropertyAccess(req, (existing[0] as any).property_id);
      if (accessErr) return accessErr;
    }

    const rows = await sql`
      UPDATE rate_plans SET
        name           = COALESCE(${name ?? null}, name),
        base_rate      = COALESCE(${base_rate ? parseFloat(String(base_rate)) : null}::numeric, base_rate),
        currency       = COALESCE(${currency ?? null}, currency),
        is_dynamic     = COALESCE(${is_dynamic ?? null}::boolean, is_dynamic),
        rules          = COALESCE(${rules ? JSON.stringify(rules) : null}::jsonb, rules),
        effective_from = COALESCE(${effective_from ?? null}::date, effective_from),
        effective_to   = COALESCE(${effective_to ?? null}::date, effective_to),
        is_active      = COALESCE(${is_active ?? null}::boolean, is_active)
      WHERE id = ${id}
      RETURNING *
    `;

    if (!rows[0]) return NextResponse.json({ error: "Rate plan not found" }, { status: 404 });
    return NextResponse.json({ data: rows[0], message: "Rate plan updated" });
  } catch (error: any) {
    console.error("[rate-plans PUT]", error);
    return NextResponse.json({ error: error?.message || "Failed to update rate plan" }, { status: 500 });
  }
}

// DELETE /api/rate-plans?id=... — soft delete (deactivate)
export async function DELETE(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    // Validate property access on the rate plan being deactivated
    const existing = await sql`SELECT property_id FROM rate_plans WHERE id = ${id} LIMIT 1`;
    if (existing.length > 0) {
      const accessErr = validateMutationPropertyAccess(req, (existing[0] as any).property_id);
      if (accessErr) return accessErr;
    }

    const rows = await sql`
      UPDATE rate_plans SET is_active = false WHERE id = ${id} RETURNING id, name
    `;
    if (!rows[0]) return NextResponse.json({ error: "Rate plan not found" }, { status: 404 });

    const rp = rows[0] as Record<string, unknown>;
    return NextResponse.json({ message: `Rate plan "${rp.name}" deactivated` });
  } catch (error: any) {
    console.error("[rate-plans DELETE]", error);
    return NextResponse.json({ error: error?.message || "Failed to deactivate rate plan" }, { status: 500 });
  }
}
