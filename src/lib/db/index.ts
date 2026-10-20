import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "medisync.db");

// Singleton connection across hot-reloads
declare global {
  // eslint-disable-next-line no-var
  var __sqlite_db: Database.Database | undefined;
}

function getDatabase(): Database.Database {
  if (!global.__sqlite_db) {
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    initSchema(db);
    global.__sqlite_db = db;
  }
  return global.__sqlite_db;
}

function initSchema(db: Database.Database) {
  // Patients table
  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      age INTEGER NOT NULL,
      conditions TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Cases table
  db.exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      case_reference TEXT NOT NULL UNIQUE,
      symptoms TEXT NOT NULL,
      duration TEXT NOT NULL,
      score INTEGER NOT NULL,
      priority TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Waiting',
      triage_factors TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );
  `);

  // Seed with realistic demo cases if table is completely empty
  const countStmt = db.prepare("SELECT COUNT(*) as count FROM cases");
  const result = countStmt.get() as { count: number };

  if (result.count === 0) {
    seedInitialData(db);
  }
}

function seedInitialData(db: Database.Database) {
  const insertPatient = db.prepare(`
    INSERT INTO patients (id, full_name, age, conditions, created_at)
    VALUES (@id, @full_name, @age, @conditions, @created_at)
  `);

  const insertCase = db.prepare(`
    INSERT INTO cases (id, patient_id, case_reference, symptoms, duration, score, priority, status, triage_factors, created_at, updated_at)
    VALUES (@id, @patient_id, @case_reference, @symptoms, @duration, @score, @priority, @status, @triage_factors, @created_at, @updated_at)
  `);

  const seedPatients = [
    { id: "p-1", full_name: "Robert T.", age: 68, conditions: "Hypertension, Prior Angioplasty", created_at: new Date(Date.now() - 2 * 60000).toISOString() },
    { id: "p-2", full_name: "Emma W.", age: 34, conditions: "None", created_at: new Date(Date.now() - 8 * 60000).toISOString() },
    { id: "p-3", full_name: "David K.", age: 55, conditions: "Type 2 Diabetes", created_at: new Date(Date.now() - 12 * 60000).toISOString() },
    { id: "p-4", full_name: "James L.", age: 42, conditions: "Asthma", created_at: new Date(Date.now() - 16 * 60000).toISOString() },
    { id: "p-5", full_name: "Sarah M.", age: 28, conditions: "None", created_at: new Date(Date.now() - 25 * 60000).toISOString() },
  ];

  const seedCases = [
    {
      id: "c-1",
      patient_id: "p-1",
      case_reference: "MS-8492",
      symptoms: "Severe chest pain radiating to left arm, shortness of breath, dizziness.",
      duration: "30 minutes",
      score: 85,
      priority: "CRITICAL",
      status: "Waiting",
      triage_factors: JSON.stringify([
        { factor_name: "Critical Symptom Keyword", contribution: 40, reason: "Matched 'chest pain' - acute cardiac flag." },
        { factor_name: "Sudden Onset", contribution: 30, reason: "Symptoms developed within last 30 minutes." },
        { factor_name: "Age & Risk (65+)", contribution: 15, reason: "Patient age elevates cardiovascular risk." }
      ]),
      created_at: new Date(Date.now() - 2 * 60000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 60000).toISOString(),
    },
    {
      id: "c-2",
      patient_id: "p-2",
      case_reference: "MS-3102",
      symptoms: "High fever 103°F, severe headache, neck stiffness, light sensitivity.",
      duration: "6 hours",
      score: 65,
      priority: "HIGH",
      status: "Reviewing",
      triage_factors: JSON.stringify([
        { factor_name: "High Symptom Indicator", contribution: 25, reason: "Matched 'fever' and 'headache' - neurological/infection flag." },
        { factor_name: "Recent Onset", contribution: 40, reason: "Symptoms developed within last 24 hours." }
      ]),
      created_at: new Date(Date.now() - 8 * 60000).toISOString(),
      updated_at: new Date(Date.now() - 8 * 60000).toISOString(),
    },
    {
      id: "c-3",
      patient_id: "p-3",
      case_reference: "MS-7741",
      symptoms: "Acute upper abdominal pain, nausea and persistent vomiting.",
      duration: "2 hours",
      score: 70,
      priority: "HIGH",
      status: "Waiting",
      triage_factors: JSON.stringify([
        { factor_name: "High Symptom Indicator", contribution: 35, reason: "Severe abdominal distress - potential acute abdomen." },
        { factor_name: "Sudden Onset", contribution: 25, reason: "Symptoms began 2 hours ago." },
        { factor_name: "Age Factor (50+)", contribution: 10, reason: "Moderate age-based weighting." }
      ]),
      created_at: new Date(Date.now() - 12 * 60000).toISOString(),
      updated_at: new Date(Date.now() - 12 * 60000).toISOString(),
    },
    {
      id: "c-4",
      patient_id: "p-4",
      case_reference: "MS-9281",
      symptoms: "Persistent dry cough for 2 weeks, mild wheezing on exertion.",
      duration: "2 weeks",
      score: 45,
      priority: "MEDIUM",
      status: "Waiting",
      triage_factors: JSON.stringify([
        { factor_name: "Respiratory Factor", contribution: 10, reason: "Matched 'cough' and asthma background." },
        { factor_name: "Ongoing Issue", contribution: 35, reason: "Symptoms ongoing for over 7 days." }
      ]),
      created_at: new Date(Date.now() - 16 * 60000).toISOString(),
      updated_at: new Date(Date.now() - 16 * 60000).toISOString(),
    },
    {
      id: "c-5",
      patient_id: "p-5",
      case_reference: "MS-5512",
      symptoms: "Sprained right ankle while running this morning, mild swelling and bruising.",
      duration: "3 hours",
      score: 15,
      priority: "LOW",
      status: "Waiting",
      triage_factors: JSON.stringify([
        { factor_name: "Low Risk Category", contribution: 10, reason: "Localized musculoskeletal sprain." },
        { factor_name: "Recent Onset", contribution: 5, reason: "Occurred earlier today." }
      ]),
      created_at: new Date(Date.now() - 25 * 60000).toISOString(),
      updated_at: new Date(Date.now() - 25 * 60000).toISOString(),
    },
  ];

  const seedTransaction = db.transaction(() => {
    for (const p of seedPatients) insertPatient.run(p);
    for (const c of seedCases) insertCase.run(c);
  });

  seedTransaction();
}

export const db = getDatabase();
