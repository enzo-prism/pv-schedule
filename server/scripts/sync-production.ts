import { type Meet } from "@shared/schema";
import { createDb } from "../db";

async function fetchProductionMeets(): Promise<Meet[]> {
  const baseUrl = process.env.PRODUCTION_API_BASE_URL;

  if (!baseUrl) {
    throw new Error(
      "PRODUCTION_API_BASE_URL is not set. Provide the deployed API base URL (e.g., https://pv-schedule.app).",
    );
  }

  const url = `${baseUrl.replace(/\/$/, "")}/api/meets`;
  const res = await fetch(url, { credentials: "omit" });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch production meets (${res.status}): ${text}`);
  }

  return (await res.json()) as Meet[];
}

async function seedLocalDatabase(meets: Meet[]) {
  const targetUrl = process.env.DATABASE_URL;
  if (!targetUrl) {
    throw new Error("DATABASE_URL must be set to sync production data locally.");
  }

  const db = createDb(targetUrl);
  await db.query("BEGIN");

  try {
    await db.query("TRUNCATE TABLE meet_media RESTART IDENTITY CASCADE");
    await db.query("TRUNCATE TABLE meets RESTART IDENTITY CASCADE");

    for (const meet of meets) {
      const result = await db.query(
        `INSERT INTO meets (
          name,
          date,
          location,
          description,
          height_cleared,
          pole_used,
          deepest_takeoff,
          place,
          link,
          drive_time,
          registration_status,
          is_filam_meet,
          created_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        RETURNING id`,
        [
          meet.name,
          meet.date,
          meet.location,
          meet.description ?? null,
          meet.heightCleared ?? null,
          meet.poleUsed ?? null,
          meet.deepestTakeoff ?? null,
          meet.place ?? null,
          meet.link ?? null,
          meet.driveTime ?? null,
          meet.registrationStatus ?? "not registered",
          meet.isFilamMeet ?? false,
          meet.createdAt ? new Date(meet.createdAt) : new Date(),
        ],
      );

      const insertedId = result.rows[0].id;
      const mediaItems = Array.isArray(meet.media) ? meet.media : [];

      for (let index = 0; index < mediaItems.length; index++) {
        const media = mediaItems[index];
        await db.query(
          `INSERT INTO meet_media (
            meet_id,
            type,
            url,
            thumbnail,
            caption,
            original_filename,
            position,
            uploaded_at
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            insertedId,
            media.type,
            media.url,
            media.thumbnail ?? null,
            media.caption ?? null,
            media.originalFilename ?? null,
            media.position ?? index,
            media.uploadedAt ? new Date(media.uploadedAt) : new Date(),
          ],
        );
      }
    }

    await db.query("COMMIT");
    console.log(`[sync] Imported ${meets.length} meets from production.`);
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    await db.shutdown();
  }
}

async function main() {
  const meets = await fetchProductionMeets();

  if (meets.length === 0) {
    console.warn("[sync] Production API returned no meets. Local DB will be empty.");
  }

  await seedLocalDatabase(meets);
}

main().catch((error) => {
  console.error("[sync] Failed to import production data:", error);
  process.exit(1);
});
