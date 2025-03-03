import { type Meet, type InsertMeet } from "@shared/schema";
import db from './db';

export interface IStorage {
  getAllMeets(): Promise<Meet[]>;
  getMeetById(id: number): Promise<Meet | undefined>;
  createMeet(meet: InsertMeet): Promise<Meet>;
  updateMeet(id: number, meet: InsertMeet): Promise<Meet | undefined>;
  deleteMeet(id: number): Promise<boolean>;
}

// PostgreSQL storage implementation
export class PgStorage implements IStorage {
  constructor() {
    // Initialize the database
    this.initializeDb();
  }

  private async initializeDb() {
    try {
      console.log('[PgStorage] Initializing database...');
      
      // Initialize DB structure
      await db.initDb();
      
      // Check if there is any data
      const result = await db.query('SELECT COUNT(*) FROM meets');
      
      if (parseInt(result.rows[0].count) === 0) {
        console.log('[PgStorage] Adding sample data...');
        
        // Add sample data
        const sampleMeets: InsertMeet[] = [
          {
            name: "Regional Championships",
            date: "2023-11-15",
            location: "Franklin Field, Boston",
            description: "Annual regional championship meet for all divisions."
          },
          {
            name: "University Invitational",
            date: "2023-12-05",
            location: "University Stadium, Chicago",
            description: "Invitational meet hosting universities from across the midwest."
          },
          {
            name: "Winter Classic",
            date: "2024-01-20",
            location: "Indoor Sports Complex, Denver",
            description: "Winter indoor track and field event for high school athletes."
          },
          {
            name: "Spring Opener",
            date: "2024-03-10",
            location: "Community College Track, Portland",
            description: "First outdoor meet of the spring season."
          },
          {
            name: "State Qualifier",
            date: "2024-04-28",
            location: "State Athletics Park, Atlanta",
            description: "Qualifying meet for the state championships."
          },
          {
            name: "Last Year's Finals",
            date: "2022-06-15",
            location: "Olympic Stadium, Los Angeles",
            description: "A past event from last year for testing."
          }
        ];

        for (const meet of sampleMeets) {
          await this.createMeet(meet);
        }
      }
    } catch (error) {
      console.error('[PgStorage] Error initializing database:', error);
    }
  }

  async getAllMeets(): Promise<Meet[]> {
    try {
      const query = 'SELECT * FROM meets ORDER BY date';
      const result = await db.query(query);
      
      return result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        date: row.date,
        location: row.location,
        description: row.description,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('[PgStorage] Error getting all meets:', error);
      return [];
    }
  }

  async getMeetById(id: number): Promise<Meet | undefined> {
    try {
      const query = 'SELECT * FROM meets WHERE id = $1';
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        date: row.date,
        location: row.location,
        description: row.description,
        createdAt: row.created_at
      };
    } catch (error) {
      console.error('[PgStorage] Error getting meet by id:', error);
      return undefined;
    }
  }

  async createMeet(insertMeet: InsertMeet): Promise<Meet> {
    try {
      const query = `
        INSERT INTO meets (name, date, location, description)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const values = [
        insertMeet.name,
        insertMeet.date,
        insertMeet.location,
        insertMeet.description || null
      ];
      
      const result = await db.query(query, values);
      const row = result.rows[0];
      
      return {
        id: row.id,
        name: row.name,
        date: row.date,
        location: row.location,
        description: row.description,
        createdAt: row.created_at
      };
    } catch (error) {
      console.error('[PgStorage] Error creating meet:', error);
      throw new Error('Failed to create meet');
    }
  }
  
  async updateMeet(id: number, updateMeet: InsertMeet): Promise<Meet | undefined> {
    try {
      // First check if the meet exists
      const existingMeet = await this.getMeetById(id);
      if (!existingMeet) {
        return undefined;
      }
      
      const query = `
        UPDATE meets
        SET name = $1, date = $2, location = $3, description = $4
        WHERE id = $5
        RETURNING *
      `;
      
      const values = [
        updateMeet.name,
        updateMeet.date,
        updateMeet.location,
        updateMeet.description || null,
        id
      ];
      
      const result = await db.query(query, values);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        date: row.date,
        location: row.location,
        description: row.description,
        createdAt: row.created_at
      };
    } catch (error) {
      console.error('[PgStorage] Error updating meet:', error);
      return undefined;
    }
  }
  
  async deleteMeet(id: number): Promise<boolean> {
    try {
      // First check if the meet exists
      const existingMeet = await this.getMeetById(id);
      if (!existingMeet) {
        return false;
      }
      
      const query = 'DELETE FROM meets WHERE id = $1';
      const result = await db.query(query, [id]);
      
      // Return true if at least one row was affected
      return result && typeof result.rowCount === 'number' && result.rowCount > 0;
    } catch (error) {
      console.error('[PgStorage] Error deleting meet:', error);
      return false;
    }
  }
}

// In-memory storage implementation (kept for reference)
export class MemStorage implements IStorage {
  private meets: Map<number, Meet>;
  currentId: number;

  constructor() {
    this.meets = new Map();
    this.currentId = 1;

    // Initialize with sample data
    const sampleMeets: InsertMeet[] = [
      {
        name: "Regional Championships",
        date: "2023-11-15",
        location: "Franklin Field, Boston",
        description: "Annual regional championship meet for all divisions."
      },
      {
        name: "University Invitational",
        date: "2023-12-05",
        location: "University Stadium, Chicago",
        description: "Invitational meet hosting universities from across the midwest."
      },
      {
        name: "Winter Classic",
        date: "2024-01-20",
        location: "Indoor Sports Complex, Denver",
        description: "Winter indoor track and field event for high school athletes."
      },
      {
        name: "Spring Opener",
        date: "2024-03-10",
        location: "Community College Track, Portland",
        description: "First outdoor meet of the spring season."
      },
      {
        name: "State Qualifier",
        date: "2024-04-28",
        location: "State Athletics Park, Atlanta",
        description: "Qualifying meet for the state championships."
      },
      {
        name: "Last Year's Finals",
        date: "2022-06-15",
        location: "Olympic Stadium, Los Angeles",
        description: "A past event from last year for testing."
      }
    ];

    sampleMeets.forEach(meet => this.createMeet(meet));
  }

  async getAllMeets(): Promise<Meet[]> {
    return Array.from(this.meets.values());
  }

  async getMeetById(id: number): Promise<Meet | undefined> {
    return this.meets.get(id);
  }

  async createMeet(insertMeet: InsertMeet): Promise<Meet> {
    const id = this.currentId++;
    const meet: Meet = { 
      ...insertMeet, 
      id,
      description: insertMeet.description || null,
      createdAt: new Date()
    };
    this.meets.set(id, meet);
    return meet;
  }
  
  async updateMeet(id: number, updateMeet: InsertMeet): Promise<Meet | undefined> {
    const existingMeet = await this.getMeetById(id);
    if (!existingMeet) {
      return undefined;
    }
    
    const updatedMeet: Meet = {
      ...existingMeet,
      name: updateMeet.name,
      date: updateMeet.date,
      location: updateMeet.location,
      description: updateMeet.description || null
    };
    
    this.meets.set(id, updatedMeet);
    return updatedMeet;
  }
  
  async deleteMeet(id: number): Promise<boolean> {
    const exists = this.meets.has(id);
    if (exists) {
      return this.meets.delete(id);
    }
    return false;
  }
}

// Switch to PostgreSQL storage
export const storage = new PgStorage();
