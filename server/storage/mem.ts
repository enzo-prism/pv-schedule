import { type InsertMeet, type Meet, type MediaItem } from "@shared/schema";
import { demoMeets } from "@shared/fixtures/meets";
import {
  type DeleteMediaResult,
  type IStorage,
  type NewMediaInput,
  type UpdateMediaInput,
  adjustDateForTimezone,
} from "./types";

export class MemStorage implements IStorage {
  private meets: Map<number, Meet> = new Map();
  private mediaByMeet: Map<number, MediaItem[]> = new Map();
  private currentId = 1;

  constructor(seed: InsertMeet[] = demoMeets) {
    seed.forEach((meet) => {
      void this.createMeet(meet);
    });
  }

  async getAllMeets(): Promise<Meet[]> {
    return Array.from(this.meets.values()).map((meet) => ({
      ...meet,
      media: this.mediaByMeet.get(meet.id) ?? [],
    }));
  }

  async getMeetById(id: number): Promise<Meet | undefined> {
    const meet = this.meets.get(id);
    if (!meet) {
      return undefined;
    }

    return {
      ...meet,
      media: this.mediaByMeet.get(id) ?? [],
    };
  }

  async createMeet(insertMeet: InsertMeet): Promise<Meet> {
    const id = this.currentId++;
    const defaultRegistrationStatus = "not registered";

    const meet: Meet = {
      id,
      name: insertMeet.name,
      date: adjustDateForTimezone(insertMeet.date),
      location: insertMeet.location,
      description: insertMeet.description || null,
      heightCleared: insertMeet.heightCleared || null,
      poleUsed: insertMeet.poleUsed || null,
      deepestTakeoff: insertMeet.deepestTakeoff || null,
      place: insertMeet.place || null,
      link: insertMeet.link || null,
      driveTime: insertMeet.driveTime || null,
      registrationStatus: insertMeet.registrationStatus || defaultRegistrationStatus,
      isFilamMeet: insertMeet.isFilamMeet ?? false,
      media: [],
      createdAt: new Date(),
    };

    this.meets.set(id, meet);
    this.mediaByMeet.set(id, []);
    return meet;
  }

  async updateMeet(id: number, updateMeet: InsertMeet): Promise<Meet | undefined> {
    const existingMeet = await this.getMeetById(id);
    if (!existingMeet) {
      return undefined;
    }

    const mergedRegistrationStatus =
      updateMeet.registrationStatus ?? existingMeet.registrationStatus ?? "not registered";
    const mergedIsFilamMeet =
      updateMeet.isFilamMeet ?? existingMeet.isFilamMeet ?? false;

    const updated: Meet = {
      ...existingMeet,
      name: updateMeet.name ?? existingMeet.name,
      date: adjustDateForTimezone(updateMeet.date ?? existingMeet.date),
      location: updateMeet.location ?? existingMeet.location,
      description: updateMeet.description ?? existingMeet.description ?? null,
      heightCleared: updateMeet.heightCleared ?? existingMeet.heightCleared ?? null,
      poleUsed: updateMeet.poleUsed ?? existingMeet.poleUsed ?? null,
      deepestTakeoff: updateMeet.deepestTakeoff ?? existingMeet.deepestTakeoff ?? null,
      place: updateMeet.place ?? existingMeet.place ?? null,
      link: updateMeet.link ?? existingMeet.link ?? null,
      driveTime: updateMeet.driveTime ?? existingMeet.driveTime ?? null,
      registrationStatus: mergedRegistrationStatus,
      isFilamMeet: mergedIsFilamMeet,
      media: this.mediaByMeet.get(id) ?? [],
    };

    this.meets.set(id, updated);
    return updated;
  }

  async deleteMeet(id: number): Promise<boolean> {
    const existed = this.meets.delete(id);
    this.mediaByMeet.delete(id);
    return existed;
  }

  async getMediaForMeet(meetId: number): Promise<MediaItem[]> {
    return this.mediaByMeet.get(meetId) ?? [];
  }

  async addMediaItems(meetId: number, items: NewMediaInput[]): Promise<MediaItem[]> {
    const media = this.mediaByMeet.get(meetId) ?? [];
    const startPosition = media.length;
    const newItems = items.map((item, index) => ({
      id: `${Date.now()}-${index}`,
      type: item.type,
      url: item.url,
      thumbnail: item.thumbnail ?? null,
      caption: item.caption ?? null,
      originalFilename: item.originalFilename ?? null,
      position: startPosition + index,
      uploadedAt: (item.uploadedAt ?? new Date()).toISOString(),
    }));

    const updatedMedia = [...media, ...newItems];
    this.mediaByMeet.set(meetId, updatedMedia);
    return updatedMedia;
  }

  async deleteMediaItem(meetId: number, mediaId: number): Promise<DeleteMediaResult> {
    const media = this.mediaByMeet.get(meetId) ?? [];
    const index = media.findIndex((item) => item.id === String(mediaId));

    if (index === -1) {
      return { media };
    }

    const removed = media[index];
    media.splice(index, 1);
    this.mediaByMeet.set(meetId, media);

    return { removed, media };
  }

  async updateMediaItem(
    meetId: number,
    mediaId: number,
    data: UpdateMediaInput,
  ): Promise<MediaItem[] | undefined> {
    const media = this.mediaByMeet.get(meetId) ?? [];
    const itemIndex = media.findIndex((item) => item.id === String(mediaId));

    if (itemIndex === -1) {
      return undefined;
    }

    const updated = { ...media[itemIndex] };

    if (data.caption !== undefined) {
      updated.caption = data.caption;
    }

    if (data.position !== undefined) {
      updated.position = data.position;
    }

    media[itemIndex] = updated;
    this.mediaByMeet.set(meetId, media);

    return media;
  }
}
