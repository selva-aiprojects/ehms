import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const sql = getDb();

    const [bookingStats, guestCount, revenueRows, occupancyRows, monthlyRows] = await Promise.all([
      sql`
        SELECT
          COUNT(*)::int                                          AS total_bookings,
          COUNT(*) FILTER (WHERE status = 'checked_in')::int    AS checked_in
        FROM bookings
      `,
      sql`SELECT COUNT(*)::int AS total_guests FROM guest_profiles`,
      sql`SELECT COALESCE(SUM(amount),0)::numeric AS total_revenue FROM payments WHERE status = 'completed'`,
      sql`SELECT status FROM units`,
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

    const { total_bookings, checked_in } = bookingStats[0] as { total_bookings: number; checked_in: number };
    const totalGuests = (guestCount[0] as { total_guests: number }).total_guests;
    const totalRevenue = Number((revenueRows[0] as { total_revenue: string }).total_revenue);

    const units = occupancyRows as { status: string }[];
    const totalUnits = units.length;
    const occupiedUnits = units.filter(u => u.status === "occupied").length;
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
