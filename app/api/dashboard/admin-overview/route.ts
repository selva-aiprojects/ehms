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
      vendorBillDetailRows,
      hkTaskDetailRows,
      maintTicketDetailRows,
      guestRequestDetailRows,
      feedbackDetailRows,
      paymentDetailRows,
      expenseDetailRows,
      employeeDetailRows,
      roomDetailRows,
    ] = await Promise.all([
      // Employees count
      sql`
        SELECT COUNT(*)::int AS count
        FROM employees e
        WHERE e.is_active = true
          AND (${param}::uuid IS NULL OR e.department_id IN (
            SELECT d.id FROM departments d WHERE d.property_id = ${param}::uuid
          ))
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
      // Revenue stats — prefer payments table; fall back to bookings.paid_amount
      sql`
        SELECT
          COALESCE(
            NULLIF(SUM(amount) FILTER (WHERE payment_date::date = CURRENT_DATE), 0),
            (SELECT COALESCE(SUM(paid_amount),0) FROM bookings
             WHERE check_in::date = CURRENT_DATE AND status IN ('checked_out','checked_in')
               AND (${param}::uuid IS NULL OR property_id = ${param}::uuid))
          )::numeric AS today_revenue,
          COALESCE(
            NULLIF(SUM(amount) FILTER (WHERE payment_date >= DATE_TRUNC('week', CURRENT_DATE)), 0),
            (SELECT COALESCE(SUM(paid_amount),0) FROM bookings
             WHERE check_in >= DATE_TRUNC('week', CURRENT_DATE) AND status IN ('checked_out','checked_in')
               AND (${param}::uuid IS NULL OR property_id = ${param}::uuid))
          )::numeric AS week_revenue,
          COALESCE(
            NULLIF(SUM(amount) FILTER (WHERE payment_date >= DATE_TRUNC('month', CURRENT_DATE)), 0),
            (SELECT COALESCE(SUM(paid_amount),0) FROM bookings
             WHERE check_in >= DATE_TRUNC('month', CURRENT_DATE) AND status IN ('checked_out','checked_in')
               AND (${param}::uuid IS NULL OR property_id = ${param}::uuid))
          )::numeric AS month_revenue,
          COALESCE(
            NULLIF(SUM(amount) FILTER (WHERE payment_date >= DATE_TRUNC('year', CURRENT_DATE)), 0),
            (SELECT COALESCE(SUM(paid_amount),0) FROM bookings
             WHERE check_in >= DATE_TRUNC('year', CURRENT_DATE) AND status IN ('checked_out','checked_in')
               AND (${param}::uuid IS NULL OR property_id = ${param}::uuid))
          )::numeric AS year_revenue,
          COALESCE(
            NULLIF(SUM(amount), 0),
            (SELECT COALESCE(SUM(paid_amount),0) FROM bookings
             WHERE paid_amount > 0 AND status IN ('checked_out','checked_in')
               AND (${param}::uuid IS NULL OR property_id = ${param}::uuid))
          )::numeric AS total_revenue
        FROM payments
        WHERE status = 'completed'
          AND (${param}::uuid IS NULL OR property_id = ${param}::uuid)
      `,
      // Expense & financial stats
      sql`
        SELECT
          COALESCE(SUM(grand_total) FILTER (WHERE bill_date = CURRENT_DATE), 0)::numeric AS today_spending,
          COALESCE(SUM(grand_total) FILTER (WHERE bill_date >= DATE_TRUNC('week', CURRENT_DATE)), 0)::numeric AS week_spending,
          COALESCE(SUM(grand_total) FILTER (WHERE bill_date >= DATE_TRUNC('month', CURRENT_DATE)), 0)::numeric AS month_spending,
          COALESCE(SUM(grand_total) FILTER (WHERE bill_date >= DATE_TRUNC('year', CURRENT_DATE)), 0)::numeric AS year_spending,
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
      // Drill-down: Vendor bills detail (top 15 pending)
      sql`
        SELECT vb.bill_number, vb.bill_date, vb.due_date, vb.grand_total, vb.status,
          COALESCE(v.company_name, 'Unknown Vendor') AS vendor_name
        FROM vendor_bills vb
        LEFT JOIN vendors v ON v.id = vb.vendor_id
        WHERE vb.status IN ('pending', 'overdue')
          AND (${param}::uuid IS NULL OR vb.property_id = ${param}::uuid)
        ORDER BY vb.due_date ASC
        LIMIT 15
      `,
      // Drill-down: Housekeeping tasks detail (top 15 open)
      sql`
        SELECT h.task_type, h.priority, h.status, COALESCE(h.scheduled_at, h.created_at) AS scheduled_at,
          COALESCE(u.unit_label, 'General') AS unit
        FROM housekeeping_tasks h
        LEFT JOIN units u ON u.id = h.unit_id
        WHERE h.status IN ('open', 'assigned', 'in_progress')
          AND (${param}::uuid IS NULL OR h.property_id = ${param}::uuid)
        ORDER BY COALESCE(h.scheduled_at, h.created_at) DESC
        LIMIT 15
      `,
      // Drill-down: Maintenance tickets detail (top 15 open)
      sql`
        SELECT mt.ticket_number, mt.title, mt.priority, mt.status, mt.created_at,
          COALESCE(u.unit_label, 'Property Wide') AS unit
        FROM maintenance_tickets mt
        LEFT JOIN units u ON u.id = mt.unit_id
        WHERE mt.status IN ('open', 'assigned', 'in_progress')
          AND (${param}::uuid IS NULL OR mt.property_id = ${param}::uuid)
        ORDER BY mt.created_at DESC
        LIMIT 15
      `,
      // Drill-down: Guest requests detail (top 15 pending)
      sql`
        SELECT gr.request_type, gr.description, gr.status, gr.created_at,
          COALESCE(u.unit_label, 'Front Desk') AS unit
        FROM guest_requests gr
        LEFT JOIN bookings b ON b.id = gr.booking_id
        LEFT JOIN units u ON u.id = b.unit_id
        WHERE gr.status IN ('pending', 'in_progress')
          AND (${param}::uuid IS NULL OR gr.property_id = ${param}::uuid)
        ORDER BY gr.created_at DESC
        LIMIT 15
      `,
      // Drill-down: Recent feedbacks (top 15)
      sql`
        SELECT gf.rating, gf.department, COALESCE(gf.comments, 'No comment') AS comments, gf.created_at,
          COALESCE(gp.first_name || ' ' || COALESCE(gp.last_name, ''), 'Anonymous Guest') AS guest_name
        FROM guest_feedbacks gf
        LEFT JOIN guest_profiles gp ON gp.id = gf.guest_id
        WHERE ${param}::uuid IS NULL OR gf.property_id = ${param}::uuid
        ORDER BY gf.created_at DESC
        LIMIT 15
      `,
      // Drill-down: Recent payments (top 20)
      sql`
        SELECT amount, payment_method, payment_date, status, property_name FROM (
          SELECT p.amount, p.payment_method, p.payment_date, p.status,
            pv.name AS property_name
          FROM payments p
          LEFT JOIN properties pv ON pv.id = p.property_id
          WHERE p.status = 'completed'
            AND (${param}::uuid IS NULL OR p.property_id = ${param}::uuid)
          ORDER BY p.payment_date DESC
          LIMIT 20
        ) t
        ORDER BY payment_date DESC
      `,
      // Drill-down: Vendor bills for spending detail (top 20)
      sql`
        SELECT vb.bill_number, vb.bill_date, vb.grand_total, vb.status,
          COALESCE(v.company_name, 'Unknown Vendor') AS vendor_name
        FROM vendor_bills vb
        LEFT JOIN vendors v ON v.id = vb.vendor_id
        WHERE vb.status IN ('pending', 'approved')
          AND (${param}::uuid IS NULL OR vb.property_id = ${param}::uuid)
        ORDER BY vb.bill_date DESC
        LIMIT 20
      `,
      // Drill-down: Employees detail (top 20)
      sql`
        SELECT
          e.employee_code,
          COALESCE(u.first_name || ' ' || COALESCE(u.last_name, ''), 'Staff ' || e.employee_code) AS employee_name,
          d.name AS department,
          e.designation,
          e.employment_type,
          e.doj
        FROM employees e
        LEFT JOIN users u ON u.id = e.user_id
        LEFT JOIN departments d ON d.id = e.department_id
        WHERE e.is_active = true
          AND (${param}::uuid IS NULL OR d.property_id = ${param}::uuid)
        ORDER BY e.created_at DESC
        LIMIT 20
      `,
      // Drill-down: Rooms detail (top 30)
      sql`
        SELECT
          u.unit_label AS room_no,
          u.unit_type AS type,
          u.layout_type AS layout,
          u.status,
          u.base_rate AS rate,
          f.name AS floor,
          b.name AS building
        FROM units u
        JOIN floors f ON f.id = u.floor_id
        JOIN buildings b ON b.id = f.building_id
        WHERE u.is_active = true
          AND (${param}::uuid IS NULL OR b.property_id = ${param}::uuid)
        ORDER BY b.name, f.floor_number, u.unit_label
        LIMIT 30
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

    const nowObj = new Date();
    const todayStr = nowObj.toISOString().slice(0, 10);
    const weekStartObj = new Date(nowObj);
    weekStartObj.setDate(nowObj.getDate() - nowObj.getDay());
    const weekStr = weekStartObj.toISOString().slice(0, 10);
    const monthStr = new Date(nowObj.getFullYear(), nowObj.getMonth(), 1).toISOString().slice(0, 10);
    const yearStr = new Date(nowObj.getFullYear(), 0, 1).toISOString().slice(0, 10);

    const filterByDate = (rows: any[], dateField: string, minDate: string) =>
      (rows || []).filter((r: any) => {
        const val = r[dateField];
        if (!val) return false;
        const dStr = typeof val === "string" ? val.slice(0, 10) : new Date(val).toISOString().slice(0, 10);
        return dStr >= minDate;
      });

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
        recent: feedbackDetailRows,
      } : null,
      revenue: revenue ? {
        today: Number(revenue.today_revenue),
        week: Number(revenue.week_revenue),
        month: Number(revenue.month_revenue),
        year: Number(revenue.year_revenue),
        total: Number(revenue.total_revenue),
        recent: paymentDetailRows,
        recentToday: filterByDate(paymentDetailRows, "payment_date", todayStr),
        recentWeek: filterByDate(paymentDetailRows, "payment_date", weekStr),
        recentMonth: filterByDate(paymentDetailRows, "payment_date", monthStr),
        recentYear: filterByDate(paymentDetailRows, "payment_date", yearStr),
      } : null,
      financial: expenses ? {
        todaySpending: Number(expenses.today_spending),
        weekSpending: Number(expenses.week_spending),
        monthSpending: Number(expenses.month_spending),
        yearSpending: Number(expenses.year_spending),
        expectedExpenses: Number(expenses.expected_expenses),
        expectedReceivables: Number(expenses.expected_receivables),
        availableMoney,
        recentBills: expenseDetailRows,
        recentToday: filterByDate(expenseDetailRows, "bill_date", todayStr),
        recentWeek: filterByDate(expenseDetailRows, "bill_date", weekStr),
        recentMonth: filterByDate(expenseDetailRows, "bill_date", monthStr),
        recentYear: filterByDate(expenseDetailRows, "bill_date", yearStr),
      } : null,
      drillDown: {
        vendorBills: vendorBillDetailRows,
        hkTasks: hkTaskDetailRows,
        maintTickets: maintTicketDetailRows,
        guestRequests: guestRequestDetailRows,
        employees: employeeDetailRows,
        rooms: roomDetailRows,
      },
    });
  } catch (error) {
    console.error("[admin-overview]", error);
    return NextResponse.json({
      error: "Failed to fetch admin overview",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}


