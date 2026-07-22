# Claude Code Project Notes

## Fast Track - Fasting Tracker Application

### Deployment Routine
Deployment is **manual** via the Vercel CLI — it does **NOT** happen automatically on git push.

Steps to ship to production:
1. Commit and push your changes (`git push`) — this does not deploy, it only versions.
2. Sanity-check the build locally: `npm run build` (catches type/build errors before deploy).
3. Deploy a preview first if unsure: `vercel` → returns a preview URL to verify.
4. Deploy to production: `vercel --prod`.
5. Verify the live site loads and the change is present: https://fast-tracking.vercel.app

Notes:
- Do NOT run builds or start the dev server unprompted — assume one is already running.
- **`npm run build` breaks a running dev server** — they share `.next`. If you build while `next dev` is running, the dev server starts returning 500s. Either skip the local build (Vercel builds remotely anyway; `tsc --noEmit` catches type errors), or restart the dev server after building.
- Production requires Vercel KV credentials configured in the Vercel project (and `.env.local` for local runs).

### Project Structure
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v4
- **Database**: Vercel KV (Redis)
- **Live URL**: https://fast-tracking.vercel.app

### Recent Changes
- Added custom favicon matching homepage clock icon (commit 84e743a)
- Favicon includes gradient design matching brand colors (#6366f1 to #9333ea)
- Updated layout.tsx metadata for proper favicon serving

### Key Features
- Real-time fasting timer with progress tracking
- 5 wellness metrics (energy, hunger, mental clarity, mood, physical comfort)
- Body composition tracking
- Journal with tagging system
- Session sharing (edit vs read-only modes)
- Dark mode support
- Data export (JSON/CSV)

### Development
- Dev server: `npm run dev`
- Build: `npm run build`
- Local URL: http://localhost:3000

### Environment Variables
- Requires Vercel KV credentials in .env.local for cloud storage
- Currently has Garmin credentials in .env (for potential future integration)

### Specs & Spec-Driven Development
This project uses the **Awolve spec-driven dev format**, with one deliberate deviation: it is
a private project, so specs are **NOT** registered in the Awolve spec service (`specs.awolve.ai`
is Awolve projects only). The convention here is format-only and local.

- **Location**: specs live in Cortex, not in this repo —
  `my-cortex/context/projects/fast-tracker/specs/` (personal OneDrive via the ops-cortex-core checkout).
- **One folder per feature**, numbered: `{NNN}-{feature-name}/` (e.g. `001-group-session/`).
- **Exactly three files per feature**:
  - `requirements.md` — what to build and why (user stories, acceptance criteria as WHEN/THEN, edge cases, out of scope)
  - `design.md` — how to build it (architecture, components, data models, key decisions; infra as an `## Infrastructure` section, not a separate file)
  - `plan.md` — phased task breakdown with file paths
- **Before writing any spec file**, consult the matching `awolve-spec` skill (`/awolve-spec:req`,
  `:design`, `:plan`) for current structure and tone — it is the source of truth for the format.
- **Skip** all spec-service steps in those skills (`specs-cli.py create-feature`/`create-doc`, portal
  registration, sync frontmatter) — they only apply to Awolve projects.