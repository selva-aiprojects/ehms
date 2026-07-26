export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// GET — public availability check (no auth required)
// Used by the public booking page: /book/[propertyCode]
export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyCode = searchParams.get("property_code");
    const checkIn = searchParams.get("check_in");
    const checkOut = searchParams.get("check_out");
    const adults = parseInt(searchParams.get("adults") || "1");
    const promoCode = searchParams.get("promo_code");

    if (!propertyCode || !checkIn || !checkOut) {
      return NextResponse.json({ error: "property_code, check_in, and check_out are required" }, { status: 400 });
    }

    // Resolve property from tenant schema
    // This endpoint runs in the public schema context — we need to query the tenant
    const { getPublicDb } = await import("@/lib/db");
    const publicSql = getPublicDb();

    const tenants = await publicSql`SELECT schema_name FROM tenants WHERE code = ${propertyCode.toUpperCase()} AND is_active = true LIMIT 1` as any[];
    if (tenants.length === 0) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const { getDb: getTenantDb } = await import("@/lib/db");
    const tenantSql = getTenantDb(tenants[0].schema_name);

    // Find property
    const properties = await tenantSql`SELECT id, name, check_in_time, check_out_time, config FROM properties WHERE code = ${propertyCode.toUpperCase()} AND is_active = true LIMIT 1` as any[];
    if (properties.length === 0) {
      return NextResponse.json({ error: "Property not found in tenant" }, { status: 404 });
    }
    const property = properties[0];

    // Get available units
    const availableUnits = await tenantSql`
      SELECT
        u.id, u.unit_type, u.unit_label, u.base_rate, u.max_occupancy, u.attributes,
        f.name AS floor_name
      FROM units u
      JOIN floors f ON f.id = u.floor_id
      JOIN buildings b ON b.id = f.building_id
      WHERE b.property_id = ${property.id}
        AND u.is_active = true
        AND u.status NOT IN ('maintenance', 'reserved')
        AND u.max_occupancy >= ${adults}
        AND u.id NOT IN (
          SELECT b2.unit_id FROM bookings b2
          WHERE b2.unit_id = u.id
            AND b2.status IN ('confirmed', 'checked_in', 'pending')
            AND b2.check_in < ${checkOut}::date + interval '1 day'
            AND b2.check_out > ${checkIn}::date
        )
      ORDER BY u.base_rate ASC
    ` as any[];

    // Group by unit_type for display
    const grouped: Record<string, any> = {};
    for (const unit of availableUnits) {
      if (!grouped[unit.unit_type]) {
        grouped[unit.unit_type] = {
          unit_type: unit.unit_type,
          available_count: 0,
          rate: Number(unit.base_rate),
          units: [],
        };
      }
      grouped[unit.unit_type].available_count++;
      grouped[unit.unit_type].units.push(unit);
    }

    // Calculate nights
    const ci = new Date(checkIn);
    const co = new Date(checkOut);
    const nights = Math.max(1, Math.ceil((co.getTime() - ci.getTime()) / 86400000));

    // Apply promo discount if valid
    let promoDiscount = 0;
    let promoDetails: { code: string; discount_type: string; discount_value: number } | null = null;
    if (promoCode) {
      const promos = await tenantSql`
        SELECT * FROM promo_codes
        WHERE property_id = ${property.id}
          AND code = ${promoCode.toUpperCase()}
          AND is_active = true
          AND CURRENT_DATE BETWEEN valid_from AND valid_to
          AND (max_uses IS NULL OR used_count < max_uses)
          AND (min_nights = 0 OR ${nights} >= min_nights)
        LIMIT 1
      ` as any[];

      if (promos.length > 0) {
        const promo = promos[0];
        promoDetails = { code: promo.code, discount_type: promo.discount_type, discount_value: Number(promo.discount_value) };
      }
    }

    // Build response
    const roomTypes = Object.values(grouped).map((g: any) => {
      let pricePerNight = g.rate;
      let totalPrice = pricePerNight * nights;

      if (promoDetails) {
        if (promoDetails.discount_type === "percentage") {
          promoDiscount = totalPrice * (promoDetails.discount_value / 100);
        } else {
          promoDiscount = Math.min(promoDetails.discount_value, totalPrice);
        }
        totalPrice -= promoDiscount;
      }

      return {
        ...g,
        price_per_night: pricePerNight,
        total_nights: nights,
        total_price: Math.round(totalPrice),
        promo_discount: Math.round(promoDiscount),
      };
    });

    return NextResponse.json({
      property: {
        name: property.name,
        check_in_time: property.check_in_time,
        check_out_time: property.check_out_time,
      },
      room_types: roomTypes,
      nights,
      promo: promoDetails,
    });
  } catch (error) {
    console.error("[booking-engine/availability GET]", error);
    return NextResponse.json({ error: "Failed to check availability" }, { status: 500 });
  }
}
