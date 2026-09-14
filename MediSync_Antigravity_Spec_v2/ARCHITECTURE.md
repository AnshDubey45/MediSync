# MediSync — Architecture v2

## 1. Architecture Decision

Use a **TypeScript-first full-stack architecture** instead of forcing a separate Java/Spring backend.

### Core

- Next.js
- TypeScript
- Supabase
- PostgreSQL
- Supabase Realtime
- Supabase Storage
- Supabase Auth
- Next.js Route Handlers / Server Actions
- Local/configurable triage engine

This minimizes infrastructure while still giving MediSync a real backend, database, authentication, storage and realtime layer.

## 2. High-Level Architecture

```text
                         ┌──────────────────────────┐
                         │       Next.js App        │
                         │                          │
                         │ Patient UI               │
                         │ Doctor Dashboard         │
                         │ SCM / Configuration UI   │
                         └────────────┬─────────────┘
                                      │
                         ┌────────────┴─────────────┐
                         │ Next.js Server Layer     │
                         │ Route Handlers / Actions │
                         └────────────┬─────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
             ┌────────────┐   ┌─────────────┐   ┌────────────┐
             │ PostgreSQL │   │  Storage    │   │   Auth     │
             │  Supabase  │   │  Supabase   │   │ Supabase   │
             └─────┬──────┘   └─────────────┘   └────────────┘
                   │
                   │ database changes
                   ▼
             ┌──────────────┐
             │  Realtime    │
             └──────┬───────┘
                    │
                    ▼
             Doctor Queue updates
```

## 3. Why This Architecture

The project has only two developers.

A separate backend creates additional:

- language overhead.
- deployment complexity.
- authentication integration.
- API boilerplate.
- configuration management.

The full-stack TypeScript approach lets both members understand the same domain model.

## 4. Application Structure

```text
medisync/
├── app/
│   ├── (marketing)/
│   ├── intake/
│   ├── dashboard/
│   ├── patients/
│   ├── scm/
│   └── api/
├── components/
│   ├── ui/
│   ├── intake/
│   ├── dashboard/
│   ├── triage/
│   └── scm/
├── lib/
│   ├── supabase/
│   ├── api/
│   ├── triage/
│   ├── validation/
│   └── utils/
├── config/
│   ├── triage/
│   │   └── ai_scoring_rules.json
│   └── speech/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── tests/
├── public/
├── .cursorrules
├── PRD.md
├── DESIGN.md
├── PHASES.md
└── ARCHITECTURE.md
```

## 5. Database

Recommended tables:

### `patients`

```text
id
display_name
age
created_at
```

### `triage_cases`

```text
id
patient_id
symptoms
duration
intake_method
transcript
image_path
priority
score
status
rule_version
created_at
updated_at
```

### `triage_factors`

```text
id
case_id
factor_name
contribution
reason
```

### `configuration_items`

```text
id
name
module
version
owner
status
last_modified
baseline_tag
```

### `scm_changes`

```text
id
change_id
author
message
timestamp
review_status
baseline
```

## 6. Row-Level Security

Supabase RLS should be enabled.

Conceptual access:

- Patient can create/read only the intake session they own.
- Doctor role can read active cases.
- Doctor role can update case workflow status.
- Configuration/SCM data can be restricted to project/team users.

For the classroom demo, role simulation may be used, but the production architecture should still have explicit policies.

## 7. API / Server Functions

Suggested Next.js endpoints:

```text
POST /api/intake
GET  /api/cases
GET  /api/cases/:id
POST /api/cases/:id/triage
PATCH /api/cases/:id/status
GET  /api/dashboard/summary
GET  /api/configuration-items
GET  /api/scm/changes
```

The API layer should validate input with Zod before touching the database.

## 8. Triage Engine

```text
Input
 ↓
Normalize
 ↓
Extract configured signals
 ↓
Apply weights
 ↓
Calculate score
 ↓
Map threshold → priority
 ↓
Generate factors
 ↓
Persist result
```

The rules live in:

`config/triage/ai_scoring_rules.json`

The engine should be a pure/testable TypeScript module.

## 9. Example Rule Configuration

```json
{
  "version": "triage-v1.2",
  "thresholds": {
    "critical": 80,
    "high": 60,
    "medium": 35
  },
  "weights": {
    "severity": 40,
    "duration": 20,
    "warningSignal": 40
  }
}
```

These are prototype/demo values only and must not be presented as medical guidance.

## 10. Realtime Queue

Subscribe the doctor dashboard to relevant database changes.

```text
Patient submits
      ↓
Postgres INSERT
      ↓
Supabase Realtime
      ↓
Doctor Dashboard
      ↓
New case appears
```

This is stronger than a simulated “refresh” and avoids maintaining a custom WebSocket server.

## 11. Storage

Medical-image uploads go to a private Supabase Storage bucket.

Rules:

- Validate extension.
- Validate MIME type.
- Validate size.
- Generate safe path.
- Use access policies.
- Do not expose public buckets for patient images.

## 12. Authentication

Use Supabase Auth.

Demo roles:

```text
PATIENT
DOCTOR
ADMIN/SCM
```

For a classroom prototype, the landing page can offer:

- Patient Demo
- Doctor Demo

The real application should still keep authorization in the backend/data layer.

## 13. Speech Architecture

```text
                Speech Input
                     |
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       Browser    Local STT    Text
       Speech     adapter     fallback
       API        optional
          └──────────┼──────────┘
                     ▼
                 Transcript
                     ▼
                  Review
                     ▼
                  Submit
```

Speech should never silently submit an unreviewed transcript.

## 14. Deployment

```text
                Vercel
                  │
             Next.js app
                  │
        ┌─────────┼─────────┐
        ▼         ▼         ▼
    Supabase   Supabase   Supabase
     Auth       DB       Storage
                         +
                       Realtime
```

## 15. Local Development

The project must support a mock mode.

```text
NEXT_PUBLIC_DEMO_MODE=true
```

In demo mode:

- Seeded cases exist.
- Triage rules run locally.
- Optional backend calls can be bypassed.
- The UI remains fully navigable.

This protects the final presentation from network/service failures.

## 16. Testing

### Unit

- Triage score.
- Threshold mapping.
- Validation.
- Utility functions.

### Component

- Intake.
- Priority badge.
- Queue.
- Case drawer.

### E2E

- Submit intake.
- Verify case.
- Open dashboard.
- Update status.

## 17. Configuration Items

Keep the course's five CI concepts visible:

1. `application.yml` → application/runtime configuration representation.
2. `ai_scoring_rules.json` → actual triage rules.
3. `whisper_params.yaml` → optional speech configuration.
4. `nginx.conf` → deployment configuration if Nginx is used.
5. `database_schema.sql` → represented through Supabase migrations/schema.

The implementation should not pretend these files are active if the architecture no longer uses them directly.

## 18. SCM

Sapling remains the SCM layer.

The architecture therefore separates:

**Runtime architecture** from **configuration-management architecture**.

That distinction is important for the course.
