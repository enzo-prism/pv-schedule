import { meets, type Meet, type InsertMeet } from "@shared/schema";

export interface IStorage {
  getAllMeets(): Promise<Meet[]>;
  getMeetById(id: number): Promise<Meet | undefined>;
  createMeet(meet: InsertMeet): Promise<Meet>;
}

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
        date: new Date("2023-11-15"),
        location: "Franklin Field, Boston",
        description: "Annual regional championship meet for all divisions."
      },
      {
        name: "University Invitational",
        date: new Date("2023-12-05"),
        location: "University Stadium, Chicago",
        description: "Invitational meet hosting universities from across the midwest."
      },
      {
        name: "Winter Classic",
        date: new Date("2024-01-20"),
        location: "Indoor Sports Complex, Denver",
        description: "Winter indoor track and field event for high school athletes."
      },
      {
        name: "Spring Opener",
        date: new Date("2024-03-10"),
        location: "Community College Track, Portland",
        description: "First outdoor meet of the spring season."
      },
      {
        name: "State Qualifier",
        date: new Date("2024-04-28"),
        location: "State Athletics Park, Atlanta",
        description: "Qualifying meet for the state championships."
      },
      {
        name: "Last Year's Finals",
        date: new Date("2022-06-15"),
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
    const meet: Meet = { ...insertMeet, id };
    this.meets.set(id, meet);
    return meet;
  }
}

export const storage = new MemStorage();
