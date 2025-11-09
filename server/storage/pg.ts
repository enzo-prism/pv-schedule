import { type Meet, type InsertMeet, type MediaItem } from "@shared/schema";
import { demoMeets } from "@shared/fixtures/meets";
import type { DbClient } from "../db";
import {
  type DeleteMediaResult,
  type IStorage,
  type NewMediaInput,
  type UpdateMediaInput,
  adjustDateForTimezone,
} from "./types";

// Helpers to normalize the jsonb payload returned from Postgres
// into the MediaItem[] shape shared with the client.
type RawMedia =
  | MediaItem
  | {
      id?: string | number;
      type?: string;
      url?: string;
      thumbnail?: string | null;
      caption?: string | null;
      originalFilename?: string | null;
      position?: number;
      uploadedAt?: string | Date | null;
    };

function toMediaItems(media: unknown): MediaItem[] {
  if (!media) {
    return [];
  }

  const asArray = Array.isArray(media) ? media : [media];

  return asArray
    .filter((item): item is RawMedia => !!item)
    .map((item, index) => {
      const id =
        typeof item.id === "number" || typeof item.id === "string"
          ? String(item.id)
          : String(index);

      const type: "photo" | "video" = item.type === "video" ? "video" : "photo";

      const uploadedAtValue =
        item.uploadedAt instanceof Date
          ? item.uploadedAt
          : item.uploadedAt
            ? new Date(item.uploadedAt)
            : new Date();

      return {
        id,
        type,
        url: item.url ?? "",
        thumbnail: item.thumbnail ?? null,
        caption: item.caption ?? null,
        originalFilename: item.originalFilename ?? null,
        position: typeof item.position === "number" ? item.position : index,
        uploadedAt: uploadedAtValue.toISOString(),
      };
    })
    .filter((item) => item.url.length > 0);
}

interface PgStorageOptions {
  seedDemoData?: boolean;
  label?: string;
}

function mapRowToMeet(row: any): Meet {
  const dateStr =
    row?.date instanceof Date
      ? row.date.toISOString().split("T")[0]
      : String(row?.date ?? "").split("T")[0];

  return {
    id: row.id,
    name: row.name,
    date: dateStr,
    location: row.location,
    description: row.description,
    heightCleared: row.height_cleared,
    poleUsed: row.pole_used,
    deepestTakeoff: row.deepest_takeoff,
    place: row.place,
    link: row.link,
    driveTime: row.drive_time,
    registrationStatus: row.registration_status ?? "not registered",
    isFilamMeet: row.is_filam_meet ?? false,
    media: toMediaItems(row.media),
    createdAt: row.created_at,
  };
}

export class PgStorage implements IStorage {
  private readonly seedDemoData: boolean;
  private readonly label: string;

  constructor(
    private readonly db: DbClient,
    options: PgStorageOptions = {},
  ) {
    this.seedDemoData = options.seedDemoData ?? true;
    this.label = options.label ?? "postgres";
    void this.initializeDb();
  }

  private async initializeDb() {
    try {
      console.log(`[PgStorage] Initializing database (${this.label})...`);
      await this.db.initDb();

      if (!this.seedDemoData) {
        return;
      }

      const result = await this.db.query("SELECT COUNT(*) FROM meets");

      if (parseInt(result.rows[0].count, 10) === 0) {
        console.log("[PgStorage] Adding sample data...");
        for (const meet of demoMeets) {
          await this.createMeet(meet);
        }
      }
    } catch (error) {
      console.error(`[PgStorage] Error initializing database (${this.label}):`, error);
    }
  }

  private async fetchMeets(query: string, params: any[] = []): Promise<Meet[]> {
    const result = await this.db.query(query, params);
    return result.rows.map(mapRowToMeet);
  }

  async getAllMeets(): Promise<Meet[]> {
    try {
      const query = `
        SELECT
          m.*,
          COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'id', mm.id::text,
                'type', mm.type,
                'url', mm.url,
                'thumbnail', mm.thumbnail,
                'caption', mm.caption,
                'originalFilename', mm.original_filename,
                'position', mm.position,
                'uploadedAt', mm.uploaded_at
              )
              ORDER BY mm.position, mm.id
            ) FILTER (WHERE mm.id IS NOT NULL),
            '[]'::jsonb
          ) AS media
        FROM meets m
        LEFT JOIN meet_media mm ON mm.meet_id = m.id
        GROUP BY m.id
        ORDER BY m.date
      `;

      return await this.fetchMeets(query);
    } catch (error) {
      console.error('[PgStorage] Error getting all meets:', error);
      return [];
    }
  }

  async getMeetById(id: number): Promise<Meet | undefined> {
    try {
      const query = `
        SELECT
          m.*,
          COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'id', mm.id::text,
                'type', mm.type,
                'url', mm.url,
                'thumbnail', mm.thumbnail,
                'caption', mm.caption,
                'originalFilename', mm.original_filename,
                'position', mm.position,
                'uploadedAt', mm.uploaded_at
              )
              ORDER BY mm.position, mm.id
            ) FILTER (WHERE mm.id IS NOT NULL),
            '[]'::jsonb
          ) AS media
        FROM meets m
        LEFT JOIN meet_media mm ON mm.meet_id = m.id
        WHERE m.id = $1
        GROUP BY m.id
      `;

      const meets = await this.fetchMeets(query, [id]);
      return meets[0];
    } catch (error) {
      console.error('[PgStorage] Error getting meet by id:', error);
      return undefined;
    }
  }

  async createMeet(insertMeet: InsertMeet): Promise<Meet> {
    try {
      const query = `
        INSERT INTO meets (
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
          is_filam_meet
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      `;

      const defaultRegistrationStatus = "not registered";

      const values = [
        insertMeet.name,
        adjustDateForTimezone(insertMeet.date),
        insertMeet.location,
        insertMeet.description || null,
        insertMeet.heightCleared || null,
        insertMeet.poleUsed || null,
        insertMeet.deepestTakeoff || null,
        insertMeet.place || null,
        insertMeet.link || null,
        insertMeet.driveTime || null,
        insertMeet.registrationStatus || defaultRegistrationStatus,
        insertMeet.isFilamMeet ?? false,
      ];

      const result = await this.db.query(query, values);
      const createdId = result.rows[0].id;
      const createdMeet = await this.getMeetById(createdId);

      if (!createdMeet) {
        throw new Error('Failed to load newly created meet');
      }

      return createdMeet;
    } catch (error) {
      console.error('[PgStorage] Error creating meet:', error);
      throw new Error('Failed to create meet');
    }
  }

  async updateMeet(id: number, updateMeet: InsertMeet): Promise<Meet | undefined> {
    try {
      const existingMeet = await this.getMeetById(id);
      if (!existingMeet) {
        return undefined;
      }

      const query = `
        UPDATE meets
        SET
          name = $1,
          date = $2,
          location = $3,
          description = $4,
          height_cleared = $5,
          pole_used = $6,
          deepest_takeoff = $7,
          place = $8,
          link = $9,
          drive_time = $10,
          registration_status = $11,
          is_filam_meet = $12
        WHERE id = $13
        RETURNING id
      `;

      const mergedRegistrationStatus =
        updateMeet.registrationStatus ?? existingMeet.registrationStatus ?? "not registered";
      const mergedIsFilamMeet =
        updateMeet.isFilamMeet ?? existingMeet.isFilamMeet ?? false;

      const values = [
        updateMeet.name ?? existingMeet.name,
        adjustDateForTimezone(updateMeet.date ?? existingMeet.date),
        updateMeet.location ?? existingMeet.location,
        updateMeet.description ?? existingMeet.description ?? null,
        updateMeet.heightCleared ?? existingMeet.heightCleared ?? null,
        updateMeet.poleUsed ?? existingMeet.poleUsed ?? null,
        updateMeet.deepestTakeoff ?? existingMeet.deepestTakeoff ?? null,
        updateMeet.place ?? existingMeet.place ?? null,
        updateMeet.link ?? existingMeet.link ?? null,
        updateMeet.driveTime ?? existingMeet.driveTime ?? null,
        mergedRegistrationStatus,
        mergedIsFilamMeet,
        id,
      ];

      await this.db.query(query, values);
      return await this.getMeetById(id);
    } catch (error) {
      console.error('[PgStorage] Error updating meet:', error);
      return undefined;
    }
  }

  async deleteMeet(id: number): Promise<boolean> {
    try {
      const existingMeet = await this.getMeetById(id);
      if (!existingMeet) {
        return false;
      }

      const query = 'DELETE FROM meets WHERE id = $1';
      const result = await this.db.query(query, [id]);

      return result && typeof result.rowCount === 'number' && result.rowCount > 0;
    } catch (error) {
      console.error('[PgStorage] Error deleting meet:', error);
      return false;
    }
  }

  async getMediaForMeet(meetId: number): Promise<MediaItem[]> {
    const result = await this.db.query(
      `SELECT
        id,
        type,
        url,
        thumbnail,
        caption,
        original_filename,
        position,
        uploaded_at
      FROM meet_media
      WHERE meet_id = $1
      ORDER BY position, id`,
      [meetId],
    );

    return toMediaItems(
      result.rows.map((row) => ({
        id: row.id,
        type: row.type,
        url: row.url,
        thumbnail: row.thumbnail,
        caption: row.caption,
        originalFilename: row.original_filename,
        position: row.position,
        uploadedAt: row.uploaded_at,
      })),
    );
  }

  async addMediaItems(meetId: number, items: NewMediaInput[]): Promise<MediaItem[]> {
    if (items.length === 0) {
      return this.getMediaForMeet(meetId);
    }

    const positionResult = await this.db.query(
      "SELECT COALESCE(MAX(position), -1) AS max_position FROM meet_media WHERE meet_id = $1",
      [meetId],
    );

    let position = Number(positionResult.rows[0]?.max_position ?? -1);

    for (const item of items) {
      position += 1;
      await this.db.query(
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
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          meetId,
          item.type,
          item.url,
          item.thumbnail ?? null,
          item.caption ?? null,
          item.originalFilename ?? null,
          position,
          item.uploadedAt ?? new Date(),
        ],
      );
    }

    return this.getMediaForMeet(meetId);
  }

  async deleteMediaItem(meetId: number, mediaId: number): Promise<DeleteMediaResult> {
    const existing = await this.db.query(
      `SELECT * FROM meet_media WHERE id = $1 AND meet_id = $2`,
      [mediaId, meetId],
    );

    if (existing.rows.length === 0) {
      return {
        media: await this.getMediaForMeet(meetId),
      };
    }

    await this.db.query(
      `DELETE FROM meet_media WHERE id = $1 AND meet_id = $2`,
      [mediaId, meetId],
    );

    const removed = toMediaItems([
      {
        id: existing.rows[0].id,
        type: existing.rows[0].type,
        url: existing.rows[0].url,
        thumbnail: existing.rows[0].thumbnail,
        caption: existing.rows[0].caption,
        originalFilename: existing.rows[0].original_filename,
        position: existing.rows[0].position,
        uploadedAt: existing.rows[0].uploaded_at,
      },
    ])[0];

    return {
      removed,
      media: await this.getMediaForMeet(meetId),
    };
  }

  async updateMediaItem(
    meetId: number,
    mediaId: number,
    data: UpdateMediaInput,
  ): Promise<MediaItem[] | undefined> {
    const existing = await this.db.query(
      `SELECT id FROM meet_media WHERE id = $1 AND meet_id = $2`,
      [mediaId, meetId],
    );

    if (existing.rows.length === 0) {
      return undefined;
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (data.caption !== undefined) {
      fields.push(`caption = $${fields.length + 1}`);
      values.push(data.caption);
    }

    if (data.position !== undefined) {
      fields.push(`position = $${fields.length + 1}`);
      values.push(data.position);
    }

    if (fields.length === 0) {
      return this.getMediaForMeet(meetId);
    }

    values.push(mediaId, meetId);

    await this.db.query(
      `UPDATE meet_media SET ${fields.join(', ')} WHERE id = $${fields.length + 1} AND meet_id = $${fields.length + 2}`,
      values,
    );

    return this.getMediaForMeet(meetId);
  }
}
