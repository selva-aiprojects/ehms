import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sql = getDb();

    // 1. Fetch properties
    const properties = await sql`
      SELECT 
        p.*,
        COALESCE(
          json_agg(json_build_object('id', u.id, 'status', u.status)) FILTER (WHERE u.id IS NOT NULL),
          '[]'
        ) AS units
      FROM properties p
      LEFT JOIN units u ON u.floor_id IN (
        SELECT f.id FROM floors f JOIN buildings b ON b.id = f.building_id WHERE b.property_id = p.id
      )
      WHERE p.vertical_type = 'service_apartment' AND p.is_active = true
      GROUP BY p.id
      ORDER BY p.name
    `;

    const propertiesWithOccupancy = (properties as any[]).map(p => {
      const units = p.units || [];
      const total_units = units.length;
      const occupied_units = units.filter((u: any) => u.status === "occupied").length;
      return {
        id: p.id,
        name: p.name,
        vertical_type: p.vertical_type,
        address: p.address,
        phone: p.phone,
        email: p.email,
        manager: "Manager", // we could fetch from users but let's leave simple
        total_units,
        occupied_units,
        occupancy_pct: total_units > 0 ? Math.round((occupied_units / total_units) * 100) : 0
      };
    });

    const totalUnits = propertiesWithOccupancy.reduce((acc, p) => acc + p.total_units, 0);
    const totalOccupied = propertiesWithOccupancy.reduce((acc, p) => acc + p.occupied_units, 0);
    const avgOccupancy = propertiesWithOccupancy.length > 0 
      ? Math.round(propertiesWithOccupancy.reduce((acc, p) => acc + p.occupancy_pct, 0) / propertiesWithOccupancy.length)
      : 0;

    // 2. Extended Stays (>= 14 nights, active)
    const extendedStays = await sql`
      SELECT 
        b.id,
        g.first_name || ' ' || COALESCE(g.last_name, '') AS guest,
        u.unit_label AS unit,
        EXTRACT(DAY FROM (b.check_out - b.check_in)) AS nights,
        to_char(b.check_in, 'DD Mon') AS check_in_date,
        COALESCE(c.name, 'Personal') AS company,
        CASE 
          WHEN b.check_out <= CURRENT_DATE THEN 'checkout_today'
          ELSE 'active'
        END AS status
      FROM bookings b
      JOIN guest_profiles g ON b.guest_id = g.id
      LEFT JOIN corporate_accounts c ON b.corporate_id = c.id
      LEFT JOIN units u ON b.unit_id = u.id
      JOIN properties p ON b.property_id = p.id
      WHERE p.vertical_type = 'service_apartment'
        AND b.status IN ('checked_in', 'pending')
        AND EXTRACT(DAY FROM (b.check_out - b.check_in)) >= 14
      ORDER BY b.check_in DESC
      LIMIT 10
    `;

    // 3. Guest Nationality Mix
    const nationalityMix = await sql`
      SELECT 
        COALESCE(g.nationality, 'Unknown') as country,
        COUNT(b.id) as count
      FROM bookings b
      JOIN guest_profiles g ON b.guest_id = g.id
      JOIN properties p ON b.property_id = p.id
      WHERE p.vertical_type = 'service_apartment'
        AND b.status IN ('checked_in', 'pending')
      GROUP BY g.nationality
      ORDER BY count DESC
    `;

    const totalNationalityCount = (nationalityMix as any[]).reduce((sum, item) => sum + parseInt(item.count), 0);
    const nationalityData = (nationalityMix as any[]).map(item => ({
      country: item.country,
      pct: totalNationalityCount > 0 ? Math.round((parseInt(item.count) / totalNationalityCount) * 100) : 0,
      flag: item.country.substring(0, 2).toUpperCase()
    }));

    // 4. Corporate vs Leisure Split
    const bookingModels = await sql`
      SELECT 
        CASE WHEN b.corporate_id IS NOT NULL THEN 'corporate' ELSE 'leisure' END as model,
        COUNT(b.id) as count
      FROM bookings b
      JOIN properties p ON b.property_id = p.id
      WHERE p.vertical_type = 'service_apartment'
        AND b.status IN ('checked_in', 'pending')
      GROUP BY CASE WHEN b.corporate_id IS NOT NULL THEN 'corporate' ELSE 'leisure' END
    `;

    let totalModels = 0;
    const modelCounts: Record<string, number> = { corporate: 0, leisure: 0 };
    (bookingModels as any[]).forEach(item => {
      const c = parseInt(item.count);
      totalModels += c;
      modelCounts[item.model] = (modelCounts[item.model] || 0) + c;
    });

    const splitData = {
      corporate: totalModels > 0 ? Math.round((modelCounts.corporate / totalModels) * 100) : 65,
      leisure: totalModels > 0 ? Math.round((modelCounts.leisure / totalModels) * 100) : 20,
      other: totalModels > 0 ? 0 : 15,
    };

    // 5. Maintenance Requests
    const maintenance = await sql`
      SELECT 
        m.id,
        m.title AS issue,
        p.name AS property,
        u.unit_label AS unit,
        m.priority,
        m.status,
        m.created_at
      FROM maintenance_tickets m
      JOIN properties p ON m.property_id = p.id
      LEFT JOIN units u ON m.unit_id = u.id
      WHERE p.vertical_type = 'service_apartment'
        AND m.status != 'closed'
      ORDER BY 
        CASE m.priority 
          WHEN 'urgent' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          ELSE 4 
        END,
        m.created_at DESC
      LIMIT 10
    `;

    // 6. Upcoming Checkouts (next 7 days)
    const upcomingCheckouts = await sql`
      SELECT 
        g.first_name || ' ' || COALESCE(g.last_name, '') AS guest,
        u.unit_label AS unit,
        to_char(b.check_out, 'DD Mon') AS date,
        COALESCE(c.name, 'Personal') AS company,
        EXTRACT(DAY FROM (b.check_out - b.check_in)) AS nights
      FROM bookings b
      JOIN guest_profiles g ON b.guest_id = g.id
      LEFT JOIN corporate_accounts c ON b.corporate_id = c.id
      LEFT JOIN units u ON b.unit_id = u.id
      JOIN properties p ON b.property_id = p.id
      WHERE p.vertical_type = 'service_apartment'
        AND b.status IN ('checked_in', 'pending')
        AND b.check_out >= CURRENT_DATE
        AND b.check_out <= CURRENT_DATE + INTERVAL '7 days'
      ORDER BY b.check_out ASC
      LIMIT 10
    `;

    // 7. Upcoming Arrivals (next 7 days)
    const upcomingArrivals = await sql`
      SELECT 
        g.first_name || ' ' || COALESCE(g.last_name, '') AS guest,
        u.unit_label AS unit,
        to_char(b.check_in, 'DD Mon') AS date,
        COALESCE(c.name, 'Personal') AS company,
        EXTRACT(DAY FROM (b.check_out - b.check_in)) AS nights
      FROM bookings b
      JOIN guest_profiles g ON b.guest_id = g.id
      LEFT JOIN corporate_accounts c ON b.corporate_id = c.id
      LEFT JOIN units u ON b.unit_id = u.id
      JOIN properties p ON b.property_id = p.id
      WHERE p.vertical_type = 'service_apartment'
        AND b.status = 'pending'
        AND b.check_in >= CURRENT_DATE
        AND b.check_in <= CURRENT_DATE + INTERVAL '7 days'
      ORDER BY b.check_in ASC
      LIMIT 10
    `;

    // 8. Guest Services Requests
    const guestRequests = await sql`
      SELECT 
        h.id,
        h.notes AS request,
        u.unit_label AS unit,
        h.status,
        h.created_at
      FROM housekeeping_tasks h
      JOIN properties p ON h.property_id = p.id
      LEFT JOIN units u ON h.unit_id = u.id
      WHERE p.vertical_type = 'service_apartment'
        AND h.task_type = 'guest_request'
        AND h.status != 'closed'
      ORDER BY h.created_at DESC
      LIMIT 5
    `;

    return NextResponse.json({
      data: {
        properties: propertiesWithOccupancy,
        summary: {
          totalUnits,
          totalOccupied,
          avgOccupancy,
          totalProperties: propertiesWithOccupancy.length,
        },
        extendedStays,
        nationalityMix: nationalityData,
        splitData,
        maintenance,
        upcomingCheckouts,
        upcomingArrivals,
        guestRequests
      }
    });
  } catch (error) {
    console.error("[apartments dashboard GET]", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
