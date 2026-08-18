import { NextRequest, NextResponse } from "next/server";
import { checkFeatures } from "@/lib/features/server";
import { buildFeatureContext } from "@/lib/features/api";
import type { FeatureFlagContext, FEATURE_FLAGS } from "@/lib/features/types";

type FlagKey = keyof typeof FEATURE_FLAGS;

interface BatchBody {
  flagKeys?: string[];
  context?: Partial<FeatureFlagContext>;
}

export async function POST(req: NextRequest) {
  let body: BatchBody;
  try {
    body = (await req.json()) as BatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const flagKeys = body.flagKeys;
  if (!Array.isArray(flagKeys) || flagKeys.length === 0) {
    return NextResponse.json(
      { error: "flagKeys array is required" },
      { status: 400 }
    );
  }

  try {
    const context = await buildFeatureContext(req, body.context);
    const results = await checkFeatures(flagKeys as FlagKey[], context);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("[features/check-batch POST]", error);
    const message =
      error instanceof Error ? error.message : "Failed to check features";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
