import { NextRequest, NextResponse } from "next/server";
import { getFeatureMetrics } from "@/lib/features/server";
import type { FEATURE_FLAGS } from "@/lib/features/types";

type FlagKey = keyof typeof FEATURE_FLAGS;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ flag: string }> }
) {
  const { flag } = await params;

  try {
    const metrics = await getFeatureMetrics(flag as FlagKey);
    return NextResponse.json(metrics || []);
  } catch (error) {
    console.error("[features/metrics GET]", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch feature metrics";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
