import { NextRequest, NextResponse } from "next/server";
import { canEnableFeature } from "@/lib/features/server";
import { buildFeatureContext } from "@/lib/features/api";
import type { FEATURE_FLAGS } from "@/lib/features/types";

type FlagKey = keyof typeof FEATURE_FLAGS;

export async function GET(req: NextRequest) {
  const flag = new URL(req.url).searchParams.get("flag");

  if (!flag) {
    return NextResponse.json({ error: "flag query param is required" }, { status: 400 });
  }

  try {
    const context = await buildFeatureContext(req);
    const result = await canEnableFeature(flag as FlagKey, context);

    return NextResponse.json({
      missing_flags: result.blocking_flags,
      blocking_flags: result.blocking_flags,
      conflicting_flags: result.conflicting_flags,
      can_enable: result.can_enable,
      reason: result.reason,
    });
  } catch (error) {
    console.error("[features/check-dependencies GET]", error);
    const message =
      error instanceof Error ? error.message : "Failed to check dependencies";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
