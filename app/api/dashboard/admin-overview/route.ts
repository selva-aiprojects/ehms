export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id") || undefined;
    const sql = getDb();
    const param = propertyId || null;

    const [
      employeeRows,
      issueRows,
      roomRows,
      feedbackRows,
      revenueRows,
      expenseRows,
    ] = await Promise.all([
      // Employees available today — check today OR yesterday attendance, fallback to total active
      sql`
        SELECT
          COALESCE(
            (SELECT COUNT(*)::int FROM employees e WHERE e.is_active = true
              AND e.id IN (
                SELECT a.employee_id FROM attendance_records a
                WHERE (a.clock_in::date = CURRENT_DATE OR a.clock_in::date = CURRENT_DATE - 1)
                  AND a.status = 'present'
              )
              AND (${param}::uuid IS NULL OR e.department_id IN (
                SELECT d.id FROM departments d WHERE d.property_id = ${param}::uuid
              ))
            ),
            (SELECT COUNT(*)::int FROM employees e WHERE e.is_active = true
              AND (${param}::uuid IS NULL OR e.department_id IN (
                SELECT d.id FROM departments d WHERE d.property_id = ${param}::uuid
              ))
            )
          ) AS count
      `,
      // Outstanding issues by category
      sql`
        SELECT 'Vendor' AS category, COUNT(*)::int AS count
        FROM vendor_bills
        WHERE status IN ('pending', 'overdue')
          AND (${param}::uuid IS NULL OR property_id = ${param}::uuid)
        UNION ALL
        SELECT 'Housekeeping' AS category, COUNT(*)::int AS count
        FROM housekeeping_tasks
        WHERE status IN ('open', 'assigned', 'in_progress')
          AND (${param}::uuid IS NULL OR property_id = ${param}::uuid)
        UNION ALL
        SELECT 'Maintenance' AS category, COUNT(*)::int AS count
        FROM maintenance_tickets
        WHERE status IN ('open', 'assigned', 'in_progress')
          AND (${param}::uuid IS NULL OR property_id = ${param}::uuid)
        UNION ALL
        SELECT 'Other' AS category, COUNT(*)::int AS count
        FROM guest_requests
        WHERE status IN ('pending', 'in_progress')
          AND (${param}::uuid IS NULL OR property_id = ${param}::uuid)
      `,
      // Room status breakdown
      sql`
        SELECT
          u.status,
          COUNT(*)::int AS count
        FROM units u
        JOIN floors f ON f.id = u.floor_id
        JOIN buildings b ON b.id = f.building_id
        WHERE u.is_active = true
          AND (${param}::uuid IS NULL OR b.property_id = ${param}::uuid)
        GROUP BY u.status
      `,
      // Feedback counts by time period
      sql`
        SELECT
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int AS today,
          COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE))::int AS this_week,
          COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE))::int AS this_month,
          COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('year', CURRENT_DATE))::int AS this_year,
          COUNT(*)::int AS overall,
          ROUND(AVG(rating)::numeric, 1) AS avg_rating,
          ROUND(AVG(rating) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE))::numeric, 1) AS month_avg,
          ROUND(AVG(rating) FILTER (WHERE created_at >= DATE_TRUNC('year', CURRENT_DATE))::numeric, 1) AS year_avg
        FROM guest_feedbacks
        WHERE ${param}::uuid IS NULL OR property_id = ${param}::uuid
      `,
      // Revenue stats
      sql`
        SELECT
          COALESCE(SUM(amount) FILTER (WHERE payment_date::date = CURRENT_DATE), 0)::numeric AS today_revenue,
          COALESCE(SUM(amount) FILTER (WHERE payment_date >= DATE_TRUNC('week', CURRENT_DATE)), 0)::numeric AS week_revenue,
          COALESCE(SUM(amount) FILTER (WHERE payment_date >= DATE_TRUNC('month', CURRENT_DATE)), 0)::numeric AS month_revenue,
          COALESCE(SUM(amount) FILTER (WHERE payment_date >= DATE_TRUNC('year', CURRENT_DATE)), 0)::numeric AS year_revenue,
          COALESCE(SUM(amount), 0)::numeric AS total_revenue
        FROM payments
        WHERE status = 'completed'
          AND (${param}::uuid IS NULL OR property_id = ${param}::uuid)
      `,
      // Expense & financial stats — using grand_total for vendor_bills
      sql`
        SELECT
          COALESCE(SUM(grand_total) FILTER (WHERE created_at::date = CURRENT_DATE), 0)::numeric AS today_spending,
          COALESCE(SUM(grand_total) FILTER (WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)), 0)::numeric AS week_spending,
          COALESCE(SUM(grand_total) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)), 0)::numeric AS month_spending,
          COALESCE(SUM(grand_total) FILTER (WHERE created_at >= DATE_TRUNC('year', CURRENT_DATE)), 0)::numeric AS year_spending,
          COALESCE(SUM(balance_due), 0)::numeric AS expected_expenses,
          (
            SELECT COALESCE(SUM(amount), 0)::numeric
            FROM payments
            WHERE status = 'pending'
              AND (${param}::uuid IS NULL OR property_id = ${param}::uuid)
          ) AS expected_receivables
        FROM vendor_bills
        WHERE status IN ('pending', 'approved')
          AND (${param}::uuid IS NULL OR property_id = ${param}::uuid)
      `,
    ]);

    const employeesAvailable = (employeeRows[0] as any)?.count || 0;

    const issues = (issueRows as any[]).map((r: any) => ({
      category: r.category,
      count: r.count,
    }));

    const roomStatuses = (roomRows as any[]).map((r: any) => ({
      status: r.status === "vacant" ? "ready" : r.status,
      count: r.count,
    }));

    const feedback = feedbackRows[0] as any;
    const revenue = revenueRows[0] as any;
    const expenses = expenseRows[0] as any;

    const availableMoney = Math.max(0, Number(revenue.total_revenue || 0) - Number(expenses.expected_expenses || 0));

    return NextResponse.json({
      employeesAvailable,
      issues,
      rooms: roomStatuses,
      feedbacks: feedback ? {
        today: feedback.today,
        thisWeek: feedback.this_week,
        thisMonth: feedback.this_month,
        thisYear: feedback.this_year,
        overall: feedback.overall,
        avgRating: Number(feedback.avg_rating || 0),
        monthAvgRating: Number(feedback.month_avg || 0),
        yearAvgRating: Number(feedback.year_avg || 0),
      } : null,
      revenue: revenue ? {
        today: Number(revenue.today_revenue),
        week: Number(revenue.week_revenue),
        month: Number(revenue.month_revenue),
        year: Number(revenue.year_revenue),
        total: Number(revenue.total_revenue),
      } : null,
      financial: expenses ? {
        todaySpending: Number(expenses.today_spending),
        weekSpending: Number(expenses.week_spending),
        monthSpending: Number(expenses.month_spending),
        yearSpending: Number(expenses.year_spending),
        expectedExpenses: Number(expenses.expected_expenses),
        expectedReceivables: Number(expenses.expected_receivables),
        availableMoney,
      } : null,
    });
  } catch (error) {
    console.error("[admin-overview]", error);
    return NextResponse.json({ error: "Failed to fetch admin overview" }, { status: 500 });
  }
}
