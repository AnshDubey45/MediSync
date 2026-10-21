const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { db, reseed } = require("./src/db");
const { calculateTriage } = require("./src/triage/engine");
const scmRoutes = require("./src/scm/routes");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// ── Sapling SCM Routes ──
app.use("/api/scm", scmRoutes);

// ── Health Check ──
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", database: "sqlite", timestamp: new Date().toISOString() });
});

// ── Admin Authentication ──
const ADMIN_ACCOUNTS = [
  {
    name: "Neeraj Maurya",
    email: "neeraj@medisync.health",
    aliases: ["neeraj", "neerajmaurya1910@gmail.com", "neeraj@gmail.com"],
    password: process.env.NEERAJ_PASSWORD || "neeraj123",
    role: "Administrator (Lead)",
  },
  {
    name: "Ansh Dubey",
    email: "ansh@medisync.health",
    aliases: ["ansh", "ansh.dubey4566@gmail.com", "ansh@gmail.com"],
    password: process.env.ANSH_PASSWORD || "ansh123",
    role: "Administrator (Core)",
  },
  {
    name: "System Administrator",
    email: "admin@medisync.health",
    aliases: ["admin"],
    password: process.env.ADMIN_PASSWORD || "admin123",
    role: "System Administrator",
  },
];

app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Email/Username and password are required." });
  }

  const inputId = email.trim().toLowerCase();
  const account = ADMIN_ACCOUNTS.find(
    (acc) =>
      acc.email.toLowerCase() === inputId ||
      acc.aliases.some((alias) => alias.toLowerCase() === inputId)
  );

  if (account && account.password === password) {
    return res.json({
      success: true,
      message: `Welcome, ${account.name}! Authentication successful.`,
      admin: {
        name: account.name,
        email: account.email,
        role: account.role,
        authenticatedAt: new Date().toISOString(),
      },
      token: "medisync_admin_" + Date.now(),
    });
  }

  return res.status(401).json({
    success: false,
    error: "Invalid email or password. Access denied.",
  });
});

// ── GET /api/cases ──
app.get("/api/cases", (req, res) => {
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

    const rows = stmt.all();

    const formattedCases = rows.map((row) => {
      let factors = [];
      try {
        factors = JSON.parse(row.triage_factors);
      } catch (e) {
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

    res.json({ success: true, data: formattedCases });
  } catch (err) {
    console.error("GET /api/cases error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH /api/cases/:id ──
app.patch("/api/cases/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["Waiting", "Reviewing", "Resolved"].includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status value" });
    }

    const stmt = db.prepare(`
      UPDATE cases
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `);

    const result = stmt.run(status, id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: "Case not found" });
    }

    res.json({ success: true, id, status });
  } catch (err) {
    console.error("PATCH /api/cases/:id error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/intake ──
app.post("/api/intake", (req, res) => {
  try {
    const { fullName, age, conditions, symptoms, duration, score, priority, factors, caseReference, medicalImage } = req.body;

    if (!fullName || !symptoms) {
      return res.status(400).json({ success: false, error: "Missing required patient name or symptoms" });
    }

    let calculatedScore = score;
    let calculatedPriority = priority;
    let calculatedFactors = factors;

    if (calculatedScore === undefined || !calculatedPriority) {
      const triage = calculateTriage({
        age: parseInt(age) || 30,
        symptoms,
        duration: duration || "",
        conditions: conditions || "",
      });
      calculatedScore = triage.score;
      calculatedPriority = triage.priority;
      calculatedFactors = triage.factors;
    }

    const patientId = `p-${crypto.randomUUID()}`;
    const caseId = `c-${crypto.randomUUID()}`;
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
      insertPatient.run(patientId, fullName, parseInt(age) || 30, conditions || "");
      insertCase.run(
        caseId,
        patientId,
        ref,
        symptoms,
        duration || "Not specified",
        calculatedScore || 0,
        calculatedPriority || "LOW",
        JSON.stringify(calculatedFactors || []),
        medicalImage || null
      );
    });

    transaction();

    res.json({
      success: true,
      caseId,
      caseReference: ref,
      score: calculatedScore,
      priority: calculatedPriority,
    });
  } catch (err) {
    console.error("POST /api/intake error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/patients ──
app.get("/api/patients", (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT 
        p.id,
        p.full_name,
        p.age,
        p.conditions,
        p.created_at,
        COUNT(c.id) as total_cases,
        MAX(c.created_at) as last_visit
      FROM patients p
      LEFT JOIN cases c ON p.id = c.patient_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);

    const patients = stmt.all();

    const casesStmt = db.prepare(`SELECT * FROM cases ORDER BY created_at DESC`);
    const allCases = casesStmt.all();

    const formatted = patients.map((p) => {
      const patientCases = allCases.filter((c) => c.patient_id === p.id);
      const latestCase = patientCases[0] || null;

      let factors = [];
      if (latestCase && latestCase.triage_factors) {
        try {
          factors = JSON.parse(latestCase.triage_factors);
        } catch (e) {
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

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error("GET /api/patients error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/settings/reseed ──
app.post("/api/settings/reseed", (req, res) => {
  try {
    db.exec("DELETE FROM cases;");
    db.exec("DELETE FROM patients;");
    reseed();
    res.json({ success: true, message: "Database re-seeded with demo records" });
  } catch (err) {
    console.error("POST /api/settings/reseed error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[MediSync Backend] Server running on http://localhost:${PORT}`);
});
