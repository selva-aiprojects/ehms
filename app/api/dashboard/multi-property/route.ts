import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const groupId = url.searchParams.get("group_id");
    const days = parseInt(url.searchParams.get("days") || "7");
    const sql = getDb();

    const properties = groupId
      ? await sql`SELECT id, name, group_id FROM properties WHERE group_id = ${groupId} ORDER BY name`
      : await sql`SELECT id, name, group_id FROM properties ORDER BY name`;

    const occupancyResult = groupId
      ? await sql`
          SELECT p.id AS property_id, p.name AS property_name,
            COALESCE(s.occupied_rooms, 0) AS occupied, COALESCE(s.total_rooms, 0) AS total_rooms,
            COALESCE(s.occupancy_pct, 0) AS occupancy, COALESCE(s.adr, 0) AS adr,
            COALESCE(s.revpar, 0) AS revpar, COALESCE(s.total_revenue, 0) AS revenue,
            COALESCE(s.checkins, 0) AS checkins, COALESCE(s.checkouts, 0) AS checkouts
          FROM properties p
          LEFT JOIN property_daily_snapshots s ON s.property_id = p.id AND s.snapshot_date = CURRENT_DATE - 1
          WHERE p.group_id = ${groupId} ORDER BY p.name
        `
      : await sql`
          SELECT p.id AS property_id, p.name AS property_name,
            COALESCE(s.occupied_rooms, 0) AS occupied, COALESCE(s.total_rooms, 0) AS total_rooms,
            COALESCE(s.occupancy_pct, 0) AS occupancy, COALESCE(s.adr, 0) AS adr,
            COALESCE(s.revpar, 0) AS revpar, COALESCE(s.total_revenue, 0) AS revenue,
            COALESCE(s.checkins, 0) AS checkins, COALESCE(s.checkouts, 0) AS checkouts
          FROM properties p
          LEFT JOIN property_daily_snapshots s ON s.property_id = p.id AND s.snapshot_date = CURRENT_DATE - 1
          ORDER BY p.name
        `;

    const trendResult = groupId
      ? await sql`
          SELECT p.id AS property_id, p.name AS property_name, s.snapshot_date,
            COALESCE(s.occupancy_pct, 0) AS occupancy, COALESCE(s.total_revenue, 0) AS revenue,
            COALESCE(s.adr, 0) AS adr, COALESCE(s.revpar, 0) AS revpar
          FROM properties p
          LEFT JOIN property_daily_snapshots s ON s.property_id = p.id
            AND s.snapshot_date >= CURRENT_DATE - ${days}::int * INTERVAL '1 day'
          WHERE p.group_id = ${groupId} ORDER BY p.name, s.snapshot_date
        `
      : await sql`
          SELECT p.id AS property_id, p.name AS property_name, s.snapshot_date,
            COALESCE(s.occupancy_pct, 0) AS occupancy, COALESCE(s.total_revenue, 0) AS revenue,
            COALESCE(s.adr, 0) AS adr, COALESCE(s.revpar, 0) AS revpar
          FROM properties p
          LEFT JOIN property_daily_snapshots s ON s.property_id = p.id
            AND s.snapshot_date >= CURRENT_DATE - ${days}::int * INTERVAL '1 day'
          ORDER BY p.name, s.snapshot_date
        `;

    const totals = occupancyResult.reduce<{ totalRooms: number; occupied: number; revenue: number; checkins: number; checkouts: number }>((acc, r: any) => ({
      totalRooms: acc.totalRooms + Number(r.total_rooms),
      occupied: acc.occupied + Number(r.occupied),
      revenue: acc.revenue + Number(r.revenue),
      checkins: acc.checkins + Number(r.checkins),
      checkouts: acc.checkouts + Number(r.checkouts),
    }), { totalRooms: 0, occupied: 0, revenue: 0, checkins: 0, checkouts: 0 });

    const avgOccupancy = totals.totalRooms > 0 ? (totals.occupied / totals.totalRooms * 100).toFixed(1) : "0";

    return NextResponse.json({
      summary: {
        propertyCount: properties.length,
        totalRooms: totals.totalRooms,
        occupied: totals.occupied,
        avgOccupancy: parseFloat(avgOccupancy),
        totalRevenue: totals.revenue,
        totalCheckins: totals.checkins,
        totalCheckouts: totals.checkouts,
      },
      properties: occupancyResult,
      trend: trendResult,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
