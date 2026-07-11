export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess } from "@/lib/property-scope";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;
    const sql = getDb();

    // Build WHERE clause as raw SQL (Neon tagged templates can't compose nested fragments)
    let propWhere = "1=1";
    const params: unknown[] = [];
    let idx = 1;
    if (propertyId) {
      propWhere = `property_id = $${idx++}::uuid`;
      params.push(propertyId);
    } else if (scope.assignedPropertyIds.length > 0) {
      propWhere = `property_id = ANY($${idx++}::text[])`;
      params.push(scope.assignedPropertyIds);
    }

    const hasFilter = !!propertyId || scope.assignedPropertyIds.length > 0;

    // Units subquery: if no property filter, count all; otherwise filter by property via buildings
    const unitsPropFilter = hasFilter
      ? `floor_id IN (SELECT f.id FROM floors f JOIN buildings b ON b.id = f.building_id WHERE ${propWhere})`
      : "1=1";

    const [globalStatsRows, monthlyRows] = await Promise.all([
      sql.query(`
        SELECT
          (SELECT COUNT(*)::int FROM bookings WHERE ${propWhere}) AS total_bookings,
          (SELECT COUNT(*)::int FROM bookings WHERE status = 'checked_in' AND ${propWhere}) AS checked_in,
          (SELECT COUNT(DISTINCT guest_id)::int FROM bookings WHERE ${propWhere}) AS total_guests,
          COALESCE(
            NULLIF((SELECT SUM(amount)::numeric FROM payments WHERE status = 'completed' AND ${propWhere}), 0),
            (SELECT COALESCE(SUM(paid_amount),0)::numeric FROM bookings WHERE paid_amount > 0 AND status IN ('checked_out','checked_in') AND ${propWhere})
          ) AS total_revenue,
          (SELECT COALESCE(SUM(balance_due),0)::numeric FROM vendor_bills WHERE status IN ('pending', 'approved', 'overdue') AND ${propWhere}) AS total_payables,
          (SELECT COALESCE(ROUND(AVG(rating), 1), 0.0)::numeric FROM guest_feedbacks WHERE ${propWhere}) AS avg_rating,
          (SELECT COUNT(*)::int FROM units WHERE ${unitsPropFilter}) AS total_units,
          (SELECT COUNT(*)::int FROM units WHERE status = 'occupied' AND ${unitsPropFilter}) AS occupied_units
      `, params),
      sql.query(`
        SELECT month, SUM(revenue)::numeric AS revenue FROM (
          SELECT TO_CHAR(payment_date, 'YYYY-MM') AS month, SUM(amount) AS revenue
          FROM payments
          WHERE status = 'completed'
            AND payment_date >= NOW() - INTERVAL '11 months'
            AND ${propWhere}
          GROUP BY 1
          UNION ALL
          SELECT TO_CHAR(check_in, 'YYYY-MM') AS month, SUM(paid_amount) AS revenue
          FROM bookings
          WHERE paid_amount > 0 AND status IN ('checked_out', 'checked_in')
            AND check_in >= NOW() - INTERVAL '11 months'
            AND ${propWhere}
            AND NOT EXISTS (
              SELECT 1 FROM payments p2
              WHERE p2.status = 'completed'
                AND TO_CHAR(p2.payment_date, 'YYYY-MM') = TO_CHAR(bookings.check_in, 'YYYY-MM')
                AND ${propWhere}
            )
          GROUP BY 1
        ) combined
        GROUP BY month ORDER BY month
      `, params),
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
