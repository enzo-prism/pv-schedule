import { filamMeets } from "../shared/filam-meets";
import { query } from "./db";

async function migrateFilamMeets() {
  try {
    // First, check if FilAm meets already exist
    const existingFilamMeets = await query(
      "SELECT COUNT(*) FROM meets WHERE is_filam_meet = true"
    );

    if (parseInt(existingFilamMeets.rows[0].count) > 0) {
      console.log("FilAm meets already exist in database, skipping migration");
      return;
    }

    console.log(`Migrating ${filamMeets.length} FilAm meets to database...`);

    // Insert all FilAm meets
    for (const meet of filamMeets) {
      await query(
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
          is_filam_meet
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          meet.name,
          meet.date,
          meet.location,
          meet.description,
          meet.heightCleared,
          meet.poleUsed,
          meet.deepestTakeoff,
          meet.place,
          meet.link,
          meet.driveTime,
          meet.registrationStatus || 'not registered',
          true
        ]
      );
    }

    console.log("Successfully migrated all FilAm meets!");
  } catch (error) {
    console.error("Error migrating FilAm meets:", error);
  }
}

export { migrateFilamMeets };