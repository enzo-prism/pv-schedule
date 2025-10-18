import pg from 'pg';

// Create a connection pool to the PostgreSQL database
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

// Simple function to execute SQL queries
export async function query(text: string, params: any[] = []) {
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  }
}

// Initialize the database with required tables
export async function initDb() {
  try {
    // Create meets table if it doesn't exist with all required columns
    await query(`
      CREATE TABLE IF NOT EXISTS meets (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        date DATE NOT NULL,
        location TEXT NOT NULL,
        description TEXT,
        height_cleared TEXT,
        pole_used TEXT,
        deepest_takeoff TEXT,
        place TEXT,
        link TEXT,
        drive_time TEXT,
        registration_status TEXT NOT NULL DEFAULT 'not registered',
        is_filam_meet BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);

    // Ensure newer columns exist for previously created tables
    const alterStatements = [
      "ALTER TABLE meets ADD COLUMN IF NOT EXISTS height_cleared TEXT",
      "ALTER TABLE meets ADD COLUMN IF NOT EXISTS pole_used TEXT",
      "ALTER TABLE meets ADD COLUMN IF NOT EXISTS deepest_takeoff TEXT",
      "ALTER TABLE meets ADD COLUMN IF NOT EXISTS place TEXT",
      "ALTER TABLE meets ADD COLUMN IF NOT EXISTS link TEXT",
      "ALTER TABLE meets ADD COLUMN IF NOT EXISTS drive_time TEXT",
      "ALTER TABLE meets ADD COLUMN IF NOT EXISTS registration_status TEXT NOT NULL DEFAULT 'not registered'",
      "ALTER TABLE meets ALTER COLUMN registration_status SET DEFAULT 'not registered'",
      "ALTER TABLE meets ADD COLUMN IF NOT EXISTS is_filam_meet BOOLEAN NOT NULL DEFAULT false",
      "ALTER TABLE meets ALTER COLUMN is_filam_meet SET DEFAULT false"
    ];

    for (const statement of alterStatements) {
      await query(statement);
    }

    await query(
      "UPDATE meets SET registration_status = 'not registered' WHERE registration_status IS NULL",
    );
    await query(
      "UPDATE meets SET is_filam_meet = false WHERE is_filam_meet IS NULL",
    );

    await query(`
      CREATE TABLE IF NOT EXISTS meet_media (
        id SERIAL PRIMARY KEY,
        meet_id INTEGER NOT NULL REFERENCES meets(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK (type IN ('photo','video')),
        url TEXT NOT NULL,
        thumbnail TEXT,
        caption TEXT,
        original_filename TEXT,
        position INTEGER NOT NULL DEFAULT 0,
        uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);

    await query(
      "CREATE INDEX IF NOT EXISTS meet_media_meet_id_idx ON meet_media(meet_id)",
    );

    await migrateLegacyMedia();

    await query("ALTER TABLE meets DROP COLUMN IF EXISTS media");

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }
}

async function migrateLegacyMedia() {
  try {
    const mediaColumnExists = await query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = 'meets' AND column_name = 'media'`,
    );

    if (mediaColumnExists.rows.length === 0) {
      return;
    }

    const existingMedia = await query(
      "SELECT COUNT(*) FROM meet_media",
    );

    if (parseInt(existingMedia.rows[0].count, 10) > 0) {
      return;
    }

    const meetsWithMedia = await query(
      "SELECT id, media FROM meets WHERE media IS NOT NULL AND media::text <> '[]'",
    );

    for (const row of meetsWithMedia.rows) {
      const rawMedia = row.media;
      let mediaItems: any[] = [];

      if (Array.isArray(rawMedia)) {
        mediaItems = rawMedia;
      } else if (typeof rawMedia === "string") {
        try {
          const parsed = JSON.parse(rawMedia);
          mediaItems = Array.isArray(parsed) ? parsed : [];
        } catch {
          mediaItems = [];
        }
      }

      for (let index = 0; index < mediaItems.length; index++) {
        const item = mediaItems[index];
        if (!item || !item.url) {
          continue;
        }

        const uploadedAt = item.uploadedAt ? new Date(item.uploadedAt) : new Date();
        const type = item.type === 'video' ? 'video' : 'photo';

        await query(
          `INSERT INTO meet_media 
            (meet_id, type, url, thumbnail, caption, original_filename, position, uploaded_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            row.id,
            type,
            item.url,
            item.thumbnail ?? null,
            item.caption ?? null,
            item.originalFilename ?? null,
            index,
            uploadedAt,
          ],
        );
      }
    }
  } catch (error) {
    console.error('Failed to migrate legacy media:', error);
  }
}

export default {
  query,
  initDb
};
