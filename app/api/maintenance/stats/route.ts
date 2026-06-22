import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_req: NextRequest) {
  try {
    const sql = getDb();

    const openTicketsRows = await sql`SELECT COUNT(*)::int AS count FROM maintenance_tickets WHERE status = 'open'`;
    const inProgressRows = await sql`SELECT COUNT(*)::int AS count FROM maintenance_tickets WHERE status = 'in_progress'`;
    const resolvedTodayRows = await sql`SELECT COUNT(*)::int AS count FROM maintenance_tickets WHERE status = 'resolved' AND resolved_at::date = CURRENT_DATE`;
    const avgHoursRows = await sql`
      SELECT COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600), 2), 0)::numeric AS hours
      FROM maintenance_tickets
      WHERE status = 'resolved' AND resolved_at IS NOT NULL
    `;

    const ticketsByCategory = await sql`
      SELECT category, COUNT(*)::int AS count
      FROM maintenance_tickets
      GROUP BY category
      ORDER BY count DESC
    `;

    const ticketsByPriority = await sql`
      SELECT priority, COUNT(*)::int AS count
      FROM maintenance_tickets
      GROUP BY priority
      ORDER BY count DESC
    `;

    const upcomingPm = await sql`
      SELECT id, title, next_due
      FROM preventive_schedules
      WHERE is_active = true
        AND next_due BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
      ORDER BY next_due ASC
    `;

    const amcExpiring = await sql`
      SELECT id, contract_name, vendor_id, end_date
      FROM amc_contracts
      WHERE end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
      ORDER BY end_date ASC
    `;

    const lowStockParts = await sql`
      SELECT id, part_name, quantity_in_stock, reorder_level
      FROM parts_inventory
      WHERE quantity_in_stock <= reorder_level
      ORDER BY quantity_in_stock ASC
    `;

    const openTickets = openTicketsRows[0] as { count: number } | undefined;
    const inProgress = inProgressRows[0] as { count: number } | undefined;
    const resolvedToday = resolvedTodayRows[0] as { count: number } | undefined;
    const avgHours = avgHoursRows[0] as { hours: number } | undefined;

    return NextResponse.json({
      data: {
        open_tickets: openTickets?.count ?? 0,
        in_progress: inProgress?.count ?? 0,
        resolved_today: resolvedToday?.count ?? 0,
        avg_resolution_hours: avgHours?.hours ?? 0,
        tickets_by_category: ticketsByCategory,
        tickets_by_priority: ticketsByPriority,
        upcoming_pm: upcomingPm,
        amc_expiring: amcExpiring,
        low_stock_parts: lowStockParts,
      },
    });
  } catch (error: any) {
    console.error("[stats GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch stats" }, { status: 500 });
  }
}
