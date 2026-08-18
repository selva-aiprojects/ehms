import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const cycleId = searchParams.get("cycle_id");
    const employeeId = searchParams.get("employee_id");

    const rows = await sql`
      SELECT
        ar.*,
        json_build_object('id', e.id, 'employee_code', e.employee_code, 'designation', e.designation) AS employee,
        json_build_object('id', u.id, 'first_name', u.first_name, 'last_name', u.last_name, 'email', u.email) AS reviewer
      FROM appraisal_reviews ar
      LEFT JOIN employees e ON e.id = ar.employee_id
      LEFT JOIN users u ON u.id = ar.reviewer_id
      WHERE 1=1
        ${cycleId ? sql`AND ar.cycle_id = ${cycleId}` : sql``}
        ${employeeId ? sql`AND ar.employee_id = ${employeeId}` : sql``}
      ORDER BY ar.created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[hr/appraisal-reviews GET]", error);
    return NextResponse.json({ error: "Failed to fetch appraisal reviews" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const rows = await sql`
      INSERT INTO appraisal_reviews (
        cycle_id, employee_id, reviewer_id,
        self_rating, reviewer_rating, final_rating,
        self_comment, reviewer_comment, overall_score,
        status, submitted_at, reviewed_at
      ) VALUES (
        ${body.cycle_id}, ${body.employee_id}, ${body.reviewer_id},
        ${body.self_rating}, ${body.reviewer_rating}, ${body.final_rating},
        ${body.self_comment}, ${body.reviewer_comment}, ${body.overall_score},
        ${body.status}, ${body.submitted_at}, ${body.reviewed_at}
      )
      ON CONFLICT (cycle_id, employee_id)
      DO UPDATE SET
        reviewer_id = COALESCE(EXCLUDED.reviewer_id, appraisal_reviews.reviewer_id),
        self_rating = COALESCE(EXCLUDED.self_rating, appraisal_reviews.self_rating),
        reviewer_rating = COALESCE(EXCLUDED.reviewer_rating, appraisal_reviews.reviewer_rating),
        final_rating = COALESCE(EXCLUDED.final_rating, appraisal_reviews.final_rating),
        self_comment = COALESCE(EXCLUDED.self_comment, appraisal_reviews.self_comment),
        reviewer_comment = COALESCE(EXCLUDED.reviewer_comment, appraisal_reviews.reviewer_comment),
        overall_score = COALESCE(EXCLUDED.overall_score, appraisal_reviews.overall_score),
        status = COALESCE(EXCLUDED.status, appraisal_reviews.status),
        submitted_at = COALESCE(EXCLUDED.submitted_at, appraisal_reviews.submitted_at),
        reviewed_at = COALESCE(EXCLUDED.reviewed_at, appraisal_reviews.reviewed_at)
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[hr/appraisal-reviews POST]", error);
    return NextResponse.json({ error: "Failed to create/update appraisal review" }, { status: 500 });
  }
}
