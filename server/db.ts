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
        media JSONB NOT NULL DEFAULT '[]'::jsonb,
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
      "ALTER TABLE meets ALTER COLUMN is_filam_meet SET DEFAULT false",
      "ALTER TABLE meets ADD COLUMN IF NOT EXISTS media JSONB NOT NULL DEFAULT '[]'::jsonb",
      "ALTER TABLE meets ALTER COLUMN media SET DEFAULT '[]'::jsonb"
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
    await query(
      "UPDATE meets SET media = '[]'::jsonb WHERE media IS NULL",
    );

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }
}

export default {
  query,
  initDb
};
