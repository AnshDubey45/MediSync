import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stmt = db.prepare(`
      SELECT 
        c.id,
        c.case_reference,
        c.symptoms,
        c.duration,
        c.score,
        c.priority,
        c.status,
        c.triage_factors,
        c.medical_image,
        c.created_at,
        c.updated_at,
        p.full_name as patient_name,
        p.age as patient_age,
        p.conditions as patient_conditions
      FROM cases c
      JOIN patients p ON c.patient_id = p.id
      ORDER BY 
        CASE c.priority
          WHEN 'CRITICAL' THEN 1
          WHEN 'HIGH' THEN 2
          WHEN 'MEDIUM' THEN 3
          WHEN 'LOW' THEN 4
          ELSE 5
        END,
        c.score DESC,
        c.created_at DESC
    `);

    const rows = stmt.all() as any[];

    const formattedCases = rows.map((row) => {
      let factors = [];
      try {
        factors = JSON.parse(row.triage_factors);
      } catch {
        factors = [];
      }

      const diffMins = Math.floor((Date.now() - new Date(row.created_at).getTime()) / 60000);
      const waitTime = diffMins < 1 ? "Just now" : `${diffMins} min${diffMins > 1 ? "s" : ""}`;

      return {
        id: row.id,
        case_reference: row.case_reference,
        patientName: row.patient_name || "Unknown",
        age: row.patient_age || 0,
        priority: row.priority,
        score: row.score,
        symptoms: row.symptoms,
        duration: row.duration,
        medicalImage: row.medical_image || null,
        waitTime: waitTime,
        status: row.status,
        created_at: row.created_at,
        triageResult: {
          score: row.score,
          priority: row.priority,
          rule_version: "triage-v1.2",
          factors: factors,
        },
      };
    });

    return NextResponse.json({ success: true, data: formattedCases });
  } catch (error: any) {
    console.error("Failed to fetch cases from SQLite:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
