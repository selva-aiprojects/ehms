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

    const propFilter = propertyId
      ? sql`property_id = ${propertyId}::uuid`
      : scope.assignedPropertyIds.length > 0
        ? sql`property_id = ANY(${scope.assignedPropertyIds}::uuid[])`
        : sql`true`;
    const [globalStatsRows, monthlyRows] = await Promise.all([
      sql`
        SELECT
          (SELECT COUNT(*)::int FROM bookings WHERE (${propFilter})) AS total_bookings,
          (SELECT COUNT(*)::int FROM bookings WHERE status = 'checked_in' AND (${propFilter})) AS checked_in,
          (
            CASE 
              WHEN ${propertyId || scope.assignedPropertyIds.length > 0} THEN (SELECT COUNT(DISTINCT guest_id)::int FROM bookings WHERE (${propFilter}))
              ELSE (SELECT COUNT(*)::int FROM guest_profiles)
            END
          ) AS total_guests,
          -- Revenue: prefer payments table, fall back to bookings.paid_amount
          COALESCE(
            NULLIF((SELECT SUM(amount)::numeric FROM payments WHERE status = 'completed' AND (${propFilter})), 0),
            (SELECT COALESCE(SUM(paid_amount),0)::numeric FROM bookings WHERE paid_amount > 0 AND status IN ('checked_out','checked_in') AND (${propFilter}))
          ) AS total_revenue,
          (SELECT COALESCE(SUM(balance_due),0)::numeric FROM vendor_bills WHERE status IN ('pending', 'approved', 'overdue') AND (${propFilter})) AS total_payables,
          (SELECT COALESCE(ROUND(AVG(rating), 1), 0.0)::numeric FROM guest_feedbacks WHERE (${propFilter})) AS avg_rating,
          (
            SELECT COUNT(*)::int 
            FROM units 
            WHERE ${propertyId || scope.assignedPropertyIds.length > 0} IS NOT TRUE 
              OR floor_id IN (
                SELECT f.id FROM floors f JOIN buildings b ON b.id = f.building_id WHERE (${propFilter})
              )
          ) AS total_units,
          (
            SELECT COUNT(*)::int 
            FROM units 
            WHERE status = 'occupied'
              AND (${propertyId || scope.assignedPropertyIds.length > 0} IS NOT TRUE 
                OR floor_id IN (
                  SELECT f.id FROM floors f JOIN buildings b ON b.id = f.building_id WHERE (${propFilter})
                ))
          ) AS occupied_units
      `,
      sql`
        SELECT month, SUM(revenue)::numeric AS revenue FROM (
          SELECT TO_CHAR(payment_date, 'YYYY-MM') AS month, SUM(amount) AS revenue
          FROM payments
          WHERE status = 'completed'
            AND payment_date >= NOW() - INTERVAL '11 months'
            AND (${propFilter})
          GROUP BY 1
          UNION ALL
          SELECT TO_CHAR(check_in, 'YYYY-MM') AS month, SUM(paid_amount) AS revenue
          FROM bookings
          WHERE paid_amount > 0 AND status IN ('checked_out', 'checked_in')
            AND check_in >= NOW() - INTERVAL '11 months'
            AND (${propFilter})
            AND NOT EXISTS (
              SELECT 1 FROM payments p2
              WHERE p2.status = 'completed'
                AND TO_CHAR(p2.payment_date, 'YYYY-MM') = TO_CHAR(bookings.check_in, 'YYYY-MM')
                AND (${propFilter})
            )
          GROUP BY 1
        ) combined
        GROUP BY month ORDER BY month
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
