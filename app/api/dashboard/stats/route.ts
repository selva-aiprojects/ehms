export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id") || undefined;
    const sql = getDb();

    const param = propertyId || null;
    const [globalStatsRows, monthlyRows] = await Promise.all([
      sql`
        SELECT
          (SELECT COUNT(*)::int FROM bookings WHERE (${param}::uuid IS NULL OR property_id = ${param}::uuid)) AS total_bookings,
          (SELECT COUNT(*)::int FROM bookings WHERE status = 'checked_in' AND (${param}::uuid IS NULL OR property_id = ${param}::uuid)) AS checked_in,
          (
            CASE 
              WHEN ${param}::uuid IS NOT NULL THEN (SELECT COUNT(DISTINCT guest_id)::int FROM bookings WHERE property_id = ${param}::uuid)
              ELSE (SELECT COUNT(*)::int FROM guest_profiles)
            END
          ) AS total_guests,
          (SELECT COALESCE(SUM(amount),0)::numeric FROM payments WHERE status = 'completed' AND (${param}::uuid IS NULL OR property_id = ${param}::uuid)) AS total_revenue,
          (SELECT COALESCE(SUM(balance_due),0)::numeric FROM vendor_bills WHERE status IN ('pending', 'approved', 'overdue') AND (${param}::uuid IS NULL OR property_id = ${param}::uuid)) AS total_payables,
          (SELECT COALESCE(ROUND(AVG(rating), 1), 0.0)::numeric FROM guest_feedbacks WHERE (${param}::uuid IS NULL OR property_id = ${param}::uuid)) AS avg_rating,
          (SELECT COUNT(*)::int FROM units WHERE (${param}::uuid IS NULL OR property_id = ${param}::uuid)) AS total_units,
          (SELECT COUNT(*)::int FROM units WHERE status = 'occupied' AND (${param}::uuid IS NULL OR property_id = ${param}::uuid)) AS occupied_units
      `,
      sql`
        SELECT
          TO_CHAR(payment_date, 'YYYY-MM') AS month,
          SUM(amount)::numeric             AS revenue
        FROM payments
        WHERE status = 'completed'
          AND payment_date >= NOW() - INTERVAL '11 months'
          AND (${param}::uuid IS NULL OR property_id = ${param}::uuid)
        GROUP BY 1
        ORDER BY 1
      `,
    ]);

    const globalStats = globalStatsRows[0] as any;
    const total_bookings = globalStats.total_bookings || 0;
    const checked_in = globalStats.checked_in || 0;
    const totalGuests = globalStats.total_guests || 0;
    const totalRevenue = Number(globalStats.total_revenue || 0);
    const totalPayables = Number(globalStats.total_payables || 0);
    const avgRating = Number(globalStats.avg_rating || 0);

    const totalUnits = globalStats.total_units || 0;
    const occupiedUnits = globalStats.occupied_units || 0;
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    // Build last-12-month chart data
    const monthMap: Record<string, number> = {};
    (monthlyRows as { month: string; revenue: string }[]).forEach(r => {
      monthMap[r.month] = Number(r.revenue);
    });

    const chartData = Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (11 - i));
      const key = d.toISOString().slice(0, 7);
      return {
        month: d.toLocaleString("default", { month: "short" }),
        revenue: monthMap[key] || 0,
      };
    });

    return NextResponse.json({
      totalBookings: total_bookings,
      checkedIn: checked_in,
      totalGuests,
      totalRevenue,
      totalPayables,
      avgRating,
      occupancyRate,
      chartData,
    });
  } catch (error) {
    console.error("[stats]", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
