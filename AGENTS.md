# Repository Guidelines

## Project Structure & Module Organization
The Next.js 15 App Router code lives under `src/app`, with feature-focused UI in `src/components`, reusable hooks in `src/hooks`, and TypeScript contracts in `src/types`. Shared helpers (e.g., session ID generation) sit in `src/utils`. Assets served directly by Next.js belong in `public`. Behavioural briefs and feature notes reside in `specs/features`; reference them when implementing or updating flows. Utility scripts used by maintainers are in `tools`.

## Build, Test, and Development Commands
Use `npm run dev` to launch the Turbopack-powered development server on `localhost:3000`. Run `npm run build` to produce the optimized production bundle; always execute it before shipping changes that touch routing or data fetching. After a successful build, `npm run start` boots the production server locally for smoke testing.

## Coding Style & Naming Conventions
The project targets modern TypeScript with strict typing; prefer explicit types on public exports and keep `any` out of reviews. Follow the existing two-space indentation and favour functional React patterns (`function Component()` plus hooks). Group related files by feature, and use kebab-case for file names, PascalCase for components, and camelCase for variables and utilities. Tailwind CSS v4 handles styling—lean on utility classes over custom CSS. When adding aliases, extend the existing `@/` path mapping in `tsconfig.json`.

## Testing Guidelines
There is no automated test harness yet. Validate changes manually by exercising the relevant user journey in the dev server, including session creation, KV-backed persistence, and email link flows. Document manual test steps in your PR description. If you introduce automated tests (e.g., Playwright or Vitest), colocate them near the feature and update this guide accordingly.

## Commit & Pull Request Guidelines
Commits follow a Conventional Commits-style prefix (`feat:`, `fix:`, `chore:`) plus a concise imperative summary—mirror the existing history (`git log --oneline`). For pull requests, include: (1) a one-sentence change overview, (2) links to related specs or issues, (3) screenshots or screen recordings for UI changes, and (4) a checklist of tests performed. Keep PRs small and focused; highlight any configuration steps such as new environment variables in `.env.local`.

## Configuration Tips
Local development requires Vercel KV credentials in `.env.local` (`KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`). Never commit secrets—use `.env.local` for personal values and describe required keys in documentation or PR notes.
