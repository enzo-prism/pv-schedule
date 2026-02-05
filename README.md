# pv-schedule

Track & field meet scheduling for a pole vault athlete. The app pairs a Vite + React frontend with an Express API and a Postgres (or in-memory) backend to track meets, performance metrics, and trends.

## Features
- Meet CRUD with upcoming/past filters and detail views.
- Pole vault performance tracking: height cleared, pole used, takeoff distance, place.
- Trends dashboard with charts for height, takeoff, and pole metrics.
- Optional media previews on meet cards when media is present in the data.
- Media gallery with lightbox browsing on the meet details page.
- Custom video player with lazy loading, tap-to-play/pause, auto-hiding controls, and seekable progress bar.
- Toast feedback and modal dialogs for add/edit/delete flows.

## Tech Stack
- Client: React 18 + Vite, Wouter routing, TanStack Query, Tailwind CSS, shadcn/ui, Recharts, date-fns.
- Server: Express + TypeScript, Postgres via `pg`, schema defined in Drizzle with Zod validation.
- Shared: `shared/schema.ts` for the source of truth types, `shared/metrics.ts` for parsing/formatting metrics.

## Architecture
- `server/index.ts` boots Express, adds logging, wires routes, and mounts Vite dev middleware or static assets.
- `server/routes.ts` exposes REST endpoints under `/api/meets`.
- `server/storage/*` selects memory or Postgres storage and normalizes media payloads.
- `client/src/pages` contains route-level screens for home, meet details, and trends.
- `client/src/components` holds reusable UI building blocks (cards, forms, dialogs, charts).

## Data Model
- `meets`: `name`, `date`, `location`, `description`, `height_cleared`, `pole_used`, `deepest_takeoff`, `place`, `link`, `drive_time`, `registration_status`, `is_filam_meet`, `created_at`.
- `meet_media`: `meet_id`, `type`, `url`, `thumbnail`, `caption`, `original_filename`, `position`, `uploaded_at`.

## Migrations & Backfill
- `shared/schema.ts` now includes `meet_media`; run `npm run db:push` after schema changes.
- `server/db.ts` creates `meet_media` and backfills from a legacy `meets.media` JSON column when present and `meet_media` is empty, then drops `meets.media`.
- `npm run sync:prod` truncates local `meets` and `meet_media` before importing from production, so only run it against disposable local data.

## API
- `GET /api/meets`
- `GET /api/meets/:id`
- `POST /api/meets`
- `PUT /api/meets/:id`
- `DELETE /api/meets/:id`
- `GET /api/meets/:id/media`
- `POST /api/meets/:id/media` (JSON upload or URL)
- `PATCH /api/meets/:id/media/:mediaId`
- `DELETE /api/meets/:id/media/:mediaId`

### Media Upload Payloads
- Upload file (base64 data URL):
```json
{
  "mode": "upload",
  "filename": "vault.jpg",
  "contentType": "image/jpeg",
  "data": "data:image/jpeg;base64,...",
  "caption": "Warmup jump"
}
```
- Add hosted media by URL:
```json
{
  "mode": "url",
  "url": "https://example.com/highlights.mp4",
  "type": "video",
  "caption": "Final attempts"
}
```

## Configuration
See `.env.example` for defaults and flags:
- `USE_IN_MEMORY_STORAGE`, `USE_SAMPLE_DATA`, `SEED_DEMO_DATA`
- `USE_HARDCODED_DATA` (force in-memory fixtures even when `DATABASE_URL` is set)
- `READ_ONLY` (disable all write endpoints)
- `VITE_READ_ONLY` (hide add/edit/delete UI in the client)
- `USE_PRODUCTION_DATA`, `PRODUCTION_DATABASE_URL`, `PRODUCTION_API_BASE_URL`
- `DATABASE_URL`, `PORT`, `HOST`, `REUSE_PORT`
- `UPLOADS_ROOT` (optional path for persistent uploads)
- `MEDIA_BASE_URL` (optional absolute base URL for serving uploads)
- `UPLOADS_ENABLED` (set `false` to disable file uploads; defaults to `false` on Vercel unless explicitly enabled)
- `VITE_UPLOADS_ENABLED` (set `false` to hide upload UI in the client)

## Common Commands
- `npm install`
- `npm run dev`
- `npm run build`
- `npm start`
- `npm run check`
- `npm run db:push`
- `npm run sync:prod`
- `npm run import:json -- --meets /path/to/meets.json --media /path/to/meet_media.json --truncate`

## Notes
- Media uploads are stored locally under `public/uploads` (or `UPLOADS_ROOT`) and served at `/uploads/*` (25MB limit). For production, point `UPLOADS_ROOT` at a persistent volume and set `MEDIA_BASE_URL` if the frontend is hosted separately from the API.
- Vercel deployments default to URL-only media because serverless functions have a 4.5MB payload limit; enable uploads only if you move to external object storage.
- `isFilamMeet` is stored in the schema but not currently surfaced in the UI.
- To load a full dataset into dev/prod, run the `import:json` script with `DATABASE_URL` set. It upserts by ID and resets sequences to the max ID.
- For a read-only deployment with data baked into the codebase, set `USE_HARDCODED_DATA=true` and `READ_ONLY=true` (and `VITE_READ_ONLY=true` on the client).
