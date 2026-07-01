import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const requesterRole = req.headers.get("x-user-role");
    const allowedRoles = ["super_admin", "property_manager", "housekeeping_supervisor", "maintenance_supervisor"];
    if (!allowedRoles.includes(requesterRole || "")) {
      return NextResponse.json({ error: "Access denied. Only authorized administrators can update users." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const sql = getDb();

    const requesterId = req.headers.get("x-user-id");
    const requesterRoles = await sql`
      SELECT property_id 
      FROM user_roles 
      WHERE user_id = ${requesterId}
    `;
    const requesterPropertyId = requesterRoles[0]?.property_id || null;

    if (requesterPropertyId) {
      const targetRoles = await sql`
        SELECT property_id 
        FROM user_roles 
        WHERE user_id = ${id}
      `;
      const targetPropertyId = targetRoles[0]?.property_id || null;
      if (targetPropertyId !== requesterPropertyId) {
        return NextResponse.json({ error: "Access denied. You can only manage users in your assigned workspace." }, { status: 403 });
      }
      if (body.property_id && body.property_id !== requesterPropertyId) {
        return NextResponse.json({ error: "Access denied. You cannot move users to another workspace." }, { status: 403 });
      }
      if (body.role_name === "super_admin") {
        return NextResponse.json({ error: "Access denied. You cannot assign the super_admin role." }, { status: 403 });
      }
    }

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (body.first_name !== undefined) { updates.push(`first_name = $${idx++}`); values.push(body.first_name.trim()); }
    if (body.last_name !== undefined) { updates.push(`last_name = $${idx++}`); values.push(body.last_name?.trim() || null); }
    if (body.phone !== undefined) { updates.push(`phone = $${idx++}`); values.push(body.phone || null); }
    if (body.is_active !== undefined) { updates.push(`is_active = $${idx++}`); values.push(body.is_active); }

    if (body.role_name) {
      const roleRow = (await sql`SELECT id FROM roles WHERE name = ${body.role_name} LIMIT 1`) as any[];
      if (roleRow.length === 0) {
        return NextResponse.json({ error: "Role not found" }, { status: 400 });
      }
      await sql`
        UPDATE user_roles SET role_id = ${roleRow[0].id}, property_id = ${body.property_id || null}
        WHERE user_id = ${id}
      `;
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push(`updated_at = now()`);
    values.push(id);

    const result = await (sql as any)(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${idx} RETURNING id, email, first_name, last_name, phone, is_active`,
      values
    );

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ data: result[0] });
  } catch (error: any) {
    console.error("[admin/users PUT]", error);
    return NextResponse.json({ error: error?.message || "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const requesterRole = req.headers.get("x-user-role");
    const allowedRoles = ["super_admin", "property_manager", "housekeeping_supervisor", "maintenance_supervisor"];
    if (!allowedRoles.includes(requesterRole || "")) {
      return NextResponse.json({ error: "Access denied. Only authorized administrators can deactivate users." }, { status: 403 });
    }

    const { id } = await params;
    const sql = getDb();

    const requesterId = req.headers.get("x-user-id");
    const requesterRoles = await sql`
      SELECT property_id 
      FROM user_roles 
      WHERE user_id = ${requesterId}
    `;
    const requesterPropertyId = requesterRoles[0]?.property_id || null;

    if (requesterPropertyId) {
      const targetRoles = await sql`
        SELECT property_id 
        FROM user_roles 
        WHERE user_id = ${id}
      `;
      const targetPropertyId = targetRoles[0]?.property_id || null;
      if (targetPropertyId !== requesterPropertyId) {
        return NextResponse.json({ error: "Access denied. You can only deactivate users in your assigned workspace." }, { status: 403 });
      }
    }

    const result = await sql`
      UPDATE users SET is_active = false, updated_at = now() WHERE id = ${id} RETURNING id, email, first_name, last_name
    ` as any[];

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ data: result[0], message: "User deactivated" });
  } catch (error: any) {
    console.error("[admin/users DELETE]", error);
    return NextResponse.json({ error: error?.message || "Failed to deactivate user" }, { status: 500 });
  }
}
