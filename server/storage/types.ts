import { type InsertMeet, type Meet, type MediaItem } from "@shared/schema";

export interface NewMediaInput {
  type: "photo" | "video";
  url: string;
  thumbnail?: string | null;
  caption?: string | null;
  originalFilename?: string | null;
  focusX?: number;
  focusY?: number;
  uploadedAt?: Date;
}

export interface UpdateMediaInput {
  caption?: string | null;
  position?: number;
  focusX?: number;
  focusY?: number;
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
  deleteMediaItem(meetId: number, mediaId: string | number): Promise<DeleteMediaResult>;
  updateMediaItem(
    meetId: number,
    mediaId: string | number,
    data: UpdateMediaInput,
  ): Promise<MediaItem[] | undefined>;
}
