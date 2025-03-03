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
    // Create meets table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS meets (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        date DATE NOT NULL,
        location TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }
}

export default {
  query,
  initDb
};