# MediSync — 21st.dev-Inspired Design System

## Purpose

This document is the visual contract for Antigravity.

MediSync must use a **light-first, blue health-tech visual system** inspired by the quality and interaction patterns found in the 21st.dev community. The goal is not to copy one creator's page. The goal is to combine polished community patterns into one coherent MediSync product.

21st.dev is a community registry of React/Tailwind components, screens and themes. Its current theme system is based on complete design tokens, including light-mode surfaces, primary/secondary/accent colors, borders, rings, typography, radius and shadows. Themes use OKLCH tokens for perceptually consistent palettes. Use the same token-driven approach here.

## Non-Negotiable Visual Direction

### Theme

- **Light theme only for MediSync.**
- No dark-mode toggle in the product UI.
- White / near-white application surfaces.
- Blue is the primary brand family.
- Blue-tinted backgrounds should be used instead of gray whenever a subtle tint improves hierarchy.
- Semantic colors may still use red/amber/green for clinical priority/status because status cannot depend on blue alone.
- Never use random colors from individual 21st.dev components.

### Product Personality

**Premium clinical operations + modern SaaS + calm health-tech.**

Reference feeling:

- Linear-level information hierarchy.
- Vercel-level whitespace and precision.
- Modern 21st.dev component polish.
- Healthcare-level trust and clarity.

Do not make the interface look like a generic hospital ERP.

## Core Palette

Use CSS variables / shadcn tokens. Prefer OKLCH values.

```css
:root {
  --background: oklch(0.985 0.006 250);
  --foreground: oklch(0.22 0.035 255);

  --card: oklch(1 0 0);
  --card-foreground: oklch(0.22 0.035 255);

  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.22 0.035 255);

  --primary: oklch(0.56 0.20 255);
  --primary-foreground: oklch(0.99 0.002 250);

  --secondary: oklch(0.95 0.025 250);
  --secondary-foreground: oklch(0.30 0.08 255);

  --muted: oklch(0.96 0.012 250);
  --muted-foreground: oklch(0.52 0.035 255);

  --accent: oklch(0.93 0.045 245);
  --accent-foreground: oklch(0.28 0.09 255);

  --destructive: oklch(0.60 0.20 25);
  --destructive-foreground: oklch(0.99 0 0);

  --border: oklch(0.90 0.018 250);
  --input: oklch(0.90 0.018 250);
  --ring: oklch(0.56 0.20 255);

  --radius: 0.85rem;
}
```

These are starting tokens, not permission to hard-code colors throughout components. All components must consume semantic tokens.

## Blue Scale

Use the blue family for:

- Primary actions.
- Links.
- Focus rings.
- Selected navigation.
- Active queue filters.
- Informational accents.
- Charts.
- Decorative glow.

Use a small number of blue tones:

```text
Blue 50   → page tint / selected background
Blue 100  → subtle surfaces
Blue 200  → borders / soft emphasis
Blue 400  → decorative accent
Blue 500  → interactive primary
Blue 600  → hover / stronger primary
Blue 700  → strong text accent
Blue 900  → high-contrast headings where appropriate
```

Do not use 15 different blues in one screen.

## Typography

Preferred:

1. Geist
2. Inter

Use a restrained scale.

- Display: bold, tight tracking.
- H1/H2: strong but not oversized.
- Body: comfortable 15–16px.
- Dashboard labels: 12–13px, medium/semibold.
- Metrics: tabular numbers.
- Case IDs / versions / commits: monospace where useful.

Avoid excessive all-caps text.

## Spacing

Use an 8px rhythm wherever practical:

```text
4   → micro gap
8   → icon/text gap
12  → compact gap
16  → normal gap
24  → card padding / section gap
32  → major section gap
48  → large section gap
64+ → landing-page section spacing
```

## Radius

Use rounded but controlled surfaces:

- Inputs: 10–12px.
- Buttons: 10–12px.
- Cards: 16px.
- Large feature panels: 20–24px.
- Pills/badges: full radius.

Avoid making every element a pill.

## Shadows

Prefer extremely soft elevation.

```text
Card: subtle border + almost invisible shadow
Hover: slightly stronger shadow
Drawer/dialog: stronger but still soft
Hero: very subtle blue-tinted glow
```

Avoid heavy black shadows.

## Borders

Default:

- 1px.
- low-contrast blue-gray.
- slightly stronger on interactive hover/focus.

Cards should usually have a border before a shadow.

## Backgrounds

Preferred hierarchy:

```text
Application background  → near-white blue tint
Card                   → white
Elevated card          → white + soft shadow
Selected surface       → pale blue
Primary CTA            → blue
```

Avoid full-page gradients.

## 21st.dev Interaction Patterns to Use

Use these as patterns, not as a visual free-for-all:

### 1. Bento Feature Grid

Use on landing page for:

- Voice intake
- Explainable triage
- Real-time queue
- SCM traceability

Cards can have subtle blue spotlight/hover treatment.

### 2. Animated Hero

Use a calm workflow animation:

```text
Patient → Voice/Text → Triage → Priority → Doctor
```

Animation must be slow and meaningful.

### 3. Shimmer / Highlight CTA

Use only on the primary landing CTA or one key action. Do not shimmer every button.

### 4. Spotlight / Cursor Glow

Use a subtle blue spotlight on hero/feature cards. Disable or reduce it for reduced-motion users.

### 5. Number Ticker

Use on doctor dashboard metrics when values change. Keep it short and functional.

### 6. Border / Hover Reveal

Use for feature cards and selected dashboard panels. Avoid animated borders on every card.

### 7. Command Palette

Doctor dashboard: `Ctrl/Cmd + K` for patient/case navigation.

### 8. Drawer / Sheet

Use for patient case details so the doctor does not lose queue context.

### 9. Timeline

Use for case activity and SCM history.

### 10. Skeleton Loading

Use skeletons matching the final layout. Avoid generic centered spinners where possible.

### 11. Toasts

Use for non-blocking events:

- New case received.
- Case status changed.
- Configuration approved.
- Upload completed.

### 12. Empty / Error / Success States

Every major screen needs a designed state rather than plain text.

## Landing Page Styling

### Hero

Light blue-tinted background with a mostly white content area.

Suggested structure:

```text
[small product badge]

From symptom to priority —
without the waiting-room guesswork.

MediSync streamlines patient intake and gives care teams
an explainable priority queue.

[Start Patient Intake]  [View Doctor Dashboard]

                    ┌──────────────────────────────┐
                    │  LIVE TRIAGE WORKFLOW         │
                    │                              │
                    │ Patient → Triage → Doctor   │
                    │       animated blue flow     │
                    └──────────────────────────────┘
```

### Feature Section

Use a bento layout rather than identical cards.

One large feature card + smaller supporting cards.

## Patient UI Styling

The patient experience should feel calm:

- More whitespace.
- Fewer controls visible at once.
- One obvious primary action.
- Large accessible inputs.
- Clear stepper.
- Soft blue information panels.

The voice recorder can be the visual centerpiece.

## Doctor UI Styling

The doctor dashboard should be denser:

- Compact sidebar.
- Sticky header.
- Metric row.
- Queue table.
- Right-side case drawer.
- Live status indicator.
- Keyboard shortcuts.

The visual hierarchy should make **Critical / High / Waiting** immediately scannable.

## Priority Colors

Blue is the brand, but clinical status needs semantic distinction:

```text
Critical → red
High     → amber/orange
Medium   → blue
Low      → green
```

Always combine color with:

- label
- icon
- text
- optional score

Never communicate priority by color alone.

## SCM UI Styling

SCM should feel more technical than patient UI while still sharing the same blue system.

Use:

- monospace for commit hashes/version identifiers
- timeline
- branch/commit graph
- configuration table
- status badges
- baseline cards
- approval workflow

## Animation Rules

Animation should communicate state, not decorate everything.

Allowed:

- 150–250ms hover/focus transitions.
- 250–450ms panel transitions.
- Slow hero background movement.
- Queue item entrance.
- Number ticker.
- Voice waveform.
- Processing steps.

Avoid:

- constant floating objects
- large parallax
- excessive bouncing
- distracting background particles
- animation on every table row

Respect `prefers-reduced-motion`.

## Responsive Rules

### Desktop

Use full dashboard layout.

### Tablet

Collapse secondary controls.

### Mobile

- Sidebar becomes drawer.
- Tables become cards or horizontal scroll.
- Case drawer becomes bottom sheet/full-screen sheet.
- Intake form uses one-column layout.

## Accessibility

- WCAG-conscious contrast.
- Visible focus states.
- Keyboard navigation.
- Semantic landmarks.
- Proper labels.
- `aria-live` for realtime updates where appropriate.
- Reduced motion support.
- Never use color as the only state indicator.

## What NOT to Copy

Do not blindly import:

- dark-mode-only components
- neon gradients
- excessive glassmorphism
- huge text that breaks the clinical context
- decorative 3D scenes
- random purple/pink palettes
- excessive rounded blobs
- animated backgrounds behind data tables

Every 21st.dev component must be adapted to MediSync's light blue token system.

## Component Selection Rule

Before adding a 21st.dev component ask:

1. Does it improve the user's task?
2. Does it fit the light-blue MediSync system?
3. Does it reduce or increase cognitive load?
4. Does it work on mobile?
5. Does it support accessibility?
6. Does it add real demo value?

If the answer is mostly no, do not use it.

# 21ST.DEV SELECTED COMPONENT REFERENCES — LOCKED

The following user-selected 21st.dev components are explicit visual references for MediSync. Use them as implementation/inspiration references, but adapt every component to the MediSync light-blue design system. Do not blindly import unrelated colors, dark-mode behavior, copy, or branding.

## 1. Interactive Hover Button — Primary CTA reference
Reference: https://21st.dev/@dillionverma/components/interactive-hover-button

Use for:
- Landing hero primary CTA: Start Patient Intake
- Secondary/high-value CTA: Open Doctor Dashboard
- Final patient submission CTA where appropriate

Style direction:
- Preserve the refined hover transition and tactile interaction.
- Force MediSync light theme.
- Primary color family: blue.
- Keep motion quick and subtle; no excessive glow.
- Maintain keyboard focus and reduced-motion behavior.
- The reference uses Lucide React and is MIT licensed according to its 21st.dev page.

## 2. Footer Taped Design — Landing footer reference
Reference: https://21st.dev/@radu/components/footer-taped-design

Use for:
- Public landing-page footer.

Adaptation:
- Preserve the distinctive taped/attached visual concept, but make it feel clinical and premium rather than scrapbook-like.
- Use white / blue-tinted surfaces, blue accents, subtle borders and restrained shadows.
- Include: MediSync, Product, Patient Intake, Doctor Dashboard, SCM, GitHub/Docs, team information.
- Do not use the source's grey background as the final MediSync palette.
- Keep responsive behavior and active/coming-soon treatment only where useful.

## 3. Hero Section — Landing hero reference
Reference: https://21st.dev/@mikolajdobrucki/components/hero-section

Use for:
- Main MediSync landing hero.

Required MediSync content:
Title: "From symptom to priority — without the waiting-room guesswork."
Description: "MediSync streamlines patient intake and gives care teams a clear, explainable priority queue."
Primary CTA: "Start Patient Intake"
Secondary CTA: "View Doctor Dashboard"

Adaptation:
- Prefer the clean shadcn/Tailwind composition and responsive layout.
- Light theme only.
- Blue-first accents.
- Hero visual should show the MediSync workflow: Patient → Voice/Text → Triage → Priority → Doctor Queue.
- Avoid generic SaaS screenshots; use MediSync-specific dashboard/triage visuals.
- Avoid dark-mode variants.

## 4. Dropdown Navigation — Public navbar reference
Reference: https://21st.dev/@ln-dev7/components/dorpdown-navigation

Use for:
- Public landing-page navigation.

Suggested menus:
Products:
- Patient Intake
- AI Triage
- Doctor Dashboard

How It Works:
- Patient Flow
- Explainable Triage
- Real-Time Queue

SCM:
- Sapling
- Configuration Items
- Baselines

Resources:
- Documentation
- Demo
- GitHub

Adaptation:
- Keep the multi-level dropdown + hover interaction.
- Use Lucide icons.
- Blue hover/focus state.
- White surface with subtle border/shadow.
- Do not make the navbar visually heavier than the hero.
- Mobile must collapse into a clean accessible menu.

## 5. Auth Switch — Authentication reference
Reference: https://21st.dev/@appvibed01/components/auth-switch

Use for:
- Login / Sign-up experience.

MediSync adaptation:
- Replace generic social-login assumptions with MediSync's actual authentication flow.
- Provide clear Patient / Doctor role selection where appropriate.
- Keep animated Sign In ↔ Sign Up transition.
- Use white cards, blue accents, soft blue background treatment.
- No dark theme.
- Supabase Auth remains the actual authentication backend.
- Demo mode may provide role-based demo entry, but real authorization must remain enforced.

## 6. Spotlight Card — Feature/metric card reference
Reference: https://21st.dev/@jahed/components/spotlight-card

Use for:
- Landing-page feature cards.
- Selected doctor dashboard metric cards.
- SCM highlights.
- Important status cards.

Adaptation:
- Convert the glow/spotlight behavior into a restrained blue spotlight.
- Use white cards and blue/cyan light accents.
- Do not use a dark background.
- Keep the spotlight subtle enough for a healthcare product.
- Do not use spotlight effects on every card; reserve them for emphasis.

## 21ST.DEV IMPLEMENTATION RULE

These six references are the starting visual language, not six unrelated components to paste together. Antigravity must unify them through the MediSync design tokens.

Global constraints:
- LIGHT THEME ONLY.
- BLUE-FIRST COLOR SYSTEM.
- No dark-mode implementation.
- No random gradients.
- No excessive glassmorphism.
- No excessive glow.
- No excessive animation.
- No emoji as primary UI icons.
- Use Lucide React icons consistently.
- Use shadcn/Radix primitives where appropriate.
- Use Motion only where interaction genuinely benefits from animation.
- Preserve accessibility, keyboard navigation and reduced-motion support.
- Every borrowed/reference component must be restyled to MediSync tokens before final use.
