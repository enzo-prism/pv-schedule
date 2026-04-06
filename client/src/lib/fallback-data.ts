import { seedMeetMedia, seedMeets } from "@shared/fixtures/meets";
import type { Meet, MediaItem } from "@shared/schema";

const mediaByMeetId = new Map<number, MediaItem[]>();

seedMeetMedia.forEach((item, index) => {
  const mediaItem: MediaItem = {
    id: String(item.id),
    type: item.type,
    url: item.url,
    thumbnail: item.thumbnail ?? null,
    caption: item.caption ?? null,
    originalFilename: item.originalFilename ?? null,
    position: item.position ?? index,
    focusX: item.focusX ?? 50,
    focusY: item.focusY ?? 50,
    uploadedAt: item.uploadedAt ?? new Date().toISOString(),
  };

  const bucket = mediaByMeetId.get(item.meetId) ?? [];
  bucket.push(mediaItem);
  mediaByMeetId.set(item.meetId, bucket);
});

const getSortedMediaForMeet = (meetId: number) => {
  const items = mediaByMeetId.get(meetId);
  if (!items || items.length === 0) {
    return [];
  }

  return [...items].sort((a, b) => {
    const positionA = typeof a.position === "number" ? a.position : 0;
    const positionB = typeof b.position === "number" ? b.position : 0;
    if (positionA !== positionB) {
      return positionA - positionB;
    }
    const idA = Number(a.id);
    const idB = Number(b.id);
    if (Number.isFinite(idA) && Number.isFinite(idB)) {
      return idA - idB;
    }
    return String(a.id).localeCompare(String(b.id));
  });
};

export const fallbackMeets: Meet[] = seedMeets.map((meet) => ({
  id: meet.id,
  name: meet.name,
  date: meet.date,
  startTime: meet.startTime ?? null,
  location: meet.location,
  description: meet.description ?? null,
  heightCleared: meet.heightCleared ?? null,
  poleUsed: meet.poleUsed ?? null,
  deepestTakeoff: meet.deepestTakeoff ?? null,
  place: meet.place ?? null,
  link: meet.link ?? null,
  driveTime: meet.driveTime ?? null,
  registrationStatus: meet.registrationStatus ?? "not registered",
  isFilamMeet: meet.isFilamMeet ?? false,
  createdAt: meet.createdAt ? new Date(meet.createdAt) : new Date(),
  media: getSortedMediaForMeet(meet.id),
}));

const fallbackMeetById = new Map<number, Meet>(
  fallbackMeets.map((meet) => [meet.id, meet]),
);

export function getFallbackMeet(id: number) {
  return fallbackMeetById.get(id);
}
