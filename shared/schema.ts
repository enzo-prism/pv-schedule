import { pgTable, text, serial, date, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string;
  thumbnail?: string | null;
  caption?: string | null;
  uploadedAt: string;
  position: number;
  originalFilename?: string | null;
}

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
  isFilamMeet: boolean("is_filam_meet").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const meetMedia = pgTable("meet_media", {
  id: serial("id").primaryKey(),
  meetId: integer("meet_id")
    .notNull()
    .references(() => meets.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  url: text("url").notNull(),
  thumbnail: text("thumbnail"),
  caption: text("caption"),
  originalFilename: text("original_filename"),
  position: integer("position").notNull().default(0),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
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
  isFilamMeet: true,
});

export type InsertMeet = z.infer<typeof insertMeetSchema>;
export type BaseMeet = typeof meets.$inferSelect;
export type Meet = BaseMeet & { media: MediaItem[] };

export const mediaMetadataSchema = z.object({
  caption: z
    .string()
    .optional()
    .transform((value) => (value === undefined ? value : value.trim())),
  position: z.number().int().min(0).optional(),
});
