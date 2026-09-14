# MediSync 

This package is the revised specification for MediSync.

## Important

The original course PDF is the source for the **problem, proposed workflow and SCM requirements**, not a mandatory technology-stack specification.


- Next.js
- TypeScript
- Tailwind
- shadcn/ui
- Radix
- Lucide
- Motion
- React Hook Form
- Zod
- Supabase
- PostgreSQL
- Supabase Realtime
- Supabase Storage
- Supabase Auth
- Vitest
- React Testing Library
- Playwright
- Sapling

## Files

- `PRD.md`
- `DESIGN.md`
- `DESIGN_SYSTEM_21ST.md`
- `ARCHITECTURE.md`
- `STACK.md`
- `PHASES.md`
- `.cursorrules`
- `MASTER_PROMPT_ANTIGRAVITY.md`
- `SAPLING_GUIDE.md`

## Recommended use

1. Put these files in the repository root.
2. Read `STACK.md`.
3. Put `.cursorrules` at repository root.
4. Give `MASTER_PROMPT_ANTIGRAVITY.md` to Antigravity.
5. Build phase-by-phase.
6. Use `DESIGN_SYSTEM_21ST.md` as the visual source of truth and 21st.dev for component/screen inspiration.
7. Keep the product light-theme-only and blue-first.
8. Adapt selected 21st.dev components locally so the UI remains visually coherent.
9. Use Sapling from the first meaningful change.

## Selected 21st.dev References

The UI implementation should use the following user-selected references as visual starting points:
- Interactive Hover Button
- Footer Taped Design
- Hero Section
- Dropdown Navigation
- Auth Switch
- Spotlight Card

See `DESIGN_SYSTEM_21ST.md` for exact mapping and adaptation rules. MediSync is strictly light-theme and blue-first.
