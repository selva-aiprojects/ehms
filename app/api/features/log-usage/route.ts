import { NextRequest, NextResponse } from "next/server";
import { logFeatureUsage } from "@/lib/features/server";
import { buildFeatureContext } from "@/lib/features/api";
import type { FeatureFlagContext, FEATURE_FLAGS } from "@/lib/features/types";

type FlagKey = keyof typeof FEATURE_FLAGS;

interface LogUsageBody {
  flagKey?: string;
  context?: Partial<FeatureFlagContext>;
}

export async function POST(req: NextRequest) {
  let body: LogUsageBody;
  try {
    body = (await req.json()) as LogUsageBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const flagKey = body.flagKey;
  if (!flagKey) {
    return NextResponse.json({ error: "flagKey is required" }, { status: 400 });
  }

  try {
    const context = await buildFeatureContext(req, body.context);
    await logFeatureUsage(flagKey as FlagKey, context);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[features/log-usage POST]", error);
    const message =
      error instanceof Error ? error.message : "Failed to log feature usage";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
