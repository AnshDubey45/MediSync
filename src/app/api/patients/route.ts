import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stmt = db.prepare(`
      SELECT 
        p.id,
        p.full_name,
        p.age,
        p.conditions,
        p.created_at,
        COUNT(c.id) as total_cases,
        MAX(c.created_at) as last_visit,
        GROUP_CONCAT(c.case_reference) as case_refs,
        GROUP_CONCAT(c.priority) as priorities,
        GROUP_CONCAT(c.status) as statuses
      FROM patients p
      LEFT JOIN cases c ON p.id = c.patient_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);

    const patients = stmt.all() as any[];

    // Also get the active/latest case for each patient
    const casesStmt = db.prepare(`
      SELECT * FROM cases ORDER BY created_at DESC
    `);
    const allCases = casesStmt.all() as any[];

    const formatted = patients.map((p) => {
      const patientCases = allCases.filter((c) => c.patient_id === p.id);
      const latestCase = patientCases[0] || null;

      let factors = [];
      if (latestCase?.triage_factors) {
        try {
          factors = JSON.parse(latestCase.triage_factors);
        } catch {
          factors = [];
        }
      }

      return {
        id: p.id,
        fullName: p.full_name,
        age: p.age,
        conditions: p.conditions || "None reported",
        createdAt: p.created_at,
        totalCases: p.total_cases || 0,
        lastVisit: p.last_visit || p.created_at,
        latestCase: latestCase
          ? {
              id: latestCase.id,
              caseReference: latestCase.case_reference,
              priority: latestCase.priority,
              score: latestCase.score,
              status: latestCase.status,
              symptoms: latestCase.symptoms,
              duration: latestCase.duration,
              createdAt: latestCase.created_at,
              factors,
            }
          : null,
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error("Failed to fetch patients:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
