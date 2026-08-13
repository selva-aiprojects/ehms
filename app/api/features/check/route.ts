import { NextRequest, NextResponse } from "next/server";
import { getFeatureCheckResult } from "@/lib/features/server";
import { buildFeatureContext } from "@/lib/features/api";
import type { FeatureFlagContext, FEATURE_FLAGS } from "@/lib/features/types";

type FlagKey = keyof typeof FEATURE_FLAGS;

interface CheckBody {
  flagKey?: string;
  context?: Partial<FeatureFlagContext>;
}

export async function POST(req: NextRequest) {
  let body: CheckBody;
  try {
    body = (await req.json()) as CheckBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const flagKey = body.flagKey;
  if (!flagKey) {
    return NextResponse.json({ error: "flagKey is required" }, { status: 400 });
  }

  try {
    const context = await buildFeatureContext(req, body.context);
    const result = await getFeatureCheckResult(flagKey as FlagKey, context);
    return NextResponse.json({ result });
  } catch (error) {
    console.error("[features/check POST]", error);
    const message = error instanceof Error ? error.message : "Failed to check feature";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
