import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, age, conditions, symptoms, duration, score, priority, factors, caseReference, medicalImage } = body;

    if (!fullName || !symptoms) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const patientId = `p-${randomUUID()}`;
    const caseId = `c-${randomUUID()}`;
    const ref = caseReference || `MS-${Math.floor(1000 + Math.random() * 9000)}`;

    const insertPatient = db.prepare(`
      INSERT INTO patients (id, full_name, age, conditions, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `);

    const insertCase = db.prepare(`
      INSERT INTO cases (
        id, patient_id, case_reference, symptoms, duration,
        score, priority, status, triage_factors, medical_image, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Waiting', ?, ?, datetime('now'), datetime('now'))
    `);

    const transaction = db.transaction(() => {
      insertPatient.run(
        patientId,
        fullName,
        parseInt(age) || 30,
        conditions || ""
      );

      insertCase.run(
        caseId,
        patientId,
        ref,
        symptoms,
        duration || "Not specified",
        score || 0,
        priority || "LOW",
        JSON.stringify(factors || []),
        medicalImage || null
      );
    });

    transaction();

    return NextResponse.json({
      success: true,
      caseId,
      caseReference: ref,
    });
  } catch (error: any) {
    console.error("Failed to submit intake to SQLite:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
