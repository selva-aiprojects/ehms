import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");

    const propertyFilter = propertyId ? sql`AND property_id = ${propertyId}` : sql``;

    const [taskCounts] = await sql`
      SELECT
        COUNT(*)::int AS total_tasks,
        COALESCE(SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END))::int AS open_tasks,
        COALESCE(SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END))::int AS in_progress,
        COALESCE(SUM(CASE WHEN status = 'completed' AND completed_at::date = CURRENT_DATE THEN 1 ELSE 0 END))::int AS completed_today
      FROM housekeeping_tasks
      WHERE 1=1 ${propertyFilter}
    ` as [{ total_tasks: number; open_tasks: number; in_progress: number; completed_today: number }];

    const staffFilter = propertyId ? sql`AND ht.property_id = ${propertyId}` : sql``;
    const staffPerformance = await sql`
      SELECT
        usr.id,
        usr.first_name,
        usr.last_name,
        COUNT(ht.id)::int AS task_count,
        COALESCE(AVG(hi.score), 0)::numeric(5,2) AS avg_rating
      FROM users usr
      JOIN housekeeping_tasks ht ON ht.assigned_to = usr.id
      LEFT JOIN housekeeping_inspections hi ON hi.task_id = ht.id
      WHERE usr.is_active = true
        ${staffFilter}
      GROUP BY usr.id, usr.first_name, usr.last_name
      ORDER BY task_count DESC
    ` as { id: string; first_name: string; last_name: string; task_count: number; avg_rating: number }[];

    const floorSummary = await sql`
      SELECT
        f.name AS floor_name,
        f.floor_number,
        COUNT(ht.id)::int AS task_count,
        COALESCE(SUM(CASE WHEN ht.status = 'completed' THEN 1 ELSE 0 END))::int AS completed_count
      FROM floors f
      JOIN buildings b ON b.id = f.building_id
      JOIN units u ON u.floor_id = f.id
      LEFT JOIN housekeeping_tasks ht ON ht.unit_id = u.id
      WHERE 1=1
        ${propertyId ? sql`AND b.property_id = ${propertyId}` : sql``}
      GROUP BY f.id, f.name, f.floor_number
      ORDER BY f.floor_number ASC
    ` as { floor_name: string; floor_number: number; task_count: number; completed_count: number }[];

    const linenSummary = await sql`
      SELECT
        lifecycle_stage,
        COUNT(*)::int AS count
      FROM linen_batches
      WHERE 1=1 ${propertyFilter}
      GROUP BY lifecycle_stage
      ORDER BY lifecycle_stage
    ` as { lifecycle_stage: string; count: number }[];

    return NextResponse.json({
      total_tasks: taskCounts.total_tasks,
      open_tasks: taskCounts.open_tasks,
      in_progress: taskCounts.in_progress,
      completed_today: taskCounts.completed_today,
      staff_performance: staffPerformance,
      floor_summary: floorSummary,
      linen_summary: linenSummary,
    });
  } catch (error) {
    console.error("[housekeeping/stats GET]", error);
    return NextResponse.json({ error: "Failed to fetch housekeeping stats" }, { status: 500 });
  }
}
