import { pgTable, text, serial, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const meets = pgTable("meets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  date: date("date").notNull(),
  location: text("location").notNull(),
  description: text("description"),
  heightCleared: text("height_cleared"),
  poleUsed: text("pole_used"),
  deepestTakeoff: text("deepest_takeoff"),
  place: text("place"),
  link: text("link"),
  driveTime: text("drive_time"),
  registrationStatus: text("registration_status").default("not registered").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMeetSchema = createInsertSchema(meets).pick({
  name: true,
  date: true,
  location: true,
  description: true,
  heightCleared: true,
  poleUsed: true,
  deepestTakeoff: true,
  place: true,
  link: true,
  driveTime: true,
  registrationStatus: true,
});

export type InsertMeet = z.infer<typeof insertMeetSchema>;
export type Meet = typeof meets.$inferSelect;
