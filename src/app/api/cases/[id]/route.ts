import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !["Waiting", "Reviewing", "Resolved"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status value" },
        { status: 400 }
      );
    }

    const stmt = db.prepare(`
      UPDATE cases
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `);

    const result = stmt.run(status, id);

    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, error: "Case not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, id, status });
  } catch (error: any) {
    console.error("Failed to update case in SQLite:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
