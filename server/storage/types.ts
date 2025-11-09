import { type InsertMeet, type Meet, type MediaItem } from "@shared/schema";

// PostgreSQL 'date' type doesn't include timezone, but JavaScript Date does.
// This helper keeps yyyy-mm-dd strings stable regardless of server timezone.
export function adjustDateForTimezone(dateStr: string): string {
  if (typeof dateStr === "string" && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }

  const date = new Date(dateStr);
  return date.toISOString().split("T")[0];
}

export interface NewMediaInput {
  type: "photo" | "video";
  url: string;
  thumbnail?: string | null;
  caption?: string | null;
  originalFilename?: string | null;
  uploadedAt?: Date;
}

export interface UpdateMediaInput {
  caption?: string | null;
  position?: number;
}

export interface DeleteMediaResult {
  removed?: MediaItem;
  media: MediaItem[];
}

export interface IStorage {
  getAllMeets(): Promise<Meet[]>;
  getMeetById(id: number): Promise<Meet | undefined>;
  createMeet(meet: InsertMeet): Promise<Meet>;
  updateMeet(id: number, meet: InsertMeet): Promise<Meet | undefined>;
  deleteMeet(id: number): Promise<boolean>;
  addMediaItems(meetId: number, items: NewMediaInput[]): Promise<MediaItem[]>;
  getMediaForMeet(meetId: number): Promise<MediaItem[]>;
  deleteMediaItem(meetId: number, mediaId: number): Promise<DeleteMediaResult>;
  updateMediaItem(
    meetId: number,
    mediaId: number,
    data: UpdateMediaInput,
  ): Promise<MediaItem[] | undefined>;
}
