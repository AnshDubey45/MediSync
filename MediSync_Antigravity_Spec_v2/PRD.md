# MediSync — Product Requirements Document

## 1. Product

**MediSync — A Software-Based Distributed Triage Ecosystem using Sapling SCM**

MediSync is a patient intake and initial triage platform. It addresses the manual triage problems described in the course proposal: long waiting times, delays in identifying critical cases, recording errors, difficulty handling large patient volumes, and uneven prioritization. The proposed workflow is patient voice/text intake → backend processing → AI/rules-based triage → doctor priority queue. fileciteturn0file0L43-L77

## 2. Product Principle

**AI assists prioritization; the clinician remains the decision-maker.**

The product must never present itself as a diagnosis engine.

Every AI/rules result should use language such as:

> Initial triage suggestion — clinician review required.

## 3. Goals

- Make patient intake fast and understandable.
- Support text and voice.
- Allow optional medical-image upload.
- Generate a transparent initial priority.
- Surface critical/high cases quickly.
- Give doctors a real-time queue.
- Make configuration management visible.
- Demonstrate Sapling SCM through actual project workflow.
- Build with a free/local-first stack.

## 4. Users

### Patient

Wants to describe their problem quickly and submit intake without navigating a complicated form.

### Doctor / Triage Staff

Needs a prioritized queue, case details, scoring explanation, and status controls.

### Evaluator

Needs to see product value, architecture, configuration control, versioning, review and baseline concepts.

## 5. Core Flow

```text
Patient
  ↓
Voice / Text Intake
  ↓
Validation
  ↓
Case Created
  ↓
Triage Rules Engine
  ↓
Priority + Explainable Factors
  ↓
Doctor Realtime Queue
  ↓
Case Review
  ↓
Status Update
```

## 6. Patient Requirements

### Intake

Collect:

- Demo patient name/identifier.
- Age.
- Symptoms.
- Symptom duration.
- Additional notes.
- Optional image.

### Voice

- Start recording.
- Show recording state.
- Convert speech to editable text.
- Allow correction.
- Submit corrected transcript.

### Image

- Upload common image format.
- Validate type and size.
- Preview.
- Remove/replace.
- Store securely.

The image is an intake attachment; the prototype must not claim that it diagnoses the image.

## 7. Doctor Requirements

Dashboard:

- Critical count.
- High count.
- Waiting count.
- Resolved count.
- Queue.
- Search.
- Filters.
- Live indicator.

Queue:

- Case reference.
- Patient display identifier.
- Priority.
- Score.
- Symptoms.
- Wait time.
- Status.

Case drawer:

- Patient snapshot.
- Symptoms.
- Transcript.
- Attachment.
- Score.
- Contributing factors.
- Rule version.
- Timeline.
- Status actions.

## 8. Priority

Levels:

- Critical.
- High.
- Medium.
- Low.

Priority must be represented with:

- Icon.
- Text.
- Badge.
- Colour as secondary reinforcement.

Never use colour alone.

## 9. Configuration / SCM

The course proposal identifies controlled configuration items including:

- `application.yml`
- `ai_scoring_rules.json`
- `whisper_params.yaml`
- `nginx.conf`
- `database_schema.sql`

and says each CI should record ID, module, version, owner, status, last modified date and baseline tag. fileciteturn0file0L78-L100

For the new architecture, these should be **adapted rather than blindly preserved**:

| Course CI | v2 implementation |
|---|---|
| application.yml | `.env.example` + runtime/application configuration |
| ai_scoring_rules.json | `config/triage/ai_scoring_rules.json` |
| whisper_params.yaml | Optional speech adapter configuration |
| nginx.conf | Deployment/reverse-proxy configuration only if needed |
| database_schema.sql | Supabase SQL migrations/schema |

The website's SCM page should still show the five course CIs so the evaluator can directly map the implementation to the proposal.

## 10. Configuration Control

The proposal defines:

```text
Modify
 ↓
Sapling Commit
 ↓
New Version
 ↓
Review
 ↓
Approval
 ↓
Baseline
 ↓
Merge
 ↓
Deploy
 ↓
Update Project Status
```

MediSync should make this workflow visible in the SCM screen. fileciteturn0file0L101-L113

## 11. Non-Goals

- Diagnosis.
- Prescription.
- Autonomous treatment.
- Real patient data.
- Mandatory paid AI.
- Production hospital integration.

## 12. Success Criteria

A complete demo can show:

**Patient submits → priority appears → doctor sees live case → doctor reviews explanation → status changes → SCM page shows controlled artifacts → Sapling history proves team workflow.**
