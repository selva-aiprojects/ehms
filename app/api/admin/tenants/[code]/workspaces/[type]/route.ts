import { NextRequest, NextResponse } from "next/server";
import { getDb, getPublicDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

const WORKSPACE_TO_VERTICAL: Record<string, string> = {
  hotels: "hotel",
  apartments: "service_apartment",
  rental: "rental_apartment",
  workplace: "workplace",
};

const SERVICE_TABLES: { table: string; label: string }[] = [
  { table: "properties", label: "Properties" },
  { table: "units", label: "Units" },
  { table: "bookings", label: "Bookings" },
  { table: "lease_agreements", label: "Lease Agreements" },
  { table: "workplace_bookings", label: "Workplace Bookings" },
  { table: "housekeeping_tasks", label: "Housekeeping Tasks" },
  { table: "maintenance_tickets", label: "Maintenance Tickets" },
  { table: "guest_requests", label: "Guest Requests" },
  { table: "invoices", label: "Invoices" },
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string; type: string }> }
) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    const payload = token ? verifyToken(token) : null;

    if (!payload?.is_platform_admin) {
      return NextResponse.json({ error: "Only platform superadmins can check workspace status" }, { status: 403 });
    }

    const { code, type } = await params;
    const verticalType = WORKSPACE_TO_VERTICAL[type];
    if (!verticalType) {
      return NextResponse.json({ error: `Invalid workspace type '${type}'. Valid: hotels, apartments, rental, workplace` }, { status: 400 });
    }

    const publicDb = getPublicDb();
    const existing = (await publicDb.query(
      "SELECT id, schema_name FROM public.tenants WHERE code = $1 LIMIT 1",
      [code]
    )) as Record<string, unknown>[];
    const tenantRow = existing[0];
    if (!tenantRow) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const schema = tenantRow.schema_name as string;
    const tenantDb = getDb(schema);

    const properties = (await tenantDb.query(
      `SELECT id FROM ${schema}.properties WHERE vertical_type = $1::vertical_type`,
      [verticalType]
    )) as Record<string, unknown>[];

    const propertyIds = properties.map((r) => r.id as string);
    const serviceCounts: Record<string, number> = {};

    if (propertyIds.length > 0) {
      for (const { table, label } of SERVICE_TABLES) {
        if (table === "properties") {
          serviceCounts[label] = propertyIds.length;
          continue;
        }
        try {
          const countResult = await tenantDb.query(
            `SELECT COUNT(*) AS cnt FROM ${schema}.${table} WHERE property_id = ANY($1::uuid[])`,
            [propertyIds]
          );
          const cnt = (countResult as Record<string, unknown>[])[0]?.cnt;
          serviceCounts[label] = Number(cnt) || 0;
        } catch {
          serviceCounts[label] = 0;
        }
      }
    }

    const totalServices = Object.values(serviceCounts).reduce((sum, c) => sum + c, 0);

    return NextResponse.json({
      workspace_type: type,
      has_properties: propertyIds.length > 0,
      property_count: propertyIds.length,
      service_counts: serviceCounts,
      total_services: totalServices,
      safe_to_delete: totalServices === 0,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
