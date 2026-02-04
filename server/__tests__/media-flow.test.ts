import express, { type Express } from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { removeLocalUpload } from "../media";

describe("media flow (api)", () => {
  let app: Express;
  const originalEnv = {
    USE_IN_MEMORY_STORAGE: process.env.USE_IN_MEMORY_STORAGE,
    USE_SAMPLE_DATA: process.env.USE_SAMPLE_DATA,
    USE_PRODUCTION_DATA: process.env.USE_PRODUCTION_DATA,
    DATABASE_URL: process.env.DATABASE_URL,
    PRODUCTION_DATABASE_URL: process.env.PRODUCTION_DATABASE_URL,
  };

  beforeAll(async () => {
    process.env.USE_IN_MEMORY_STORAGE = "true";
    process.env.USE_SAMPLE_DATA = "false";
    process.env.USE_PRODUCTION_DATA = "false";
    delete process.env.DATABASE_URL;
    delete process.env.PRODUCTION_DATABASE_URL;

    vi.resetModules();
    const { registerRoutes } = await import("../routes");
    app = express();
    app.use(express.json({ limit: "15mb" }));
    app.use(express.urlencoded({ extended: false, limit: "15mb" }));
    await registerRoutes(app);
  });

  afterAll(() => {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it("adds multiple uploads and a link to a meet", async () => {
    const meetRes = await request(app).post("/api/meets").send({
      name: "Media Flow Meet",
      date: "2024-05-01",
      location: "Test Track",
    });

    expect(meetRes.status).toBe(201);
    const meetId = meetRes.body.id;

    const imageData = `data:image/png;base64,${Buffer.from("fake").toString("base64")}`;
    const videoData = `data:video/mp4;base64,${Buffer.from("fakevideo").toString("base64")}`;

    const photoRes = await request(app)
      .post(`/api/meets/${meetId}/media`)
      .send({
        mode: "upload",
        filename: "jump.png",
        contentType: "image/png",
        data: imageData,
        caption: "First jump",
      });

    expect(photoRes.status).toBe(201);

    const videoRes = await request(app)
      .post(`/api/meets/${meetId}/media`)
      .send({
        mode: "upload",
        filename: "vault.mp4",
        contentType: "video/mp4",
        data: videoData,
        caption: "Second jump",
      });

    expect(videoRes.status).toBe(201);

    const linkRes = await request(app)
      .post(`/api/meets/${meetId}/media`)
      .send({
        mode: "url",
        url: "https://example.com/meet-video.mp4",
        type: "video",
        caption: "Highlight reel",
      });

    expect(linkRes.status).toBe(201);

    const mediaRes = await request(app).get(`/api/meets/${meetId}/media`);
    expect(mediaRes.status).toBe(200);
    expect(mediaRes.body).toHaveLength(3);
    expect(mediaRes.body.map((item: { type: string }) => item.type)).toEqual(
      expect.arrayContaining(["photo", "video"]),
    );

    await Promise.all(
      mediaRes.body.map((item: { url?: string | null }) =>
        removeLocalUpload(item.url),
      ),
    );
  });
});
