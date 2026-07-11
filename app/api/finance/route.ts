export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess } from "@/lib/property-scope";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    let invQuery = "SELECT * FROM invoices WHERE 1=1";
    const invParams: any[] = [];
    if (propertyId) {
      invQuery += " AND property_id = $1";
      invParams.push(propertyId);
    } else if (scope.assignedPropertyIds.length > 0) {
      invQuery += " AND property_id = ANY($1)";
      invParams.push(scope.assignedPropertyIds);
    }
    invQuery += " ORDER BY created_at DESC LIMIT 100";

    let payQuery = "SELECT amount, payment_date, payment_method FROM payments WHERE status = 'completed'";
    const payParams: any[] = [];
    if (propertyId) {
      payQuery += " AND property_id = $1";
      payParams.push(propertyId);
    } else if (scope.assignedPropertyIds.length > 0) {
      payQuery += " AND property_id = ANY($1)";
      payParams.push(scope.assignedPropertyIds);
    }

    let recentPayQuery = `
      SELECT p.*, i.invoice_number
      FROM payments p
      LEFT JOIN invoices i ON i.id = p.invoice_id
      WHERE p.status = 'completed'
    `;
    const recentPayParams: any[] = [];
    if (propertyId) {
      recentPayQuery += " AND p.property_id = $1";
      recentPayParams.push(propertyId);
    } else if (scope.assignedPropertyIds.length > 0) {
      recentPayQuery += " AND p.property_id = ANY($1)";
      recentPayParams.push(scope.assignedPropertyIds);
    }
    recentPayQuery += " ORDER BY p.payment_date DESC LIMIT 15";

    let arQuery = "SELECT COALESCE(sum(COALESCE(balance_due, grand_total, 0)), 0) as total_due FROM invoices WHERE status IN ('sent', 'overdue')";
    const arParams: any[] = [];
    if (propertyId) {
      arQuery += " AND property_id = $1";
      arParams.push(propertyId);
    } else if (scope.assignedPropertyIds.length > 0) {
      arQuery += " AND property_id = ANY($1)";
      arParams.push(scope.assignedPropertyIds);
    }

    let vbQuery = "SELECT * FROM vendor_bills WHERE 1=1";
    const vbParams: any[] = [];
    if (propertyId) {
      vbQuery += " AND property_id = $1";
      vbParams.push(propertyId);
    } else if (scope.assignedPropertyIds.length > 0) {
      vbQuery += " AND property_id = ANY($1)";
      vbParams.push(scope.assignedPropertyIds);
    }
    vbQuery += " ORDER BY bill_date DESC LIMIT 50";

    let bgQuery = `
      SELECT b.*, h.name as head_name, h.code as head_code
      FROM budget_entries b
      LEFT JOIN budget_heads h ON h.id = b.budget_head_id
      WHERE 1=1
    `;
    const bgParams: any[] = [];
    if (propertyId) {
      bgQuery += " AND h.property_id = $1";
      bgParams.push(propertyId);
    } else if (scope.assignedPropertyIds.length > 0) {
      bgQuery += " AND h.property_id = ANY($1)";
      bgParams.push(scope.assignedPropertyIds);
    }
    bgQuery += " ORDER BY b.period_month ASC";

    let taxQuery = "SELECT * FROM tax_filings WHERE 1=1";
    const taxParams: any[] = [];
    if (propertyId) {
      taxQuery += " AND property_id = $1";
      taxParams.push(propertyId);
    } else if (scope.assignedPropertyIds.length > 0) {
      taxQuery += " AND property_id = ANY($1)";
      taxParams.push(scope.assignedPropertyIds);
    }
    taxQuery += " ORDER BY period_end DESC";

    const [invoiceRows, paymentRows, recentRows, arRows, vendorBills, budgetRows, taxRows] = await Promise.all([
      sql.query(invQuery, invParams),
      sql.query(payQuery, payParams),
      sql.query(recentPayQuery, recentPayParams),
      sql.query(arQuery, arParams),
      sql.query(vbQuery, vbParams),
      sql.query(bgQuery, bgParams),
      sql.query(taxQuery, taxParams),
    ]);

    const totalRevenue = (paymentRows as { amount: string }[]).reduce((s, p) => s + Number(p.amount || 0), 0);
    
    // Calculate MTD revenue for current month; if 0 (e.g. demo data is in earlier months), find latest month with payments
    let mtdRevenue = 0;
    const currentMonthStr = startOfMonth.toISOString().slice(0, 7);
    (paymentRows as { payment_date: string; amount: string }[]).forEach(p => {
      if (p.payment_date && p.payment_date.startsWith(currentMonthStr)) {
        mtdRevenue += Number(p.amount || 0);
      }
    });
    if (mtdRevenue === 0 && paymentRows.length > 0) {
      // Find latest year-month in payments
      let latestYm = "";
      (paymentRows as { payment_date: string }[]).forEach(p => {
        if (p.payment_date) {
          const ym = p.payment_date.slice(0, 7);
          if (ym > latestYm) latestYm = ym;
        }
      });
      if (latestYm) {
        (paymentRows as { payment_date: string; amount: string }[]).forEach(p => {
          if (p.payment_date && p.payment_date.startsWith(latestYm)) {
            mtdRevenue += Number(p.amount || 0);
          }
        });
      }
    }

    const byMethod: Record<string, number> = {};
    (paymentRows as { payment_method: string; amount: string }[]).forEach(p => {
      const m = p.payment_method || "other";
      byMethod[m] = (byMethod[m] || 0) + Number(p.amount || 0);
    });

    const outstandingAR = Number(arRows[0]?.total_due || 0);
    const totalVendorPayouts = (vendorBills as any[]).reduce((s, b) => s + Number(b.paid_total || b.grand_total || 0), 0);
    const totalVendorBills = (vendorBills as any[]).reduce((s, b) => s + Number(b.grand_total || 0), 0);

    return NextResponse.json({
      invoices: invoiceRows,
      mtdRevenue,
      totalRevenue,
      byMethod,
      recentPayments: recentRows,
      outstandingAR,
      vendorBills,
      totalVendorPayouts,
      totalVendorBills,
      budget: budgetRows,
      taxFilings: taxRows,
    });
  } catch (error) {
    console.error("[finance GET]", error);
    return NextResponse.json({ error: "Failed to fetch finance data" }, { status: 500 });
  }
}
