# MediSync — Development Phases v2

## Strategy

Build a polished vertical slice first.

Do not spend the first week building infrastructure.

The first complete slice should be:

```text
Patient Intake
    ↓
Triage
    ↓
Doctor Queue
    ↓
Case Review
```

Then add realtime, authentication, storage and SCM presentation.

---

## Phase 0 — Repository + Sapling

### Both

- Create repository.
- Initialize Sapling.
- Add project specification files.
- Create README.
- Create `.env.example`.
- Define ownership.

### Member A

- Create frontend skeleton.

### Member B

- Create Supabase project/schema foundation.

---

## Phase 1 — Design System

### Member A

Build:

- Typography.
- Colours.
- Spacing.
- Buttons.
- Inputs.
- Cards.
- Badges.
- Drawer.
- Table.
- Stepper.
- Skeleton.
- Toasts.

### Goal

A visually complete application shell before backend complexity.

---

## Phase 2 — Patient Intake

### Member A

- Landing page.
- Basic information.
- Symptoms.
- Duration.
- Image upload UI.
- Review.
- Success.

### Member B

- Database schema.
- Intake insert logic.
- Validation.
- Seed data.

---

## Phase 3 — Triage Engine

### Member B

- `ai_scoring_rules.json`.
- Scoring engine.
- Priority thresholds.
- Factor generation.
- Unit tests.

### Member A

- Priority result UI.
- Explainability UI.

---

## Phase 4 — Doctor Dashboard

### Member A

- Sidebar.
- KPI cards.
- Queue.
- Filters.
- Case drawer.
- Timeline.

### Member B

- Query functions.
- Summary API.
- Status update API.
- RLS policies.

---

## Phase 5 — Realtime

### Member B

Configure Supabase Realtime.

### Member A

Build:

- Live indicator.
- New-case animation.
- Queue update state.

### Demo

Submit patient case in one window.

Show it appearing in the doctor dashboard without a manual refresh.

---

## Phase 6 — Voice

### Member A

- Microphone UX.
- Recording states.
- Transcript editing.

### Member B

- Speech adapter abstraction.
- Optional local STT integration.
- Configuration.

### Fallback

Text entry must always work.

---

## Phase 7 — Authentication

### Member B

- Supabase Auth.
- Roles.
- RLS.

### Member A

- Login screens.
- Doctor demo mode.
- Patient mode.

---

## Phase 8 — Storage

### Member B

- Private storage bucket.
- Upload policy.
- File metadata.

### Member A

- Preview.
- Remove/replace.
- Upload states.

---

## Phase 9 — SCM / Configuration Control

### Both

Create:

- Configuration item table.
- SCM activity.
- Baseline visualization.
- Change-control timeline.

### Member B

Connect actual configuration metadata where appropriate.

### Member A

Make the SCM screen presentation-quality.

---

## Phase 10 — Quality

### Both

- Responsive testing.
- Accessibility.
- Error states.
- Empty states.
- Loading states.
- E2E.
- Security review.
- Demo fallback.

---

## Phase 11 — Presentation Hardening

### Demo sequence

1. Landing.
2. Patient intake.
3. Voice or text.
4. Submit.
5. Priority.
6. Doctor dashboard.
7. Realtime appearance.
8. Case drawer.
9. Explain score.
10. Change status.
11. SCM page.
12. Configuration items.
13. Sapling Smartlog.

---

# Two-Member Ownership

## Member A — Product + Frontend

Own:

- Design system.
- Landing.
- Patient flow.
- Voice UI.
- Image upload UI.
- Doctor dashboard.
- Case drawer.
- Animations.
- Accessibility.
- Responsive design.

## Member B — Platform + Data + SCM

Own:

- Supabase.
- Database.
- RLS.
- Triage engine.
- Realtime.
- Auth.
- Storage.
- Speech adapter.
- Configuration.
- Sapling.

## Shared

- Architecture.
- Integration.
- Testing.
- Final demo.
- Presentation.

---

# Integration Rule

Integrate every phase.

Do not let one person work independently for the entire project and merge at the end.

Recommended rhythm:

```text
Small change
 ↓
Test
 ↓
Sapling commit
 ↓
Review
 ↓
Integrate
 ↓
Next change
```
