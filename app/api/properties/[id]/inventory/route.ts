import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sql = getDb();

    // Verify property exists
    const propRows = await sql.query(`SELECT id, name, code, vertical_type FROM properties WHERE id = $1 LIMIT 1`, [id]);
    if (!propRows || (propRows as any[]).length === 0) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Fetch buildings for this property
    const buildings = await sql.query(
      `SELECT * FROM buildings WHERE property_id = $1 ORDER BY code, name`,
      [id]
    );

    const buildingIds = (buildings as any[]).map(b => b.id);

    // Fetch floors for these buildings
    let floors: any[] = [];
    if (buildingIds.length > 0) {
      const placeholders = buildingIds.map((_, i) => `$${i + 1}`).join(", ");
      floors = (await sql.query(
        `SELECT * FROM floors WHERE building_id IN (${placeholders}) ORDER BY building_id, floor_number`,
        buildingIds
      )) as any[];
    }

    const floorIds = floors.map(f => f.id);

    // Fetch units for these floors
    let units: any[] = [];
    if (floorIds.length > 0) {
      const placeholders = floorIds.map((_, i) => `$${i + 1}`).join(", ");
      units = (await sql.query(
        `SELECT * FROM units WHERE floor_id IN (${placeholders}) ORDER BY floor_id, unit_label`,
        floorIds
      )) as any[];
    }

    // Fetch master room categories and facilities
    const roomCategories = await sql.query(
      `SELECT * FROM room_categories WHERE (property_id = $1 OR property_id IS NULL) AND is_active = true ORDER BY name`,
      [id]
    );

    const facilities = await sql.query(
      `SELECT * FROM facilities WHERE (property_id = $1 OR property_id IS NULL) AND is_active = true ORDER BY name`,
      [id]
    );

    return NextResponse.json({
      data: {
        property: (propRows as any[])[0],
        buildings: buildings as any[],
        floors: floors as any[],
        units: units as any[],
        room_categories: roomCategories as any[],
        facilities: facilities as any[],
      }
    });
  } catch (error: any) {
    console.error("[properties/:id/inventory GET]", error);
    return NextResponse.json({ error: "Failed to fetch property inventory" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const requesterRole = req.headers.get("x-user-role");
    if (!["super_admin", "executive", "property_manager"].includes(requesterRole || "")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = await params;
    const sql = getDb();
    const body = await req.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: "Missing action parameter" }, { status: 400 });
    }

    // 1. Create Building
    if (action === "create_building") {
      const { name, code, floors: numFloors, year_built } = body;
      if (!name || !code) {
        return NextResponse.json({ error: "Building name and code are required" }, { status: 400 });
      }

      const existing = await sql.query(
        `SELECT id FROM buildings WHERE property_id = $1 AND code = $2 LIMIT 1`,
        [id, code]
      );
      if (existing && (existing as any[]).length > 0) {
        return NextResponse.json({ error: `Building with code ${code} already exists for this property` }, { status: 400 });
      }

      const countFloors = parseInt(numFloors) || 1;
      const bldRows = await sql.query(
        `INSERT INTO buildings (property_id, name, code, floors, year_built) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [id, name, code, countFloors, year_built || null]
      );
      const building = (bldRows as any[])[0];

      // Auto-generate floors
      const createdFloors: any[] = [];
      for (let i = 1; i <= countFloors; i++) {
        const floorName = i === 1 ? "Ground / Floor 1" : `Floor ${i}`;
        const flrRows = await sql.query(
          `INSERT INTO floors (building_id, name, floor_number) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING *`,
          [building.id, floorName, i]
        );
        if (flrRows && (flrRows as any[]).length > 0) {
          createdFloors.push((flrRows as any[])[0]);
        }
      }

      return NextResponse.json({ data: { building, floors: createdFloors }, message: "Building and floors created successfully" }, { status: 201 });
    }

    // 2. Delete Building
    if (action === "delete_building") {
      const { building_id } = body;
      if (!building_id) {
        return NextResponse.json({ error: "building_id is required" }, { status: 400 });
      }
      const delRows = await sql.query(
        `DELETE FROM buildings WHERE id = $1 AND property_id = $2 RETURNING id`,
        [building_id, id]
      );
      if (!delRows || (delRows as any[]).length === 0) {
        return NextResponse.json({ error: "Building not found" }, { status: 404 });
      }
      return NextResponse.json({ message: "Building deleted successfully" });
    }

    // 3. Create Floor
    if (action === "create_floor") {
      const { building_id, name, floor_number } = body;
      if (!building_id || !name || floor_number === undefined) {
        return NextResponse.json({ error: "building_id, name, and floor_number are required" }, { status: 400 });
      }
      const flrRows = await sql.query(
        `INSERT INTO floors (building_id, name, floor_number) VALUES ($1, $2, $3) ON CONFLICT (building_id, floor_number) DO UPDATE SET name = EXCLUDED.name RETURNING *`,
        [building_id, name, parseInt(floor_number)]
      );
      return NextResponse.json({ data: (flrRows as any[])[0], message: "Floor added successfully" }, { status: 201 });
    }

    // 4. Delete Floor
    if (action === "delete_floor") {
      const { floor_id } = body;
      if (!floor_id) {
        return NextResponse.json({ error: "floor_id is required" }, { status: 400 });
      }
      const delRows = await sql.query(
        `DELETE FROM floors WHERE id = $1 RETURNING id`,
        [floor_id]
      );
      if (!delRows || (delRows as any[]).length === 0) {
        return NextResponse.json({ error: "Floor not found" }, { status: 404 });
      }
      return NextResponse.json({ message: "Floor deleted successfully" });
    }

    // 5. Create Single Unit / Room
    if (action === "create_unit") {
      const { floor_id, unit_label, unit_type, layout_type, sq_ft, max_occupancy, base_rate, status, attributes, parent_unit_id } = body;
      if (!floor_id || !unit_label || !unit_type) {
        return NextResponse.json({ error: "floor_id, unit_label, and unit_type are required" }, { status: 400 });
      }

      const attrJson = JSON.stringify(attributes || {});
      const pUnitId = parent_unit_id && parent_unit_id !== "" ? parent_unit_id : null;
      const unitRows = await sql.query(
        `INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes, parent_unit_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)
         ON CONFLICT (floor_id, unit_label) DO UPDATE SET
           unit_type = EXCLUDED.unit_type,
           layout_type = EXCLUDED.layout_type,
           sq_ft = EXCLUDED.sq_ft,
           max_occupancy = EXCLUDED.max_occupancy,
           base_rate = EXCLUDED.base_rate,
           attributes = EXCLUDED.attributes,
           parent_unit_id = EXCLUDED.parent_unit_id,
           updated_at = now()
         RETURNING *`,
        [
          floor_id,
          unit_type || "room",
          unit_label,
          layout_type || null,
          sq_ft ? parseFloat(sq_ft) : null,
          max_occupancy ? parseInt(max_occupancy) : 2,
          base_rate ? parseFloat(base_rate) : 0,
          status || "vacant",
          attrJson,
          pUnitId
        ]
      );

      return NextResponse.json({ data: (unitRows as any[])[0], message: `Room ${unit_label} saved successfully` }, { status: 201 });
    }

    // 6. Create Bulk Units / Rooms
    if (action === "create_bulk_units") {
      const { floor_id, prefix, start_num, end_num, unit_type, layout_type, sq_ft, max_occupancy, base_rate, attributes } = body;
      if (!floor_id || start_num === undefined || end_num === undefined) {
        return NextResponse.json({ error: "floor_id, start_num, and end_num are required" }, { status: 400 });
      }

      const sNum = parseInt(start_num);
      const eNum = parseInt(end_num);
      if (sNum > eNum || eNum - sNum > 100) {
        return NextResponse.json({ error: "Invalid range (max 100 units per bulk create)" }, { status: 400 });
      }

      const attrJson = JSON.stringify(attributes || {});
      const created: any[] = [];

      for (let num = sNum; num <= eNum; num++) {
        const pfx = prefix || "";
        const label = pfx ? `${pfx}${String(num).padStart(2, "0")}` : String(num);
        const row = await sql.query(
          `INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'vacant', $8::jsonb)
           ON CONFLICT (floor_id, unit_label) DO UPDATE SET
             unit_type = EXCLUDED.unit_type,
             layout_type = EXCLUDED.layout_type,
             sq_ft = EXCLUDED.sq_ft,
             max_occupancy = EXCLUDED.max_occupancy,
             base_rate = EXCLUDED.base_rate,
             attributes = EXCLUDED.attributes,
             updated_at = now()
           RETURNING *`,
          [
            floor_id,
            unit_type || "room",
            label,
            layout_type || null,
            sq_ft ? parseFloat(sq_ft) : null,
            max_occupancy ? parseInt(max_occupancy) : 2,
            base_rate ? parseFloat(base_rate) : 0,
            attrJson
          ]
        );
        if (row && (row as any[]).length > 0) {
          created.push((row as any[])[0]);
        }
      }

      return NextResponse.json({ data: created, count: created.length, message: `Created ${created.length} rooms successfully` }, { status: 201 });
    }

    // 7. Update Unit / Room Specifications
    if (action === "update_unit") {
      const { unit_id, unit_label, unit_type, layout_type, sq_ft, max_occupancy, base_rate, status, attributes, parent_unit_id } = body;
      if (!unit_id) {
        return NextResponse.json({ error: "unit_id is required" }, { status: 400 });
      }

      const updates: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (unit_label !== undefined) { updates.push(`unit_label = $${idx++}`); values.push(unit_label); }
      if (unit_type !== undefined) { updates.push(`unit_type = $${idx++}`); values.push(unit_type); }
      if (layout_type !== undefined) { updates.push(`layout_type = $${idx++}`); values.push(layout_type); }
      if (sq_ft !== undefined) { updates.push(`sq_ft = $${idx++}`); values.push(sq_ft ? parseFloat(sq_ft) : null); }
      if (max_occupancy !== undefined) { updates.push(`max_occupancy = $${idx++}`); values.push(parseInt(max_occupancy)); }
      if (base_rate !== undefined) { updates.push(`base_rate = $${idx++}`); values.push(parseFloat(base_rate)); }
      if (status !== undefined) { updates.push(`status = $${idx++}`); values.push(status); }
      if (attributes !== undefined) { updates.push(`attributes = $${idx++}::jsonb`); values.push(JSON.stringify(attributes)); }
      if (parent_unit_id !== undefined) {
        updates.push(`parent_unit_id = $${idx++}`);
        values.push(parent_unit_id && parent_unit_id !== "" ? parent_unit_id : null);
      }

      if (updates.length === 0) {
        return NextResponse.json({ error: "No fields to update" }, { status: 400 });
      }

      updates.push(`updated_at = now()`);
      values.push(unit_id);

      const updRows = await sql.query(
        `UPDATE units SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
        values
      );

      if (!updRows || (updRows as any[]).length === 0) {
        return NextResponse.json({ error: "Room not found" }, { status: 404 });
      }

      return NextResponse.json({ data: (updRows as any[])[0], message: "Room specifications updated successfully" });
    }

    // 8. Delete Unit / Room
    if (action === "delete_unit") {
      const { unit_id } = body;
      if (!unit_id) {
        return NextResponse.json({ error: "unit_id is required" }, { status: 400 });
      }
      const delRows = await sql.query(`DELETE FROM units WHERE id = $1 RETURNING id`, [unit_id]);
      if (!delRows || (delRows as any[]).length === 0) {
        return NextResponse.json({ error: "Room not found" }, { status: 404 });
      }
      return NextResponse.json({ message: "Room deleted successfully" });
    }

    return NextResponse.json({ error: `Unknown action ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("[properties/:id/inventory POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to process inventory action" }, { status: 500 });
  }
}
