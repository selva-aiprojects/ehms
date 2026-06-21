export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const sql = getDb();

    const [globalStatsRows, monthlyRows] = await Promise.all([
      sql`
        SELECT
          (SELECT COUNT(*)::int FROM bookings) AS total_bookings,
          (SELECT COUNT(*)::int FROM bookings WHERE status = 'checked_in') AS checked_in,
          (SELECT COUNT(*)::int FROM guest_profiles) AS total_guests,
          (SELECT COALESCE(SUM(amount),0)::numeric FROM payments WHERE status = 'completed') AS total_revenue,
          (SELECT COUNT(*)::int FROM units) AS total_units,
          (SELECT COUNT(*)::int FROM units WHERE status = 'occupied') AS occupied_units
      `,
      sql`
        SELECT
          TO_CHAR(payment_date, 'YYYY-MM') AS month,
          SUM(amount)::numeric             AS revenue
        FROM payments
        WHERE status = 'completed'
          AND payment_date >= NOW() - INTERVAL '11 months'
        GROUP BY 1
        ORDER BY 1
      `,
    ]);

    const globalStats = globalStatsRows[0] as any;
    const total_bookings = globalStats.total_bookings || 0;
    const checked_in = globalStats.checked_in || 0;
    const totalGuests = globalStats.total_guests || 0;
    const totalRevenue = Number(globalStats.total_revenue || 0);

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
      occupancyRate,
      chartData,
    });
  } catch (error) {
    console.error("[stats]", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
