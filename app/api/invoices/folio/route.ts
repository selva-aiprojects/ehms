import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("booking_id");
    
    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    const sql = getDb();
    
    // Fetch main invoice and lines
    const invoices = await sql`
      SELECT 
        i.id as invoice_id, i.invoice_number, i.status, i.total_amount, i.amount_paid, i.balance_due,
        il.id as line_id, il.description, il.amount, il.tax_amount, il.line_type, il.created_at
      FROM invoices i
      LEFT JOIN invoice_lines il ON il.invoice_id = i.id
      WHERE i.booking_id = ${bookingId}
      ORDER BY il.created_at ASC
    `;

    // Fetch payments
    const payments = await sql`
      SELECT p.id, p.payment_date, p.amount, p.payment_method, p.reference_number, p.status
      FROM payments p
      WHERE p.booking_id = ${bookingId} AND p.status = 'completed'
      ORDER BY p.payment_date ASC
    `;

    // Group into a folio object
    const folio = {
      invoiceId: invoices[0]?.invoice_id,
      invoiceNumber: invoices[0]?.invoice_number,
      status: invoices[0]?.status || 'draft',
      totalAmount: invoices[0]?.total_amount || 0,
      amountPaid: invoices[0]?.amount_paid || 0,
      balanceDue: invoices[0]?.balance_due || 0,
      charges: invoices.map(i => ({
        id: i.line_id,
        description: i.description,
        amount: i.amount,
        taxAmount: i.tax_amount,
        type: i.line_type,
        date: i.created_at
      })).filter(i => i.id != null),
      payments: payments
    };

    return NextResponse.json({ data: folio });
  } catch (error: any) {
    console.error("[folio GET]", error);
    return NextResponse.json({ error: "Failed to fetch folio" }, { status: 500 });
  }
}
