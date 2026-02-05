import fs from "fs/promises";
import path from "path";
import { createDb } from "../db";

type MeetRow = {
  id: number;
  name: string;
  date: string;
  location: string;
  description?: string | null;
  created_at?: string | null;
  height_cleared?: string | null;
  pole_used?: string | null;
  deepest_takeoff?: string | null;
  place?: string | null;
  link?: string | null;
  drive_time?: string | null;
  registration_status?: string | null;
  is_filam_meet?: boolean | null;
};

type MediaRow = {
  id: number;
  meet_id: number;
  type: "photo" | "video";
  url: string;
  thumbnail?: string | null;
  caption?: string | null;
  original_filename?: string | null;
  position?: number | null;
  uploaded_at?: string | null;
  focus_x?: number | null;
  focus_y?: number | null;
};

function getArgValue(flag: string) {
  const index = process.argv.findIndex((arg) => arg === flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const resolved = path.resolve(filePath);
  const raw = await fs.readFile(resolved, "utf-8");
  return JSON.parse(raw) as T;
}

async function main() {
  const meetsPath =
    getArgValue("--meets") ??
    process.env.MEETS_JSON ??
    "/Users/enzo/Downloads/meets.json";
  const mediaPath =
    getArgValue("--media") ??
    process.env.MEET_MEDIA_JSON ??
    "/Users/enzo/Downloads/meet_media.json";
  const shouldTruncate = process.argv.includes("--truncate");

  if (!meetsPath || !mediaPath) {
    throw new Error("Provide --meets and --media paths (or MEETS_JSON/MEET_MEDIA_JSON).");
  }

  const meets = await readJsonFile<MeetRow[]>(meetsPath);
  const media = await readJsonFile<MediaRow[]>(mediaPath);

  console.log(`[import] Loaded ${meets.length} meets and ${media.length} media items.`);

  const db = createDb();
  await db.initDb();

  if (shouldTruncate) {
    console.log("[import] Truncating meets + meet_media...");
    await db.query("TRUNCATE TABLE meet_media, meets RESTART IDENTITY CASCADE");
  }

  for (const meet of meets) {
    await db.query(
      `INSERT INTO meets (
        id,
        name,
        date,
        location,
        description,
        created_at,
        height_cleared,
        pole_used,
        deepest_takeoff,
        place,
        link,
        drive_time,
        registration_status,
        is_filam_meet
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        date = EXCLUDED.date,
        location = EXCLUDED.location,
        description = EXCLUDED.description,
        created_at = EXCLUDED.created_at,
        height_cleared = EXCLUDED.height_cleared,
        pole_used = EXCLUDED.pole_used,
        deepest_takeoff = EXCLUDED.deepest_takeoff,
        place = EXCLUDED.place,
        link = EXCLUDED.link,
        drive_time = EXCLUDED.drive_time,
        registration_status = EXCLUDED.registration_status,
        is_filam_meet = EXCLUDED.is_filam_meet`,
      [
        meet.id,
        meet.name,
        meet.date,
        meet.location,
        meet.description ?? null,
        meet.created_at ?? null,
        meet.height_cleared ?? null,
        meet.pole_used ?? null,
        meet.deepest_takeoff ?? null,
        meet.place ?? null,
        meet.link ?? null,
        meet.drive_time ?? null,
        meet.registration_status ?? "not registered",
        meet.is_filam_meet ?? false,
      ],
    );
  }

  for (const item of media) {
    await db.query(
      `INSERT INTO meet_media (
        id,
        meet_id,
        type,
        url,
        thumbnail,
        caption,
        original_filename,
        position,
        uploaded_at,
        focus_x,
        focus_y
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
      )
      ON CONFLICT (id) DO UPDATE SET
        meet_id = EXCLUDED.meet_id,
        type = EXCLUDED.type,
        url = EXCLUDED.url,
        thumbnail = EXCLUDED.thumbnail,
        caption = EXCLUDED.caption,
        original_filename = EXCLUDED.original_filename,
        position = EXCLUDED.position,
        uploaded_at = EXCLUDED.uploaded_at,
        focus_x = EXCLUDED.focus_x,
        focus_y = EXCLUDED.focus_y`,
      [
        item.id,
        item.meet_id,
        item.type,
        item.url,
        item.thumbnail ?? null,
        item.caption ?? null,
        item.original_filename ?? null,
        item.position ?? 0,
        item.uploaded_at ?? null,
        item.focus_x ?? 50,
        item.focus_y ?? 50,
      ],
    );
  }

  await db.query(
    "SELECT setval(pg_get_serial_sequence('meets','id'), COALESCE(MAX(id), 1), true) FROM meets",
  );
  await db.query(
    "SELECT setval(pg_get_serial_sequence('meet_media','id'), COALESCE(MAX(id), 1), true) FROM meet_media",
  );

  console.log("[import] Done.");
  await db.shutdown();
}

main().catch((error) => {
  console.error("[import] Failed:", error);
  process.exit(1);
});
