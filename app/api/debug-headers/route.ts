import { NextResponse } from "next/server";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const headerList = await headers();
    const allHeaders: Record<string, string> = {};
    headerList.forEach((value, key) => {
      allHeaders[key] = value;
    });
    return NextResponse.json({
      requestHeaders: allHeaders,
      url: req.url,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
