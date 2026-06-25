export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const verticalType = searchParams.get("vertical_type");
    const includeInactive = searchParams.get("include_inactive") === "true";

    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;
    if (!includeInactive) {
      conditions.push(`p.is_active = true`);
    }
    if (propertyId) {
      conditions.push(`p.id = $${idx++}::uuid`);
      params.push(propertyId);
    }
    if (verticalType) {
      conditions.push(`p.vertical_type = $${idx++}`);
      params.push(verticalType);
    }
    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';
    const query = `
      SELECT
        p.*, r.name AS region_name, r.city, r.state, r.country,
        COALESCE(
          json_agg(json_build_object('id', u.id, 'status', u.status, 'unit_label', u.unit_label, 'unit_type', u.unit_type)) FILTER (WHERE u.id IS NOT NULL),
          '[]'
        ) AS units
      FROM properties p
      JOIN regions r ON r.id = p.region_id
      LEFT JOIN units u ON u.floor_id IN (
        SELECT f.id FROM floors f JOIN buildings b ON b.id = f.building_id WHERE b.property_id = p.id
      )
      WHERE ${whereClause}
      GROUP BY p.id, r.name, r.city, r.state, r.country
      ORDER BY p.name
    `;
    const rows = await sql.query(query, params.length > 0 ? params : undefined);

    const withOccupancy = (rows as any[]).map(p => {
      const units = p.units || [];
      const total = units.length;
      const occupied = units.filter((u: any) => u.status === "occupied").length;
      return { ...p, total_units: total, occupied_units: occupied, occupancy_pct: total > 0 ? Math.round((occupied / total) * 100) : 0 };
    });

    return NextResponse.json({ data: withOccupancy });
  } catch (error) {
    console.error("[properties GET]", error);
    return NextResponse.json({ error: "Failed to fetch properties" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const requesterRole = req.headers.get("x-user-role");
    if (!["super_admin", "executive", "property_manager"].includes(requesterRole || "")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const sql = getDb();
    const body = await req.json();
    const { name, code, vertical_type, booking_model, region_id, address, phone, email, check_in_time, check_out_time, star_rating, latitude, longitude, config } = body;

    if (!name || !code || !vertical_type || !booking_model) {
      return NextResponse.json({ error: "Name, code, vertical type, and booking model are required" }, { status: 400 });
    }

    let regionId = region_id;
    if (!regionId) {
      const defaultRegion = await sql`
        SELECT id FROM regions LIMIT 1
      ` as any[];
      if (defaultRegion.length === 0) {
        return NextResponse.json({ error: "No region found. Create a region first." }, { status: 400 });
      }
      regionId = defaultRegion[0].id;
    }

    const existing = await sql`
      SELECT id FROM properties WHERE code = ${code} LIMIT 1
    ` as any[];
    if (existing.length > 0) {
      return NextResponse.json({ error: "A property with this code already exists" }, { status: 400 });
    }

    const defaultFeatures = {
      rooms_map:     { enabled: true,  label: "Rooms Map" },
      rate_card:     { enabled: true,  label: "Rate Card" },
      restaurant:    { enabled: false, label: "Restaurant" },
      bar:           { enabled: false, label: "Bar" },
      laundry:       { enabled: true,  label: "Laundry" },
      maintenance:   { enabled: true,  label: "Maintenance" },
      gym:           { enabled: false, label: "Gym" },
      yoga:          { enabled: false, label: "Yoga" },
      swimming_pool: { enabled: false, label: "Swimming Pool" },
      spa:           { enabled: false, label: "Spa" },
    };

    const configValue = config?.features
      ? { features: config.features, settings: config.settings || { timezone: "Asia/Kolkata", currency: "INR" } }
      : { features: defaultFeatures, settings: { timezone: "Asia/Kolkata", currency: "INR" } };

    const result = await sql`
      INSERT INTO properties (region_id, name, code, vertical_type, booking_model, address, phone, email, check_in_time, check_out_time, star_rating, latitude, longitude, config)
      VALUES (${regionId}, ${name}, ${code}, ${vertical_type}, ${booking_model}, ${address || null}, ${phone || null}, ${email || null}, ${check_in_time || "14:00"}, ${check_out_time || "11:00"}, ${star_rating || null}, ${latitude || null}, ${longitude || null}, ${JSON.stringify(configValue)}::jsonb)
      RETURNING *
    ` as any[];

    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (error: any) {
    console.error("[properties POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to create property" }, { status: 500 });
  }
}
