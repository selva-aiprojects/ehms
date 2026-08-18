export const dynamic = "force-dynamic";
import { NextRequest, NextResponse, after } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess, validateMutationPropertyAccess } from "@/lib/property-scope";
import { notifyUser, notifyPropertyUsers } from "@/lib/push-events";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const status = searchParams.get("status");

    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;

    const rows = await sql`
      SELECT
        ht.*,
        json_build_object('id', u.id, 'unit_label', u.unit_label, 'unit_type', u.unit_type, 'status', u.status) AS unit,
        json_build_object('id', usr.id, 'first_name', usr.first_name, 'last_name', usr.last_name) AS assignee
      FROM housekeeping_tasks ht
      LEFT JOIN units u ON u.id = ht.unit_id
      LEFT JOIN users usr ON usr.id = ht.assigned_to
      WHERE 1=1
        ${propertyId
          ? sql`AND ht.property_id = ${propertyId}`
          : scope.assignedPropertyIds.length > 0
            ? sql`AND ht.property_id = ANY(${scope.assignedPropertyIds})`
            : sql``}
        ${status ? sql`AND ht.status = ${status}` : sql``}
      ORDER BY ht.scheduled_at ASC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[housekeeping GET]", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const accessErr = validateMutationPropertyAccess(req, body.property_id);
    if (accessErr) return accessErr;

    if (body.flat_mode && body.unit_id) {
      const childRooms = await sql`
        SELECT id FROM units WHERE parent_unit_id = ${body.unit_id}
      ` as any[];

      if (childRooms.length === 0) {
        const singleRow = await sql`
          INSERT INTO housekeeping_tasks (unit_id, property_id, assigned_to, task_type, priority, status, scheduled_at, notes)
          VALUES (
            ${body.unit_id}, ${body.property_id}, ${body.assigned_to || null},
            ${body.task_type}, ${body.priority || "medium"}, 'open',
            ${body.scheduled_at || null}, ${body.notes || null}
          )
          RETURNING *
        `;
        await sql`UPDATE units SET status = 'cleaning' WHERE id = ${body.unit_id}`;
        // PWA: alert the assignee (and housekeeping managers) of the new task
        if (body.assigned_to) {
          after(() =>
            notifyUser(body.assigned_to as string, {
              title: "New Housekeeping Task",
              body: `${body.task_type} task assigned to you.`,
              url: "/dashboard/housekeeping",
            })
          );
        } else if (body.property_id) {
          after(() =>
            notifyPropertyUsers(
              body.property_id as string,
              {
                title: "New Housekeeping Task",
                body: `A ${body.task_type} task was created for this property.`,
                url: "/dashboard/housekeeping",
              },
              { roles: ["housekeeping_supervisor", "housekeeping_staff", "property_manager", "executive", "super_admin"], excludeUserId: req.headers.get("x-user-id") || undefined }
            )
          );
        }
        return NextResponse.json({ data: [singleRow[0]], count: 1 }, { status: 201 });
      }

      const tasks: any[] = [];
      for (const child of childRooms) {
        const row = await sql`
          INSERT INTO housekeeping_tasks (unit_id, property_id, assigned_to, task_type, priority, status, scheduled_at, notes)
          VALUES (
            ${child.id}, ${body.property_id}, ${body.assigned_to || null},
            ${body.task_type}, ${body.priority || "medium"}, 'open',
            ${body.scheduled_at || null}, ${body.notes || null}
          )
          RETURNING *
        `;
        tasks.push(row[0]);
        await sql`UPDATE units SET status = 'cleaning' WHERE id = ${child.id}`;
      }

      // PWA: alert the assignee (or housekeeping managers) of the new flat cleaning task
      if (body.assigned_to) {
        after(() =>
          notifyUser(body.assigned_to as string, {
            title: "New Housekeeping Task",
            body: `${body.task_type} task assigned to you (${tasks.length} room${tasks.length > 1 ? "s" : ""}).`,
            url: "/dashboard/housekeeping",
          })
        );
      } else if (body.property_id) {
        after(() =>
          notifyPropertyUsers(
            body.property_id as string,
            {
              title: "New Housekeeping Task",
              body: `${tasks.length} ${body.task_type} task(s) created for this property.`,
              url: "/dashboard/housekeeping",
            },
            { roles: ["housekeeping_supervisor", "housekeeping_staff", "property_manager", "executive", "super_admin"], excludeUserId: req.headers.get("x-user-id") || undefined }
          )
        );
      }

      return NextResponse.json({ data: tasks, count: tasks.length }, { status: 201 });
    }

    const rows = await sql`
      INSERT INTO housekeeping_tasks (unit_id, property_id, assigned_to, task_type, priority, status, scheduled_at, notes)
      VALUES (
        ${body.unit_id}, ${body.property_id}, ${body.assigned_to || null},
        ${body.task_type}, ${body.priority || "medium"}, 'open',
        ${body.scheduled_at || null}, ${body.notes || null}
      )
      RETURNING *
    `;

    if (body.unit_id) {
      await sql`UPDATE units SET status = 'cleaning' WHERE id = ${body.unit_id}`;
    }

    // PWA: alert the assignee (or housekeeping managers) of the new task
    if (body.assigned_to) {
      after(() =>
        notifyUser(body.assigned_to as string, {
          title: "New Housekeeping Task",
          body: `${body.task_type} task assigned to you.`,
          url: "/dashboard/housekeeping",
        })
      );
    } else if (body.property_id) {
      after(() =>
        notifyPropertyUsers(
          body.property_id as string,
          {
            title: "New Housekeeping Task",
            body: `A ${body.task_type} task was created for this property.`,
            url: "/dashboard/housekeeping",
          },
          { roles: ["housekeeping_supervisor", "housekeeping_staff", "property_manager", "executive", "super_admin"], excludeUserId: req.headers.get("x-user-id") || undefined }
        )
      );
    }

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create task";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
