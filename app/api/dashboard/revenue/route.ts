export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess } from "@/lib/property-scope";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;

    const pid = propertyId || (scope.assignedPropertyIds.length === 1 ? scope.assignedPropertyIds[0] : null);

    // 1. Occupancy metrics
    const totalUnits = await sql`
      SELECT COUNT(*)::int AS total FROM units u
      JOIN floors f ON f.id = u.floor_id
      JOIN buildings b ON b.id = f.building_id
      WHERE u.is_active = true
        ${pid ? sql`AND b.property_id = ${pid}` : sql``}
    ` as any[];

    const occupiedUnits = await sql`
      SELECT COUNT(*)::int AS occupied FROM units u
      JOIN floors f ON f.id = u.floor_id
      JOIN buildings b ON b.id = f.building_id
      WHERE u.is_active = true AND u.status = 'occupied'
        ${pid ? sql`AND b.property_id = ${pid}` : sql``}
    ` as any[];

    const totalRoomCount = totalUnits[0]?.total || 0;
    const occupiedRoomCount = occupiedUnits[0]?.occupied || 0;
    const occupancyPct = totalRoomCount > 0 ? Math.round((occupiedRoomCount / totalRoomCount) * 100) : 0;

    // 2. Revenue metrics (this month)
    const revenueRows = await sql`
      SELECT
        COALESCE(SUM(b.total_amount), 0)::numeric AS total_revenue,
        COALESCE(SUM(b.paid_amount), 0)::numeric AS collected_revenue,
        COUNT(*)::int AS total_bookings,
        COUNT(*) FILTER (WHERE b.status = 'checked_in')::int AS active_stays,
        COUNT(*) FILTER (WHERE b.status = 'cancelled')::int AS cancellations,
        COALESCE(AVG(b.total_amount), 0)::numeric AS avg_booking_value
      FROM bookings b
      WHERE b.check_in::date >= (CURRENT_DATE - INTERVAL '30 days')::date
        AND b.check_in::date <= CURRENT_DATE
        ${pid ? sql`AND b.property_id = ${pid}` : sql``}
    ` as any[];

    const rev = revenueRows[0] || {};
    const totalRevenue = Number(rev.total_revenue || 0);
    const activeStays = Number(rev.active_stays || 0);
    const totalBookings = Number(rev.total_bookings || 0);
    const cancellations = Number(rev.cancellations || 0);
    const avgBookingValue = Number(rev.avg_booking_value || 0);

    // 3. ADR (Average Daily Rate) = Revenue / Occupied Rooms
    const adr = occupiedRoomCount > 0 ? Math.round(totalRevenue / Math.max(occupiedRoomCount, 1)) : 0;

    // 4. RevPAR (Revenue Per Available Room) = Revenue / Total Rooms
    const revpar = totalRoomCount > 0 ? Math.round(totalRevenue / totalRoomCount) : 0;

    // 5. Revenue by source (last 30 days)
    const sourceRows = await sql`
      SELECT
        COALESCE(source, 'direct') AS source,
        COUNT(*)::int AS bookings,
        COALESCE(SUM(total_amount), 0)::numeric AS revenue
      FROM bookings
      WHERE check_in::date >= (CURRENT_DATE - INTERVAL '30 days')::date
        AND check_in::date <= CURRENT_DATE
        ${pid ? sql`AND property_id = ${pid}` : sql``}
      GROUP BY source
      ORDER BY revenue DESC
    ` as any[];

    // 6. Revenue by room type (last 30 days)
    const roomTypeRows = await sql`
      SELECT
        COALESCE(u.unit_type, 'room') AS room_type,
        COUNT(*)::int AS bookings,
        COALESCE(SUM(b.total_amount), 0)::numeric AS revenue
      FROM bookings b
      LEFT JOIN units u ON u.id = b.unit_id
      WHERE b.check_in::date >= (CURRENT_DATE - INTERVAL '30 days')::date
        AND b.check_in::date <= CURRENT_DATE
        ${pid ? sql`AND b.property_id = ${pid}` : sql``}
      GROUP BY u.unit_type
      ORDER BY revenue DESC
    ` as any[];

    // 7. Daily revenue trend (last 14 days)
    const trendRows = await sql`
      SELECT
        check_in::date AS date,
        COUNT(*)::int AS bookings,
        COALESCE(SUM(total_amount), 0)::numeric AS revenue
      FROM bookings
      WHERE check_in::date >= (CURRENT_DATE - INTERVAL '14 days')::date
        AND check_in::date <= CURRENT_DATE
        ${pid ? sql`AND property_id = ${pid}` : sql``}
      GROUP BY check_in::date
      ORDER BY date ASC
    ` as any[];

    // 8. Upcoming arrivals (next 7 days)
    const upcomingRows = await sql`
      SELECT
        b.id, b.check_in, b.check_out, b.total_amount, b.status, b.source,
        COALESCE(g.first_name || ' ' || g.last_name, 'Guest') AS guest_name,
        u.unit_label
      FROM bookings b
      LEFT JOIN guest_profiles g ON g.id = b.guest_id
      LEFT JOIN units u ON u.id = b.unit_id
      WHERE b.check_in::date >= CURRENT_DATE
        AND b.check_in::date <= (CURRENT_DATE + INTERVAL '7 days')::date
        AND b.status IN ('confirmed', 'pending')
        ${pid ? sql`AND b.property_id = ${pid}` : sql``}
      ORDER BY b.check_in ASC
      LIMIT 10
    ` as any[];

    // 9. Housekeeping summary
    const hkRows = await sql`
      SELECT
        status, COUNT(*)::int AS count
      FROM housekeeping_tasks
      WHERE scheduled_at::date = CURRENT_DATE
        ${pid ? sql`AND property_id = ${pid}` : sql``}
      GROUP BY status
    ` as any[];

    return NextResponse.json({
      occupancy: { total: totalRoomCount, occupied: occupiedRoomCount, percentage: occupancyPct },
      revenue: { total: totalRevenue, collected: Number(rev.collected_revenue || 0), adr, revpar, avgBookingValue },
      bookings: { total: totalBookings, activeStays, cancellations, cancellationRate: totalBookings > 0 ? Math.round((cancellations / totalBookings) * 100) : 0 },
      bySource: sourceRows,
      byRoomType: roomTypeRows,
      dailyTrend: trendRows,
      upcomingArrivals: upcomingRows,
      housekeeping: hkRows,
    });
  } catch (error) {
    console.error("[dashboard/revenue GET]", error);
    return NextResponse.json({ error: "Failed to fetch revenue dashboard" }, { status: 500 });
  }
}
