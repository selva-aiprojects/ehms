import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    
    // Fetch the single settings row
    const settings = (await sql`
      SELECT * FROM system_settings LIMIT 1
    `) as any;

    if (settings.length === 0) {
      // Return defaults if not found (fallback)
      return NextResponse.json({
        data: {
          company_name: 'eHMS',
          logo_url: '/eHMS_logo.png',
          primary_color: '#1A3C5E',
          secondary_color: '#2BAE8E',
          currency_symbol: '₹',
          timezone: 'Asia/Kolkata'
        }
      });
    }

    return NextResponse.json({ data: settings[0] });
  } catch (error: any) {
    console.error("[settings GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    
    const {
      company_name,
      logo_url,
      primary_color,
      secondary_color,
      currency_symbol,
      timezone
    } = body;

    // We assume there's always one row since we seeded it
    const updated = (await sql`
      UPDATE system_settings
      SET 
        company_name = COALESCE(${company_name}, company_name),
        logo_url = COALESCE(${logo_url}, logo_url),
        primary_color = COALESCE(${primary_color}, primary_color),
        secondary_color = COALESCE(${secondary_color}, secondary_color),
        currency_symbol = COALESCE(${currency_symbol}, currency_symbol),
        timezone = COALESCE(${timezone}, timezone),
        updated_at = NOW()
      RETURNING *
    `) as any;

    if (updated.length === 0) {
      // If table was empty, insert the first row
      const inserted = (await sql`
        INSERT INTO system_settings (
          company_name, logo_url, primary_color, secondary_color, currency_symbol, timezone
        ) VALUES (
          ${company_name || 'eHMS'},
          ${logo_url || '/eHMS_logo.png'},
          ${primary_color || '#1A3C5E'},
          ${secondary_color || '#2BAE8E'},
          ${currency_symbol || '₹'},
          ${timezone || 'Asia/Kolkata'}
        )
        RETURNING *
      `) as any;
      return NextResponse.json({ data: inserted[0] });
    }

    return NextResponse.json({ data: updated[0] });
  } catch (error: any) {
    console.error("[settings PUT]", error);
    return NextResponse.json({ error: error?.message || "Failed to update settings" }, { status: 500 });
  }
}
