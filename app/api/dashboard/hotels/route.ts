import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id") || undefined;
    const sql = getDb();

    const param = propertyId || null;

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
      WHERE p.vertical_type = 'hotel' AND p.is_active = true
        AND (${param}::uuid IS NULL OR p.id = ${param}::uuid)
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
        star_rating: p.star_rating,
        manager: "Manager", // simplification
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

    // 2. Channel Performance
    const channelPerf = await sql`
      SELECT 
        COALESCE(b.source, 'direct') as channel,
        COUNT(b.id) as count,
        SUM(b.total_amount) as amount
      FROM bookings b
      JOIN properties p ON b.property_id = p.id
      WHERE p.vertical_type = 'hotel'
        AND (${param}::uuid IS NULL OR b.property_id = ${param}::uuid)
      GROUP BY b.source
    `;
    const totalChannelCount = (channelPerf as any[]).reduce((sum, item) => sum + parseInt(item.count), 0);
    const channelData = (channelPerf as any[]).map(item => ({
      channel: item.channel,
      pct: totalChannelCount > 0 ? Math.round((parseInt(item.count) / totalChannelCount) * 100) : 0,
      amount: parseFloat(item.amount) || 0
    })).sort((a, b) => b.pct - a.pct);

    // 3. Seasonal Comparison (Mocked based on last 12 months)
    const seasonal = await sql`
      SELECT 
        EXTRACT(QUARTER FROM check_in) as qtr,
        COUNT(b.id) as count
      FROM bookings b
      JOIN properties p ON b.property_id = p.id
      WHERE p.vertical_type = 'hotel'
        AND (${param}::uuid IS NULL OR b.property_id = ${param}::uuid)
      GROUP BY EXTRACT(QUARTER FROM check_in)
    `;
    const maxSeason = Math.max(...(seasonal as any[]).map(s => parseInt(s.count)), 1);
    const seasonMap = {
      1: "Spring (Jan-Mar)",
      2: "Summer (Apr-Jun)",
      3: "Monsoon (Jul-Sep)",
      4: "Winter (Oct-Dec)"
    };
    const seasonalData = (seasonal as any[]).map(s => {
      const occ = Math.round((parseInt(s.count) / maxSeason) * 95); // normalize to max 95%
      return {
        season: seasonMap[parseInt(s.qtr) as keyof typeof seasonMap] || "Unknown",
        occ: occ > 0 ? occ : 40,
        qtr: parseInt(s.qtr)
      };
    }).sort((a, b) => a.qtr - b.qtr);

    // 4. Upcoming Group Bookings (adults >= 3 or corporate_id IS NOT NULL)
    const upcomingGroups = await sql`
      SELECT 
        COALESCE(c.name, g.first_name || '''s Group') as group,
        u.unit_label as room,
        b.adults as rooms, -- using adults as a proxy for group size
        to_char(b.check_in, 'DD Mon') as checkIn,
        to_char(b.check_out, 'DD Mon') as checkOut,
        b.status,
        g.first_name || ' ' || COALESCE(g.last_name, '') as contact
      FROM bookings b
      JOIN guest_profiles g ON b.guest_id = g.id
      LEFT JOIN corporate_accounts c ON b.corporate_id = c.id
      LEFT JOIN units u ON b.unit_id = u.id
      JOIN properties p ON b.property_id = p.id
      WHERE p.vertical_type = 'hotel'
        AND b.check_in >= CURRENT_DATE
        AND (b.adults >= 3 OR b.corporate_id IS NOT NULL)
        AND (${param}::uuid IS NULL OR b.property_id = ${param}::uuid)
      ORDER BY b.check_in ASC
      LIMIT 5
    `;

    // 5. Today's Arrivals
    const todaysArrivals = await sql`
      SELECT 
        g.first_name || ' ' || COALESCE(g.last_name, '') AS guest,
        u.unit_label AS room,
        COALESCE(b.source, 'direct') AS source,
        b.status
      FROM bookings b
      JOIN guest_profiles g ON b.guest_id = g.id
      LEFT JOIN units u ON b.unit_id = u.id
      JOIN properties p ON b.property_id = p.id
      WHERE p.vertical_type = 'hotel'
        AND b.check_in::date = CURRENT_DATE
        AND (${param}::uuid IS NULL OR b.property_id = ${param}::uuid)
      ORDER BY b.created_at DESC
      LIMIT 10
    `;

    // 6. Today's Departures
    const todaysDepartures = await sql`
      SELECT 
        g.first_name || ' ' || COALESCE(g.last_name, '') AS guest,
        u.unit_label AS room,
        b.total_amount as folio_amount,
        b.paid_amount as paid_amount,
        b.status
      FROM bookings b
      JOIN guest_profiles g ON b.guest_id = g.id
      LEFT JOIN units u ON b.unit_id = u.id
      JOIN properties p ON b.property_id = p.id
      WHERE p.vertical_type = 'hotel'
        AND b.check_out::date = CURRENT_DATE
        AND (${param}::uuid IS NULL OR b.property_id = ${param}::uuid)
      ORDER BY b.created_at DESC
      LIMIT 10
    `;
    const departuresWithFolio = (todaysDepartures as any[]).map(d => ({
      ...d,
      folio: '₹' + parseInt(d.folio_amount).toLocaleString(),
      status: (parseFloat(d.folio_amount) <= parseFloat(d.paid_amount) || d.status === 'checked_out') ? 'completed' : 'pending'
    }));

    // 7. Housekeeping Status
    const housekeeping = await sql`
      SELECT 
        f.name as area,
        COUNT(h.id) as total,
        COUNT(h.id) FILTER (WHERE h.status IN ('resolved', 'closed')) as done
      FROM housekeeping_tasks h
      JOIN properties p ON h.property_id = p.id
      JOIN units u ON h.unit_id = u.id
      JOIN floors f ON u.floor_id = f.id
      WHERE p.vertical_type = 'hotel'
        AND (${param}::uuid IS NULL OR h.property_id = ${param}::uuid)
      GROUP BY f.id, f.name
      LIMIT 5
    `;
    const housekeepingData = (housekeeping as any[]).map(h => ({
      area: h.area,
      done: parseInt(h.done),
      total: parseInt(h.total),
      status: parseInt(h.done) === parseInt(h.total) && parseInt(h.total) > 0 ? 'completed' : 'in_progress'
    }));
    const totalHkDone = housekeepingData.reduce((acc, h) => acc + h.done, 0);
    const totalHk = housekeepingData.reduce((acc, h) => acc + h.total, 0);
    const overallHkProgress = totalHk > 0 ? Math.round((totalHkDone / totalHk) * 100) : 100;

    // 8. Guest Satisfaction (Mocked)
    const guestSatisfaction = [
      { category: "Cleanliness", rating: 4.7, color: "#2BAE8E" },
      { category: "Staff Service", rating: 4.5, color: "#2BAE8E" },
      { category: "Room Comfort", rating: 4.3, color: "#F5A623" },
      { category: "Food & Dining", rating: 4.1, color: "#F5A623" },
      { category: "Amenities", rating: 4.4, color: "#2BAE8E" },
      { category: "Value for Money", rating: 4.0, color: "#64748B" }
    ];

    return NextResponse.json({
      data: {
        properties: propertiesWithOccupancy,
        summary: {
          totalUnits,
          totalOccupied,
          avgOccupancy,
          totalProperties: propertiesWithOccupancy.length,
        },
        channelData,
        seasonalData,
        upcomingGroups,
        todaysArrivals,
        todaysDepartures: departuresWithFolio,
        housekeepingData,
        overallHkProgress,
        guestSatisfaction
      }
    });
  } catch (error) {
    console.error("[hotels dashboard GET]", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
