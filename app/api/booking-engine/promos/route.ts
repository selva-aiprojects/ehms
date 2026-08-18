export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// GET — validate a promo code (public, no auth)
export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyCode = searchParams.get("property_code");
    const code = searchParams.get("code");

    if (!propertyCode || !code) {
      return NextResponse.json({ error: "property_code and code are required" }, { status: 400 });
    }

    const { getPublicDb } = await import("@/lib/db");
    const publicSql = getPublicDb();
    const tenants = await publicSql`SELECT schema_name FROM tenants WHERE code = ${propertyCode.toUpperCase()} AND is_active = true LIMIT 1` as any[];
    if (tenants.length === 0) {
      return NextResponse.json({ valid: false, error: "Property not found" });
    }

    const { getDb: getTenantDb } = await import("@/lib/db");
    const tenantSql = getTenantDb(tenants[0].schema_name);

    const properties = await tenantSql`SELECT id FROM properties WHERE code = ${propertyCode.toUpperCase()} AND is_active = true LIMIT 1` as any[];
    if (properties.length === 0) {
      return NextResponse.json({ valid: false, error: "Property not found" });
    }

    const promos = await tenantSql`
      SELECT code, discount_type, discount_value, min_nights, valid_from, valid_to
      FROM promo_codes
      WHERE property_id = ${properties[0].id}
        AND code = ${code.toUpperCase()}
        AND is_active = true
        AND CURRENT_DATE BETWEEN valid_from AND valid_to
        AND (max_uses IS NULL OR used_count < max_uses)
      LIMIT 1
    ` as any[];

    if (promos.length === 0) {
      return NextResponse.json({ valid: false, error: "Invalid or expired promo code" });
    }

    return NextResponse.json({
      valid: true,
      code: promos[0].code,
      discount_type: promos[0].discount_type,
      discount_value: Number(promos[0].discount_value),
      min_nights: promos[0].min_nights,
    });
  } catch (error) {
    console.error("[booking-engine/promos GET]", error);
    return NextResponse.json({ error: "Failed to validate promo" }, { status: 500 });
  }
}
