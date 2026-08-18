import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed: JPEG, PNG, GIF, WebP, HEIC` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 10MB` },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const uniqueId = crypto.randomUUID();
    const filename = `${uniqueId}.${ext}`;

    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);

    const baseUrl = process.env.UPLOAD_BASE_URL || "/uploads";
    const url = `${baseUrl}/${filename}`;

    let dbRecord: Record<string, unknown> | null = null;
    try {
      const sql = getDb();
      const result = await sql`
        INSERT INTO uploaded_files (id, filename, original_name, mime_type, size, url, uploaded_by)
        VALUES (${uniqueId}, ${filename}, ${file.name}, ${file.type}, ${file.size}, ${url}, ${payload.user_id})
        RETURNING id, filename, original_name, mime_type, size, url, created_at
      `;
      dbRecord = (result as Record<string, unknown>[])[0] || null;
    } catch (dbErr) {
      // Table may not exist yet — file is still saved on disk, proceed without DB record
      console.warn("[upload] skipped DB insert:", (dbErr as Error).message);
    }

    return NextResponse.json(
      {
        data: {
          id: dbRecord?.id || uniqueId,
          url: dbRecord?.url || url,
          filename: dbRecord?.original_name || file.name,
          size: dbRecord?.size || file.size,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Upload failed";
    console.error("[upload POST]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
