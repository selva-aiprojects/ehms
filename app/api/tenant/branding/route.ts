import { NextRequest, NextResponse } from "next/server";
import { getPublicDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

const DEFAULT_BRANDING = {
  primary_color: "#2BAE8E",
  secondary_color: "#1A3C5E",
  accent_color: "#D4A853",
  sidebar_color: "#2C3547",
  logo_url: "/eHMS_logo.png",
  company_name: "eHMS",
};

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantCode = payload.tenant_code;
    if (!tenantCode) {
      return NextResponse.json({ error: "No tenant context" }, { status: 400 });
    }

    const db = getPublicDb();
    const rows = await db`
      SELECT config FROM public.tenants WHERE code = ${tenantCode} LIMIT 1
    `;
    const row = (rows as Record<string, unknown>[])[0];
    if (!row) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const config = (row.config as Record<string, unknown>) || {};
    const branding = (config.branding as Record<string, unknown>) || {};
    const merged = { ...DEFAULT_BRANDING, ...branding };

    return NextResponse.json({ branding: merged });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to load branding";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantCode = payload.tenant_code;
    if (!tenantCode) {
      return NextResponse.json({ error: "No tenant context" }, { status: 400 });
    }

    const body = await req.json();
    const { primary_color, secondary_color, accent_color, sidebar_color, logo_url, company_name } = body;

    const db = getPublicDb();

    const rows = await db`
      SELECT config FROM public.tenants WHERE code = ${tenantCode} LIMIT 1
    `;
    const row = (rows as Record<string, unknown>[])[0];
    if (!row) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const currentConfig = (row.config as Record<string, unknown>) || {};
    const currentBranding = (currentConfig.branding as Record<string, unknown>) || {};

    const newBranding: Record<string, unknown> = { ...currentBranding };

    if (primary_color !== undefined) newBranding.primary_color = primary_color;
    if (secondary_color !== undefined) newBranding.secondary_color = secondary_color;
    if (accent_color !== undefined) newBranding.accent_color = accent_color;
    if (sidebar_color !== undefined) newBranding.sidebar_color = sidebar_color;
    if (logo_url !== undefined) newBranding.logo_url = logo_url;
    if (company_name !== undefined) newBranding.company_name = company_name;

    const newConfig = { ...currentConfig, branding: newBranding };

    await db`
      UPDATE public.tenants
      SET config = ${JSON.stringify(newConfig)}::jsonb, updated_at = now()
      WHERE code = ${tenantCode}
    `;

    const merged = { ...DEFAULT_BRANDING, ...newBranding };
    return NextResponse.json({ branding: merged });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update branding";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
