# Repository Guidelines

pv-schedule pairs a Vite React client with an Express API; use this playbook when contributing.

## Project Structure & Module Organization
- `client/src` hosts the React SPA: routes in `pages`, UI pieces in `components`, hooks in `hooks`, shared utilities in `lib`, and styles in `index.css`. Imports use the `@` alias.
- `server` contains the API surface (`index.ts`), REST handlers (`routes.ts`), persistence backends in `server/storage/`, and dev middleware (`vite.ts`). `server/db.ts` only powers the Postgres mode.
- `shared/schema.ts` is the single source for Drizzle schema + Zod validation; extend it instead of duplicating DTOs, then import it through `@shared`.
- Static assets live in `public` and `attached_assets`. `npm run build` emits the client to `dist/public`, which production Express serves automatically.

## Build, Test, and Development Commands
- `npm install` — install dependencies once for both tiers.
- `npm run dev` — start Express with embedded Vite at `http://localhost:5000`.
- `npm run build` — bundle the client (Vite) and server (esbuild) into `dist/`.
- `npm start` — run the bundled app.
- `npm run check` — project-wide TypeScript check.
- `npm run db:push` — push `shared/schema.ts` to Postgres via Drizzle.
- `npm run sync:prod` — download live meets from `PRODUCTION_API_BASE_URL` and load them into your local `DATABASE_URL` (truncates local data).

## Coding Style & Naming Conventions
Use TypeScript with two-space indentation; client files favor double quotes, server files use single quotes. React components, hooks, and providers live in PascalCase files, hooks start with `use`, shared logic belongs in `lib/` or `shared/`, and exports read as verbs. Prefer Tailwind utilities over bespoke CSS and keep modules focused.

## Testing Guidelines
No runner ships yet; when adding coverage, colocate specs (`client/src/__tests__`, `server/__tests__`), add `vitest` + `@testing-library/react` for UI code, and pair `node --test` with `supertest` for REST handlers. Prioritize `server/storage/*` and data-shaping hooks, and seed fixtures rather than editing inline demo data.

## Commit & Pull Request Guidelines
History uses short, imperative subjects (“Remove image and video attachment features ...”). Keep commits single-purpose, wrap subjects near 72 chars, and mention subsystems only when needed. PRs should explain the behavior change, list verification steps (`npm run dev`, `curl /api/meets`), link issues, and attach UI screenshots or GIFs when visuals change.

## Data Modes & Configuration Tips
- Copy `.env.example`, set `DATABASE_URL`, and choose a storage mode:
  - `USE_IN_MEMORY_STORAGE=true` (or `USE_SAMPLE_DATA=true`) for the bundled fixtures.
  - Default local Postgres mode: supply `DATABASE_URL`, keep `SEED_DEMO_DATA=true` only if you want sample rows.
  - Real data: set `USE_PRODUCTION_DATA=true` plus `PRODUCTION_DATABASE_URL` (read-only) to point the API at production without seeding, or run `npm run sync:prod` with `PRODUCTION_API_BASE_URL` defined to snapshot prod into your local DB.
- After editing `shared/schema.ts`, run `npm run db:push` and restart `npm run dev` so schema changes propagate. Never commit real credentials; keep `.env` out of git, and rely on external object storage for media while persisting only URLs and captions through `/api/meets`.
