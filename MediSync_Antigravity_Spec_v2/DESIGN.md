# MediSync — UI/UX Design v3 — 21st.dev Inspired Light Blue System

## Design Goal

The evaluator should think:

> “This looks like a real health-tech operations product.”

Not:

> “This is a college CRUD dashboard.”

## Visual Language

**21st.dev-inspired × Linear × modern health-tech × clinical operations**

The product is **light theme only**, with a cohesive blue visual system. See `DESIGN_SYSTEM_21ST.md` for the exact token and interaction contract.

### Typography

- Geist or Inter.
- Strong display heading.
- Compact dashboard labels.
- Tabular numbers for metrics.

### Surfaces

- Light theme only.
- White and near-white blue-tinted surfaces.
- Blue is the primary brand family.
- Soft 1px borders before shadows.
- Restrained shadows.
- 10–24px radius depending on component.
- High-quality 8px spacing rhythm.
- Mostly solid surfaces.
- Subtle blue gradients/glows only where they improve hierarchy.
- Use 21st.dev patterns such as bento grids, spotlight cards, shimmer CTA, command palette, drawer, timeline and skeletons selectively.

### Icons

Lucide.

No emoji as core UI.

## Landing

Hero:

**From symptom to priority — without the waiting-room guesswork.**

Subtext:

**MediSync streamlines patient intake and gives care teams a clear, explainable priority queue.**

CTA:

`Start Patient Intake`

Secondary:

`View Doctor Dashboard`

Hero visualization:

```text
INTAKE
   ↓
PROCESSING
   ↓
PRIORITY
   ↓
DOCTOR QUEUE
```

Animate the flow subtly.

## Patient Intake

Stepper:

```text
01 Basic Info
02 Symptoms
03 Review
04 Submitted
```

Main card:

**Tell us what is happening**

Toggle:

`Type | Speak`

### Speak

States:

- Idle.
- Recording.
- Transcribing.
- Transcript ready.
- Error.

Use:

- microphone control
- waveform
- timer
- transcript editor

### Type

Large textarea.

Add:

- character count
- image upload
- optional notes

## Review

Create a calm summary.

Show:

- Patient.
- Symptoms.
- Duration.
- Intake method.
- Attachment.

CTA:

`Submit for Initial Triage`

## Success

Large confirmation:

**Intake received.**

Show:

- case reference
- timestamp
- priority generated
- care team review pending

## Doctor Dashboard

Sidebar:

```text
Overview
Triage Queue
Patients
SCM / Configuration
```

Top:

- search
- notifications
- live status
- demo doctor

Metrics:

```text
CRITICAL     HIGH       WAITING       RESOLVED
   03          05          08            21
```

Queue:

| Priority | Case | Symptoms | Wait | Status | Action |
|---|---|---|---|---|---|

Desktop uses table.

Mobile uses cards.

## Live State

Top-right:

`● LIVE`

and:

`Updated just now`

When a new case arrives:

- brief row highlight.
- subtle entrance animation.
- no intrusive sound.

## Case Drawer

Open from right.

Sections:

### Patient

Display identifier and age.

### Priority

Large:

`HIGH`

`78 / 100`

### Why this priority?

```text
Severity indicator       +30
Duration                 +18
Warning signal           +30
```

### Rule profile

`triage-v1.2`

### Safety

`Initial triage suggestion — clinician review required.`

### Timeline

```text
14:02 Intake received
14:02 Triage completed
14:02 Added to queue
14:06 Doctor opened case
```

### Status

`Waiting → In Review → In Consultation → Resolved`

## SCM Screen

This should be one of the most visually distinctive screens.

Header:

**Configuration Control**

Subtext:

`Track controlled artifacts, changes and approved baselines.`

### CI table

Show:

- Configuration ID.
- Module.
- Version.
- Owner.
- Status.
- Last modified.
- Baseline.

### Workflow

Create a horizontal desktop / vertical mobile stepper:

```text
MODIFY
  ↓
COMMIT
  ↓
VERSION
  ↓
REVIEW
  ↓
APPROVE
  ↓
BASELINE
  ↓
MERGE
  ↓
DEPLOY
```

### Activity timeline

Examples:

`config: update triage rules`
`feat: add realtime queue`
`review: approve baseline-03`

Use synthetic values if actual SCM data is not directly connected.

## Motion

Use Motion for:

- Hero flow.
- Drawer.
- Queue insertion.
- Step transitions.
- Skeleton shimmer only if tasteful.

Avoid:

- bouncing everything
- parallax
- excessive page transitions
- long animation durations

## Responsive

### Mobile patient

One column.

Large touch targets.

Sticky primary CTA where helpful.

### Mobile doctor

Collapsible sidebar.

Queue cards.

Full-screen case drawer.

### Desktop

Sidebar + dense queue + right drawer.

## 21st.dev Strategy

Use 21st.dev as a component source/inspiration.

Search:

- dashboard sidebar
- animated hero
- metric cards
- command menu
- data table
- activity timeline
- microphone UI
- file upload
- drawer
- stepper
- empty state
- skeleton

Adapt each component to the MediSync design system.

## Quality Bar

Before calling the UI complete:

- No default inputs.
- No browser alerts.
- No placeholder lorem ipsum.
- No dead buttons.
- No inconsistent spacing.
- No random colours.
- No broken mobile layout.
- No colour-only priority.
- No fake medical claims.


## 21st.dev Styling Requirements

Use `DESIGN_SYSTEM_21ST.md` as the binding visual contract.

### Required
- Light theme only.
- Blue-first palette.
- shadcn-style CSS variables and semantic tokens.
- OKLCH token values where supported.
- Consistent typography, radius, borders and shadows.
- Carefully selected 21st.dev-inspired interactions.

### Landing-page signature components
- Premium animated hero.
- Bento feature grid.
- Subtle blue spotlight/hover treatment.
- One restrained shimmer/highlight CTA.
- Workflow animation.

### Product signature components
- Patient multi-step intake.
- Voice recorder/waveform.
- AI processing steps.
- Explainable priority score card.
- Doctor queue table.
- Right-side patient case drawer.
- Realtime live indicator/toast.
- SCM timeline/commit history.

Do not import components with incompatible colors or a dark theme and leave them unchanged. Adapt every selected component to the MediSync token system.
