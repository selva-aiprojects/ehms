export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess } from "@/lib/property-scope";

function getPeriodDates(period: string, customStart?: string, customEnd?: string) {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();
  let prevStartDate = new Date();
  let prevEndDate = new Date();

  const setMidnight = (d: Date) => {
    d.setHours(0, 0, 0, 0);
  };
  const setEndDay = (d: Date) => {
    d.setHours(23, 59, 59, 999);
  };

  if (period === "quarterly") {
    const q = Math.floor(now.getMonth() / 3);
    startDate = new Date(now.getFullYear(), q * 3, 1);
    endDate = new Date(now.getFullYear(), (q + 1) * 3, 0);

    prevStartDate = new Date(now.getFullYear(), (q - 1) * 3, 1);
    prevEndDate = new Date(now.getFullYear(), q * 3, 0);
  } else if (period === "half_yearly") {
    const h = Math.floor(now.getMonth() / 6);
    startDate = new Date(now.getFullYear(), h * 6, 1);
    endDate = new Date(now.getFullYear(), (h + 1) * 6, 0);

    prevStartDate = new Date(now.getFullYear(), (h - 1) * 6, 1);
    prevEndDate = new Date(now.getFullYear(), h * 6, 0);
  } else if (period === "annually") {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear(), 11, 31);

    prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
    prevEndDate = new Date(now.getFullYear() - 1, 11, 31);
  } else if (period === "custom" && customStart && customEnd) {
    startDate = new Date(customStart);
    endDate = new Date(customEnd);
    const diff = endDate.getTime() - startDate.getTime();
    prevStartDate = new Date(startDate.getTime() - diff - 86400000);
    prevEndDate = new Date(startDate.getTime() - 86400000);
  } else {
    // monthly (default)
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
  }

  setMidnight(startDate);
  setEndDay(endDate);
  setMidnight(prevStartDate);
  setEndDay(prevEndDate);

  return { startDate, endDate, prevStartDate, prevEndDate };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const period = searchParams.get("period") || "monthly";
    const customStart = searchParams.get("start_date") || undefined;
    const customEnd = searchParams.get("end_date") || undefined;

    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;
    const sql = getDb();

    // Property where clause
    let propWhere = "1=1";
    const baseParams: unknown[] = [];
    if (propertyId) {
      propWhere = `property_id = $1::uuid`;
      baseParams.push(propertyId);
    } else if (scope.assignedPropertyIds.length > 0) {
      propWhere = `property_id = ANY($1::text[])`;
      baseParams.push(scope.assignedPropertyIds);
    }

    const { startDate, endDate, prevStartDate, prevEndDate } = getPeriodDates(period, customStart, customEnd);

    // Dynamic parameter indices helper
    const buildParams = (start: Date, end: Date) => {
      const arr = [...baseParams];
      arr.push(start);
      arr.push(end);
      return arr;
    };

    const paramIdxs = {
      prop: propertyId || scope.assignedPropertyIds.length > 0 ? "$1" : "",
      start: propertyId || scope.assignedPropertyIds.length > 0 ? "$2" : "$1",
      end: propertyId || scope.assignedPropertyIds.length > 0 ? "$3" : "$2",
    };

    const hasFilter = !!propertyId || scope.assignedPropertyIds.length > 0;
    const unitsPropFilter = hasFilter
      ? `floor_id IN (SELECT f.id FROM floors f JOIN buildings b ON b.id = f.building_id WHERE ${propWhere})`
      : "1=1";

    // Helper to query statistics for a given date range
    async function queryStatsForRange(start: Date, end: Date) {
      const qParams = buildParams(start, end);
      const startIdx = paramIdxs.start;
      const endIdx = paramIdxs.end;

      const [summary, expenses, channels, ratings] = await Promise.all([
        sql.query(`
          SELECT
            (SELECT COUNT(*)::int FROM bookings WHERE ${propWhere} AND check_in BETWEEN ${startIdx} AND ${endIdx}) AS total_bookings,
            (SELECT COUNT(*)::int FROM bookings WHERE status = 'checked_in' AND ${propWhere} AND check_in <= ${endIdx}) AS checked_in,
            (SELECT COUNT(DISTINCT guest_id)::int FROM bookings WHERE ${propWhere} AND check_in BETWEEN ${startIdx} AND ${endIdx}) AS total_guests,
            COALESCE((SELECT SUM(amount)::numeric FROM payments WHERE status = 'completed' AND ${propWhere} AND payment_date BETWEEN ${startIdx} AND ${endIdx}), 0) AS total_revenue,
            (SELECT COALESCE(SUM(balance_due),0)::numeric FROM vendor_bills WHERE status IN ('pending', 'approved', 'overdue') AND ${propWhere} AND due_date BETWEEN ${startIdx} AND ${endIdx}) AS total_payables,
            (SELECT COALESCE(ROUND(AVG(rating), 1), 0.0)::numeric FROM guest_feedbacks WHERE ${propWhere} AND created_at BETWEEN ${startIdx} AND ${endIdx}) AS avg_rating,
            (SELECT COUNT(*)::int FROM units WHERE ${unitsPropFilter}) AS total_units,
            (SELECT COUNT(*)::int FROM units WHERE status = 'occupied' AND ${unitsPropFilter}) AS occupied_units
        `, qParams),

        sql.query(`
          SELECT category, COALESCE(SUM(grand_total), 0)::numeric AS amount
          FROM vendor_bills
          WHERE ${propWhere} AND status IN ('pending', 'approved', 'paid', 'overdue') AND bill_date BETWEEN ${startIdx} AND ${endIdx}
          GROUP BY category
        `, qParams),

        sql.query(`
          SELECT source, COUNT(*)::int AS count
          FROM bookings
          WHERE ${propWhere} AND check_in BETWEEN ${startIdx} AND ${endIdx}
          GROUP BY source
        `, qParams),

        sql.query(`
          SELECT rating, COUNT(*)::int AS count
          FROM guest_feedbacks
          WHERE ${propWhere} AND created_at BETWEEN ${startIdx} AND ${endIdx}
          GROUP BY rating
        `, qParams),
      ]);

      const s = summary[0] as any;
      const totalUnits = s.total_units || 0;
      const occupiedUnits = s.occupied_units || 0;
      const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

      // Group expenses
      const expenseMap = { salary: 0, maintenance: 0, subscriptions: 0, utilities: 0, other: 0 };
      (expenses as { category: string; amount: string }[]).forEach(e => {
        const cat = (e.category || "").toLowerCase();
        const amt = Number(e.amount || 0);
        if (cat.includes("salary") || cat.includes("payroll") || cat.includes("staff")) {
          expenseMap.salary += amt;
        } else if (cat.includes("maint") || cat.includes("repair")) {
          expenseMap.maintenance += amt;
        } else if (cat.includes("sub") || cat.includes("licens")) {
          expenseMap.subscriptions += amt;
        } else if (cat.includes("util") || cat.includes("elect") || cat.includes("water") || cat.includes("gas") || cat.includes("rent")) {
          expenseMap.utilities += amt;
        } else {
          expenseMap.other += amt;
        }
      });
      const totalExpenses = Object.values(expenseMap).reduce((a, b) => a + b, 0);

      // Group booking channels
      const channelMap = { channelPartners: 0, direct: 0, walkins: 0 };
      (channels as { source: string; count: number }[]).forEach(c => {
        const src = (c.source || "").toLowerCase();
        const cnt = c.count || 0;
        if (src.includes("walkin") || src.includes("walk-in") || src.includes("walk_in")) {
          channelMap.walkins += cnt;
        } else if (src.includes("direct") || src.includes("website") || src.includes("portal") || src.includes("social")) {
          channelMap.direct += cnt;
        } else {
          channelMap.channelPartners += cnt;
        }
      });

      // Group ratings
      let positiveCount = 0;
      let totalRatings = 0;
      (ratings as { rating: number; count: number }[]).forEach(r => {
        const rating = Number(r.rating);
        const cnt = r.count || 0;
        totalRatings += cnt;
        if (rating >= 4) {
          positiveCount += cnt;
        }
      });
      const positiveRatingPct = totalRatings > 0 ? Math.round((positiveCount / totalRatings) * 100) : 0;

      return {
        bookings: s.total_bookings || 0,
        checkedIn: s.checked_in || 0,
        guests: s.total_guests || 0,
        revenue: Number(s.total_revenue || 0),
        payables: Number(s.total_payables || 0),
        avgRating: Number(s.avg_rating || 0),
        occupancyRate,
        expenses: { ...expenseMap, total: totalExpenses },
        channels: channelMap,
        positiveRatingPct,
      };
    }

    const [currentStats, previousStats] = await Promise.all([
      queryStatsForRange(startDate, endDate),
      queryStatsForRange(prevStartDate, prevEndDate),
    ]);

    // Build chart data based on period
    const rangeDiff = endDate.getTime() - startDate.getTime();
    const dayMs = 86400000;
    const isDaily = period === "monthly" || (period === "custom" && rangeDiff <= 31 * dayMs);

    let chartData: { label: string; revenue: number; expenses: number }[] = [];

    if (isDaily) {
      const cpParams = buildParams(startDate, endDate);
      const startIdx = paramIdxs.start;
      const endIdx = paramIdxs.end;

      const [dailyRevenueRows, dailyExpenseRows] = await Promise.all([
        sql.query(`
          SELECT TO_CHAR(payment_date, 'YYYY-MM-DD') AS key, SUM(amount)::numeric AS amount
          FROM payments
          WHERE status = 'completed' AND ${propWhere} AND payment_date BETWEEN ${startIdx} AND ${endIdx}
          GROUP BY 1
        `, cpParams),
        sql.query(`
          SELECT TO_CHAR(bill_date, 'YYYY-MM-DD') AS key, SUM(grand_total)::numeric AS amount
          FROM vendor_bills
          WHERE status IN ('pending', 'approved', 'paid', 'overdue') AND ${propWhere} AND bill_date BETWEEN ${startIdx} AND ${endIdx}
          GROUP BY 1
        `, cpParams),
      ]);

      const revMap: Record<string, number> = {};
      const expMap: Record<string, number> = {};
      (dailyRevenueRows as { key: string; amount: string }[]).forEach(r => revMap[r.key] = Number(r.amount));
      (dailyExpenseRows as { key: string; amount: string }[]).forEach(r => expMap[r.key] = Number(r.amount));

      // Loop days
      const daysCount = Math.min(Math.round(rangeDiff / dayMs) + 1, 31);
      chartData = Array.from({ length: daysCount }, (_, idx) => {
        const d = new Date(startDate.getTime() + idx * dayMs);
        const iso = d.toISOString().slice(0, 10);
        return {
          label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
          revenue: revMap[iso] || 0,
          expenses: expMap[iso] || 0,
        };
      });
    } else {
      const cpParams = buildParams(startDate, endDate);
      const startIdx = paramIdxs.start;
      const endIdx = paramIdxs.end;

      const [monthlyRevenueRows, monthlyExpenseRows] = await Promise.all([
        sql.query(`
          SELECT TO_CHAR(payment_date, 'YYYY-MM') AS key, SUM(amount)::numeric AS amount
          FROM payments
          WHERE status = 'completed' AND ${propWhere} AND payment_date BETWEEN ${startIdx} AND ${endIdx}
          GROUP BY 1
        `, cpParams),
        sql.query(`
          SELECT TO_CHAR(bill_date, 'YYYY-MM') AS key, SUM(grand_total)::numeric AS amount
          FROM vendor_bills
          WHERE status IN ('pending', 'approved', 'paid', 'overdue') AND ${propWhere} AND bill_date BETWEEN ${startIdx} AND ${endIdx}
          GROUP BY 1
        `, cpParams),
      ]);

      const revMap: Record<string, number> = {};
      const expMap: Record<string, number> = {};
      (monthlyRevenueRows as { key: string; amount: string }[]).forEach(r => revMap[r.key] = Number(r.amount));
      (monthlyExpenseRows as { key: string; amount: string }[]).forEach(r => expMap[r.key] = Number(r.amount));

      // Month intervals
      const startMonth = startDate.getFullYear() * 12 + startDate.getMonth();
      const endMonth = endDate.getFullYear() * 12 + endDate.getMonth();
      const monthDiff = endMonth - startMonth + 1;

      chartData = Array.from({ length: monthDiff }, (_, idx) => {
        const year = Math.floor((startMonth + idx) / 12);
        const month = (startMonth + idx) % 12;
        const d = new Date(year, month, 1);
        const key = `${year}-${String(month + 1).padStart(2, "0")}`;
        return {
          label: d.toLocaleString("default", { month: "short", year: "2-digit" }),
          revenue: revMap[key] || 0,
          expenses: expMap[key] || 0,
        };
      });
    }

    return NextResponse.json({
      current: currentStats,
      previous: previousStats,
      chartData,
    });
  } catch (error) {
    console.error("[stats]", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
