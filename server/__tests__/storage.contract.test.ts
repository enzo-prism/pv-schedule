import { describe, expect, it } from "vitest";
import { MemStorage } from "../storage/mem";

describe("storage contract (memory)", () => {
  it("creates and retrieves a meet", async () => {
    const storage = new MemStorage([]);
    const created = await storage.createMeet({
      name: "Test Meet",
      date: "2024-02-01",
      location: "Test Stadium",
    });

    const fetched = await storage.getMeetById(created.id);
    expect(fetched?.name).toBe("Test Meet");
    expect(fetched?.location).toBe("Test Stadium");
    expect(fetched?.date).toBe("2024-02-01");
  });

  it("updates a meet", async () => {
    const storage = new MemStorage([]);
    const created = await storage.createMeet({
      name: "Initial Meet",
      date: "2024-03-10",
      location: "Original Location",
      registrationStatus: "not registered",
    });

    const updated = await storage.updateMeet(created.id, {
      name: "Updated Meet",
      date: "2024-03-12",
      location: "Updated Location",
      registrationStatus: "registered",
    });

    expect(updated?.name).toBe("Updated Meet");
    expect(updated?.registrationStatus).toBe("registered");
  });

  it("deletes a meet", async () => {
    const storage = new MemStorage([]);
    const created = await storage.createMeet({
      name: "Delete Me",
      date: "2024-01-01",
      location: "Somewhere",
    });

    const success = await storage.deleteMeet(created.id);
    expect(success).toBe(true);
    expect(await storage.getMeetById(created.id)).toBeUndefined();
  });

  it("manages media items", async () => {
    const storage = new MemStorage([]);
    const created = await storage.createMeet({
      name: "Media Meet",
      date: "2024-04-01",
      location: "Media Stadium",
    });

    const media = await storage.addMediaItems(created.id, [
      {
        type: "photo",
        url: "https://example.com/photo.jpg",
        caption: "Finish",
      },
      {
        type: "video",
        url: "https://example.com/video.mp4",
        caption: "Jump",
      },
    ]);

    expect(media).toHaveLength(2);
    const mediaId = media[0].id as unknown as number;

    const updated = await storage.updateMediaItem(created.id, mediaId, {
      caption: "New caption",
    });

    expect(updated?.[0]?.caption).toBe("New caption");

    const deleted = await storage.deleteMediaItem(created.id, mediaId);
    expect(deleted.media.length).toBe(1);
  });
});
