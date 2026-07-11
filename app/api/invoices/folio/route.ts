import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validateIndirectPropertyAccess } from "@/lib/property-scope";

const CHARGE_TYPES: Record<string, { label: string; category: string }> = {
  room_charge:    { label: "Room Charges",          category: "accommodation" },
  laundry:        { label: "Laundry & Pressing",     category: "ancillary" },
  restaurant:     { label: "Restaurant / Dining",    category: "ancillary" },
  bar:            { label: "Bar / Beverages",        category: "ancillary" },
  minibar:        { label: "Minibar",                category: "ancillary" },
  room_service:   { label: "Room Service",           category: "ancillary" },
  telephone:      { label: "Telephone / STD",        category: "ancillary" },
  spa:            { label: "Spa & Wellness",         category: "ancillary" },
  gym:            { label: "Gym / Fitness",          category: "ancillary" },
  parking:        { label: "Parking Charges",        category: "ancillary" },
  transport:      { label: "Transportation",         category: "ancillary" },
  damage:         { label: "Damage / Loss Charges",  category: "penalty" },
  early_checkin:  { label: "Early Check-in Fee",     category: "fee" },
  late_checkout:  { label: "Late Check-out Fee",     category: "fee" },
  other:          { label: "Other Charges",          category: "miscellaneous" },
};

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("booking_id");
    if (!bookingId) return NextResponse.json({ error: "booking_id is required" }, { status: 400 });

    const sql = getDb();

    // Full booking details
    const bookingRows = await sql`
      SELECT b.id, b.status, b.check_in, b.check_out, b.total_amount, b.paid_amount,
             b.property_id, b.guest_id,
             g.first_name, g.last_name, g.email, g.phone,
             u.unit_label, u.unit_type,
             p.name as property_name
      FROM bookings b
      LEFT JOIN guest_profiles g ON g.id = b.guest_id
      LEFT JOIN units u ON u.id = b.unit_id
      LEFT JOIN properties p ON p.id = b.property_id
      WHERE b.id = ${bookingId}
      LIMIT 1
    `;
    if (!bookingRows[0]) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    const booking = bookingRows[0] as Record<string, unknown>;

    // Invoice + line items
    const invoiceRows = await sql`
      SELECT
        i.id as invoice_id, i.invoice_number, i.status as invoice_status,
        i.subtotal, i.tax_total, i.grand_total, i.paid_total, i.balance_due,
        i.due_date, i.created_at as invoice_created_at,
        il.id as line_id, il.description, il.quantity, il.unit_price, il.line_total, il.tax_rate,
        il.account_id
      FROM invoices i
      LEFT JOIN invoice_lines il ON il.invoice_id = i.id
      WHERE i.booking_id = ${bookingId}
      ORDER BY i.created_at ASC, il.id ASC
    `;

    // Payments
    const payments = await sql`
      SELECT p.id, p.payment_date, p.amount, p.payment_method, p.gateway_ref, p.status
      FROM payments p
      WHERE p.booking_id = ${bookingId}
      ORDER BY p.payment_date ASC
    `;

    const inv = invoiceRows[0] as Record<string, unknown> | undefined;
    const chargeLines = (invoiceRows as any[])
      .filter(r => r.line_id != null)
      .map(r => ({
        id: r.line_id,
        description: r.description,
        quantity: r.quantity,
        unit_price: Number(r.unit_price || 0),
        line_total: Number(r.line_total || 0),
        tax_rate: Number(r.tax_rate || 0),
      }));

    const folio = {
      booking: {
        id: booking.id,
        status: booking.status,
        check_in: booking.check_in,
        check_out: booking.check_out,
        unit_label: booking.unit_label,
        unit_type: booking.unit_type,
        property_name: booking.property_name,
        guest: {
          name: `${booking.first_name} ${booking.last_name}`,
          email: booking.email,
          phone: booking.phone,
        },
      },
      invoice: inv ? {
        id: inv.invoice_id,
        invoice_number: inv.invoice_number,
        status: inv.invoice_status,
        subtotal: Number(inv.subtotal || 0),
        tax_total: Number(inv.tax_total || 0),
        grand_total: Number(inv.grand_total || 0),
        paid_total: Number(inv.paid_total || 0),
        balance_due: Number(inv.balance_due || 0),
        due_date: inv.due_date,
      } : null,
      charges: chargeLines,
      payments: payments,
      charge_types: CHARGE_TYPES,
    };

    return NextResponse.json({ data: folio });
  } catch (error: any) {
    console.error("[folio GET]", error);
    return NextResponse.json({ error: "Failed to fetch folio" }, { status: 500 });
  }
}

// POST — add an ad-hoc charge to a booking's folio
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sql = getDb();
    const body = await req.json();
    const { booking_id, description, quantity = 1, unit_price, tax_rate = 0, charge_type = "other" } = body;

    if (!booking_id || !description || !unit_price) {
      return NextResponse.json({ error: "booking_id, description, and unit_price are required" }, { status: 400 });
    }

    // Validate property access indirectly via booking → property_id
    const accessErr = await validateIndirectPropertyAccess(req, sql, "bookings", booking_id);
    if (accessErr) return accessErr;

    const qty = parseInt(String(quantity)) || 1;
    const price = parseFloat(String(unit_price));
    const taxPct = parseFloat(String(tax_rate)) || 0;
    if (isNaN(price) || price <= 0) {
      return NextResponse.json({ error: "unit_price must be a positive number" }, { status: 400 });
    }

    // Ensure invoice exists for this booking
    let invoiceId: string;
    const existingInv = await sql`
      SELECT id, grand_total, paid_total FROM invoices WHERE booking_id = ${booking_id} LIMIT 1
    `;

    if (existingInv[0]) {
      invoiceId = (existingInv[0] as Record<string, unknown>).id as string;
    } else {
      // Create a fresh invoice linked to this booking
      const bkgRows = await sql`
        SELECT property_id, guest_id, check_out FROM bookings WHERE id = ${booking_id} LIMIT 1
      `;
      if (!bkgRows[0]) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      const bkg = bkgRows[0] as Record<string, unknown>;
      const invNum = `INV-${Date.now().toString(36).toUpperCase()}`;
      const newInv = await sql`
        INSERT INTO invoices (booking_id, property_id, guest_id, invoice_number, invoice_date, status, subtotal, tax_total, grand_total, paid_total, due_date)
        VALUES (${booking_id}, ${bkg.property_id as string}, ${bkg.guest_id as string || null}, ${invNum}, CURRENT_DATE, 'draft', 0, 0, 0, 0, COALESCE(${bkg.check_out as string}::date, CURRENT_DATE))
        RETURNING id
      `;
      invoiceId = (newInv[0] as Record<string, unknown>).id as string;
    }

    // Insert the new charge line
    const lineTotal = qty * price;
    const taxAmount = lineTotal * (taxPct / 100);
    const chargeDesc = CHARGE_TYPES[charge_type]
      ? `${CHARGE_TYPES[charge_type].label}${description !== charge_type ? ": " + description : ""}`
      : description;

    const lineRows = await sql`
      INSERT INTO invoice_lines (invoice_id, description, quantity, unit_price, tax_rate)
      VALUES (${invoiceId}, ${chargeDesc}, ${qty}, ${price}, ${taxPct})
      RETURNING id, description, quantity, unit_price, line_total, tax_rate
    `;

    // Recalculate invoice totals from all lines
    await sql`
      UPDATE invoices SET
        subtotal  = (SELECT COALESCE(SUM(line_total), 0) FROM invoice_lines WHERE invoice_id = ${invoiceId}),
        tax_total = (SELECT COALESCE(SUM(line_total * tax_rate / 100), 0) FROM invoice_lines WHERE invoice_id = ${invoiceId}),
        grand_total = (SELECT COALESCE(SUM(line_total * (1 + tax_rate / 100)), 0) FROM invoice_lines WHERE invoice_id = ${invoiceId})
      WHERE id = ${invoiceId}
    `;

    // Fetch updated invoice totals
    const updatedInv = await sql`
      SELECT grand_total, paid_total, balance_due FROM invoices WHERE id = ${invoiceId} LIMIT 1
    `;

    return NextResponse.json({
      data: {
        line: lineRows[0],
        invoice_id: invoiceId,
        grand_total: Number((updatedInv[0] as Record<string, unknown>).grand_total || 0),
        balance_due: Number((updatedInv[0] as Record<string, unknown>).balance_due || 0),
      },
      message: `Charge "${chargeDesc}" of ₹${lineTotal.toFixed(2)} added to folio`,
    }, { status: 201 });
  } catch (error: any) {
    console.error("[folio POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to add charge" }, { status: 500 });
  }
}

// DELETE — remove a charge line from a folio
export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const lineId = searchParams.get("line_id");
    if (!lineId) return NextResponse.json({ error: "line_id is required" }, { status: 400 });

    // Get invoice_id before deleting
    const lineRows = await sql`SELECT invoice_id FROM invoice_lines WHERE id = ${lineId}`;
    if (!lineRows[0]) return NextResponse.json({ error: "Charge not found" }, { status: 404 });
    const invoiceId = (lineRows[0] as Record<string, unknown>).invoice_id as string;

    // Validate property access indirectly via invoice → booking → property_id
    const invBookingRows = await sql`SELECT booking_id FROM invoices WHERE id = ${invoiceId} LIMIT 1`;
    if (invBookingRows.length > 0) {
      const accessErr = await validateIndirectPropertyAccess(req, sql, "bookings", (invBookingRows[0] as any).booking_id);
      if (accessErr) return accessErr;
    }

    await sql`DELETE FROM invoice_lines WHERE id = ${lineId}`;

    // Recalculate invoice totals
    await sql`
      UPDATE invoices SET
        subtotal    = (SELECT COALESCE(SUM(line_total), 0)                    FROM invoice_lines WHERE invoice_id = ${invoiceId}),
        tax_total   = (SELECT COALESCE(SUM(line_total * tax_rate / 100), 0)   FROM invoice_lines WHERE invoice_id = ${invoiceId}),
        grand_total = (SELECT COALESCE(SUM(line_total * (1 + tax_rate / 100)), 0) FROM invoice_lines WHERE invoice_id = ${invoiceId})
      WHERE id = ${invoiceId}
    `;

    return NextResponse.json({ message: "Charge removed from folio" });
  } catch (error: any) {
    console.error("[folio DELETE]", error);
    return NextResponse.json({ error: error?.message || "Failed to remove charge" }, { status: 500 });
  }
}

// PUT — process payment on a folio
export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sql = getDb();
    const body = await req.json();
    const { booking_id, amount, payment_method } = body;
    if (!booking_id) return NextResponse.json({ error: "booking_id required" }, { status: 400 });

    const accessErr = await validateIndirectPropertyAccess(req, sql, "bookings", booking_id);
    if (accessErr) return accessErr;

    const existingInv = await sql`SELECT id, grand_total, paid_total FROM invoices WHERE booking_id = ${booking_id} LIMIT 1`;
    if (!existingInv[0]) return NextResponse.json({ error: "No invoice found for booking" }, { status: 404 });

    const inv = existingInv[0] as Record<string, unknown>;
    const invId = inv.id as string;
    const newPaid = Number(inv.paid_total || 0) + Number(amount || inv.grand_total);
    const newStatus = newPaid >= Number(inv.grand_total) ? 'paid' : 'sent';

    await sql`
      UPDATE invoices SET
        paid_total = ${newPaid},
        balance_due = COALESCE(grand_total, 0) - ${newPaid},
        status = ${newStatus}
      WHERE id = ${invId}
    `;

    try {
      await sql`
        INSERT INTO bill_payments (property_id, bill_id, payment_date, amount, payment_method, reference)
        SELECT property_id, ${invId}, NOW(), ${Number(amount || inv.grand_total)}, ${payment_method || 'card'}, 'Folio Payment'
        FROM invoices WHERE id = ${invId}
      `;
    } catch { /* non-fatal if table schema differs */ }

    return NextResponse.json({ message: "Payment recorded successfully" });
  } catch (error: any) {
    console.error("[folio PUT]", error);
    return NextResponse.json({ error: error?.message || "Payment processing failed" }, { status: 500 });
  }
}
