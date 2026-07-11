import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const propertyId = req.nextUrl.searchParams.get("property_id");
    const sql = getDb();

    // Recent bookings (check-ins and check-outs today)
    const bookingFilter = propertyId ? sql`AND b.property_id = ${propertyId}` : sql``;
    const recentBookings = await sql`
      SELECT b.id, b.status, b.created_at, b.checked_in_at, b.checked_out_at, b.property_id,
        u.unit_label,
        COALESCE(gp.first_name || ' ' || gp.last_name, 'Guest') as guest_name
      FROM viswa.bookings b
      JOIN viswa.units u ON u.id = b.unit_id
      LEFT JOIN viswa.booking_guests bg ON bg.booking_id = b.id AND bg.is_primary = true
      LEFT JOIN viswa.guest_profiles gp ON gp.id = bg.guest_id
      WHERE (b.checked_in_at::date = CURRENT_DATE OR b.checked_out_at::date = CURRENT_DATE OR b.created_at::date = CURRENT_DATE)
      ${bookingFilter}
      ORDER BY COALESCE(b.checked_in_at, b.checked_out_at, b.created_at) DESC
      LIMIT 10
    `;

    // Recent guest requests
    const reqFilter = propertyId ? sql`AND gr.property_id = ${propertyId}` : sql``;
    const recentRequests = await sql`
      SELECT gr.id, gr.request_type, gr.description, gr.status, gr.assigned_to_dept, gr.created_at,
        u.unit_label
      FROM viswa.guest_requests gr
      JOIN viswa.bookings b ON b.id = gr.booking_id
      LEFT JOIN viswa.units u ON u.id = b.unit_id
      WHERE gr.created_at >= CURRENT_DATE - INTERVAL '1 day'
      ${reqFilter}
      ORDER BY gr.created_at DESC
      LIMIT 10
    `;

    // Recent housekeeping updates
    const hkFilter = propertyId ? sql`AND ht.property_id = ${propertyId}` : sql``;
    const recentHK = await sql`
      SELECT ht.id, ht.task_type, ht.status, ht.priority, ht.created_at,
        u.unit_label
      FROM viswa.housekeeping_tasks ht
      LEFT JOIN viswa.units u ON u.id = ht.unit_id
      WHERE ht.created_at >= CURRENT_DATE - INTERVAL '1 day'
      ${hkFilter}
      ORDER BY ht.created_at DESC
      LIMIT 5
    `;

    // Recent maintenance
    const mtFilter = propertyId ? sql`AND mt.property_id = ${propertyId}` : sql``;
    const recentMaint = await sql`
      SELECT mt.id, mt.title, mt.status, mt.priority, mt.created_at,
        u.unit_label
      FROM viswa.maintenance_tickets mt
      LEFT JOIN viswa.units u ON u.id = mt.unit_id
      WHERE mt.created_at >= CURRENT_DATE - INTERVAL '1 day'
      ${mtFilter}
      ORDER BY mt.created_at DESC
      LIMIT 5
    `;

    // Room metrics (compute from room matrix)
    const metricFilter = propertyId ? sql`AND b.property_id = ${propertyId}` : sql``;
    const occupancyData = await sql`
      SELECT 
        COUNT(*) as total_rooms,
        COUNT(CASE WHEN u.status = 'occupied' THEN 1 END) as occupied,
        COUNT(CASE WHEN u.status = 'vacant' THEN 1 END) as vacant,
        COUNT(CASE WHEN u.status IN ('dirty', 'cleaning') THEN 1 END) as dirty,
        COUNT(CASE WHEN u.status = 'maintenance' THEN 1 END) as maint
      FROM viswa.units u
      JOIN viswa.floors f ON f.id = u.floor_id
      JOIN viswa.buildings bld ON bld.id = f.building_id
      WHERE u.is_active = true
      ${propertyId ? sql`AND bld.property_id = ${propertyId}` : sql``}
    `;

    // Amenity requests count
    const amenityCount = await sql`
      SELECT COUNT(*) as total, 
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
      FROM viswa.guest_requests
      WHERE created_at >= CURRENT_DATE
      ${propertyId ? sql`AND property_id = ${propertyId}` : sql``}
    `;

    // Room service orders count (from F&B)
    const fbOrders = await sql`
      SELECT COUNT(*) as total,
        COUNT(CASE WHEN status IN ('preparing', 'ready') THEN 1 END) as in_progress
      FROM viswa.f_and_b_orders
      WHERE ordered_at >= CURRENT_DATE
      ${propertyId ? sql`AND property_id = ${propertyId}` : sql``}
    `;

    // Revenue today
    const revenueData = await sql`
      SELECT COALESCE(SUM(total_amount), 0) as revenue, COUNT(*) as bookings_today
      FROM viswa.bookings
      WHERE created_at::date = CURRENT_DATE
      ${propertyId ? sql`AND property_id = ${propertyId}` : sql``}
    `;

    return NextResponse.json({
      recentBookings,
      recentRequests,
      recentHK,
      recentMaint,
      occupancy: occupancyData[0] || { total_rooms: 0, occupied: 0, vacant: 0, dirty: 0, maint: 0 },
      amenityRequests: amenityCount[0] || { total: 0, pending: 0 },
      fbOrders: fbOrders[0] || { total: 0, in_progress: 0 },
      revenue: revenueData[0] || { revenue: 0, bookings_today: 0 },
    });
  } catch (error: any) {
    console.error("[front-desk/dashboard]", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
