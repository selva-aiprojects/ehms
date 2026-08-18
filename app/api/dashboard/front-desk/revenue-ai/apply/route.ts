export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { calculateAiRateRecommendation } from "@/lib/revenue-ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { property_id, rate_plan_id, recommended_rate, apply_auto_pilot, apply_all } = body;

    if (!property_id) {
      return NextResponse.json({ error: "property_id is required" }, { status: 400 });
    }

    const sql = getDb();

    // 1. Toggle Dynamic Auto-Pilot if requested
    if (typeof apply_auto_pilot === "boolean") {
      const propRows = await sql`SELECT config FROM properties WHERE id = ${property_id} LIMIT 1` as any[];
      if (propRows.length === 0) return NextResponse.json({ error: "Property not found" }, { status: 404 });

      const currentConfig = propRows[0]?.config || {};
      const updatedConfig = {
        ...currentConfig,
        features: {
          ...(currentConfig.features || {}),
          ai_auto_pilot: {
            enabled: apply_auto_pilot,
            label: "AI Revenue Auto-Pilot",
            updated_at: new Date().toISOString()
          }
        }
      };

      await sql`
        UPDATE properties
        SET config = ${JSON.stringify(updatedConfig)}::jsonb
        WHERE id = ${property_id}
      `;

      return NextResponse.json({
        success: true,
        auto_pilot_enabled: apply_auto_pilot,
        message: apply_auto_pilot
          ? "Dynamic AI Auto-Pilot enabled! Pricing engine will automatically scale rates across direct booking and OTA channels."
          : "Dynamic AI Auto-Pilot disabled. Rates returned to manual control."
      });
    }

    // 2. Apply All Recommendations across the property
    if (apply_all) {
      // Calculate current occupancy to determine target recommended rates
      const inventoryRows = await sql`
        SELECT
          COUNT(u.id)::int as total_units,
          COUNT(CASE WHEN u.status = 'vacant' THEN 1 END)::int as vacant_units,
          COUNT(CASE WHEN u.status IN ('occupied', 'reserved') THEN 1 END)::int as occupied_units
        FROM units u
        JOIN floors f ON f.id = u.floor_id
        JOIN buildings b ON b.id = f.building_id
        WHERE b.property_id = ${property_id} AND u.is_active = true
      ` as any[];

      const totalUnits = inventoryRows[0]?.total_units || 20;
      const occupiedUnits = inventoryRows[0]?.occupied_units || 15;
      const occupancyPct = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 75;

      const ratePlans = await sql`SELECT * FROM rate_plans WHERE property_id = ${property_id} AND is_active = true` as any[];
      let updatedCount = 0;

      for (const rp of ratePlans) {
        const rec = calculateAiRateRecommendation(rp, occupancyPct, new Date(), 5);
        if (rec.recommendedRate !== rp.base_rate) {
          await sql`
            UPDATE rate_plans
            SET base_rate = ${rec.recommendedRate},
                is_dynamic = true,
                rules = jsonb_set(COALESCE(rules, '{}'::jsonb), '{last_ai_applied_at}', ${JSON.stringify(new Date().toISOString())}::jsonb)
            WHERE id = ${rp.id}
          `;
          updatedCount++;
        }
      }

      return NextResponse.json({
        success: true,
        updated_count: updatedCount,
        message: `Applied AI dynamic pricing across all ${ratePlans.length} active room rate categories!`
      });
    }

    // 3. Apply a single rate plan recommendation
    if (rate_plan_id && recommended_rate) {
      const updateRows = await sql`
        UPDATE rate_plans
        SET base_rate = ${Number(recommended_rate)},
            is_dynamic = true,
            rules = jsonb_set(COALESCE(rules, '{}'::jsonb), '{last_ai_applied_at}', ${JSON.stringify(new Date().toISOString())}::jsonb)
        WHERE id = ${rate_plan_id}
        RETURNING *
      ` as any[];

      if (updateRows.length === 0) {
        return NextResponse.json({ error: "Rate plan not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: updateRows[0],
        message: `Rate Plan "${updateRows[0].name}" updated to AI recommended rate of ₹${recommended_rate}/night.`
      });
    }

    return NextResponse.json({ error: "Invalid request body parameters" }, { status: 400 });
  } catch (error: any) {
    console.error("[AI Revenue Apply POST Error]", error);
    return NextResponse.json({ error: error?.message || "Failed to apply AI rate recommendation" }, { status: 500 });
  }
}
