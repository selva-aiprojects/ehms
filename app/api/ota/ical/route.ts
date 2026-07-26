export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// GET — generate iCal feed for a property (public, no auth)
// URL: /api/ota/ical?property_id=xxx
export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");

    if (!propertyId) {
      return NextResponse.json({ error: "property_id is required" }, { status: 400 });
    }

    // Fetch all active bookings for this property
    const bookings = await sql`
      SELECT
        b.id, b.check_in, b.check_out, b.status,
        u.unit_label,
        g.first_name, g.last_name
      FROM bookings b
      LEFT JOIN units u ON u.id = b.unit_id
      LEFT JOIN guest_profiles g ON g.id = b.guest_id
      WHERE b.property_id = ${propertyId}
        AND b.status IN ('confirmed', 'checked_in', 'pending')
        AND b.check_out > CURRENT_DATE
      ORDER BY b.check_in
    ` as any[];

    // Build iCal
    const icalLines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//eHMS//OTA Sync//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:eHMS Property ${propertyId}`,
    ];

    for (const b of bookings) {
      const checkIn = new Date(b.check_in).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      const checkOut = new Date(b.check_out).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      const guestName = b.first_name ? `${b.first_name} ${b.last_name || ""}`.trim() : "Guest";
      const roomLabel = b.unit_label || "Room";

      icalLines.push(
        "BEGIN:VEVENT",
        `UID:${b.id}@ehms`,
        `DTSTART:${checkIn}`,
        `DTEND:${checkOut}`,
        `SUMMARY:${roomLabel} - ${guestName} (${b.status})`,
        `DESCRIPTION:Booking ${b.id} | ${guestName} | ${b.status}`,
        "STATUS:CONFIRMED",
        "END:VEVENT"
      );
    }

    icalLines.push("END:VCALENDAR");

    const icalContent = icalLines.join("\r\n");

    return new NextResponse(icalContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="property-${propertyId}.ics"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[ota/ical GET]", error);
    return NextResponse.json({ error: "Failed to generate iCal feed" }, { status: 500 });
  }
}
