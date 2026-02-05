import express, { type Express } from "express";
import { storage } from "./storage";
import { insertMeetSchema } from "@shared/schema";
import { normalizeMeetMetrics } from "@shared/metrics";
import { fromZodError } from "zod-validation-error";
import {
  inferMediaType,
  isValidRemoteUrl,
  removeLocalUpload,
  resolveMediaUrl,
  saveBase64Upload,
  uploadsEnabled,
} from "./media";

function resolveMediaItemUrls(
  req: express.Request,
  item: {
    url: string;
    thumbnail: string | null;
    [key: string]: any;
  },
) {
  return {
    ...item,
    url: resolveMediaUrl(req, item.url) ?? item.url,
    thumbnail:
      resolveMediaUrl(req, item.thumbnail ?? undefined) ??
      item.thumbnail ??
      null,
  };
}

function resolveMeetMedia(req: express.Request, meet: any) {
  if (!meet?.media || !Array.isArray(meet.media)) {
    return meet;
  }

  return {
    ...meet,
    media: meet.media.map((item: any) => resolveMediaItemUrls(req, item)),
  };
}

export function registerRoutes(app: Express) {
  // GET - Get all meets
  app.get("/api/meets", async (_req, res) => {
    try {
      const meets = await storage.getAllMeets();
      res.json(meets.map((meet) => resolveMeetMedia(_req, meet)));
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve meets" });
    }
  });

  // GET - Get meet by ID
  app.get("/api/meets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid meet ID" });
      }

      const meet = await storage.getMeetById(id);
      if (!meet) {
        return res.status(404).json({ message: "Meet not found" });
      }

      res.json(resolveMeetMedia(req, meet));
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve meet" });
    }
  });

  // POST - Create a new meet
  app.post("/api/meets", async (req, res) => {
    try {
      const result = insertMeetSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const { normalized, errors } = normalizeMeetMetrics(result.data);
      if (errors.length > 0) {
        return res.status(400).json({ message: errors.join(" ") });
      }

      const meet = await storage.createMeet({
        ...result.data,
        ...normalized,
      });
      res.status(201).json(meet);
    } catch (error) {
      res.status(500).json({ message: "Failed to create meet" });
    }
  });
  
  // PUT - Update an existing meet
  app.put("/api/meets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid meet ID" });
      }

      const result = insertMeetSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const { normalized, errors } = normalizeMeetMetrics(result.data);
      if (errors.length > 0) {
        return res.status(400).json({ message: errors.join(" ") });
      }
      
      const updatedMeet = await storage.updateMeet(id, {
        ...result.data,
        ...normalized,
      });
      
      if (!updatedMeet) {
        return res.status(404).json({ message: "Meet not found" });
      }
      
      res.json(updatedMeet);
    } catch (error) {
      res.status(500).json({ message: "Failed to update meet" });
    }
  });
  
  // DELETE - Delete an existing meet
  app.delete("/api/meets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid meet ID" });
      }
      
      const success = await storage.deleteMeet(id);
      
      if (!success) {
        return res.status(404).json({ message: "Meet not found or could not be deleted" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete meet" });
    }
  });

  // GET - Get media for a meet
  app.get("/api/meets/:id/media", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid meet ID" });
      }

      const meet = await storage.getMeetById(id);
      if (!meet) {
        return res.status(404).json({ message: "Meet not found" });
      }

      const media = await storage.getMediaForMeet(id);
      res.json(media.map((item) => resolveMediaItemUrls(req, item)));
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve media" });
    }
  });

  // POST - Upload or add media for a meet
  app.post("/api/meets/:id/media", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid meet ID" });
      }

      const meet = await storage.getMeetById(id);
      if (!meet) {
        return res.status(404).json({ message: "Meet not found" });
      }

      const body = req.body ?? {};
      const mode = body.mode ?? (body.data ? "upload" : body.url ? "url" : null);

      if (mode === "upload") {
        if (!uploadsEnabled()) {
          return res.status(413).json({
            message: "File uploads are disabled on this deployment. Please add a URL instead.",
          });
        }

        const filename = String(body.filename || "");
        const data = String(body.data || "");
        const contentType = body.contentType ? String(body.contentType) : undefined;
        const caption = body.caption ? String(body.caption).trim() : null;

        if (!filename || !data) {
          return res.status(400).json({ message: "File data and filename are required." });
        }

        const saved = await saveBase64Upload({
          meetId: id,
          filename,
          contentType,
          data,
        });

        const media = await storage.addMediaItems(id, [
          {
            type: saved.type,
            url: saved.url,
            caption,
            originalFilename: saved.originalFilename,
          },
        ]);

        return res.status(201).json(media);
      }

      if (mode === "url") {
        const url = String(body.url || "").trim();
        const caption = body.caption ? String(body.caption).trim() : null;
        const originalFilename = body.originalFilename
          ? String(body.originalFilename)
          : null;
        const fallbackType =
          body.type === "photo" || body.type === "video" ? body.type : undefined;
        const type = inferMediaType(body.contentType, fallbackType);

        if (!url) {
          return res.status(400).json({ message: "URL is required." });
        }

        if (!url.startsWith("/uploads/") && !isValidRemoteUrl(url)) {
          return res.status(400).json({ message: "URL must be http(s) or /uploads/." });
        }

        if (!type) {
          return res.status(400).json({ message: "Media type is required." });
        }

        const media = await storage.addMediaItems(id, [
          {
            type,
            url,
            caption,
            originalFilename,
          },
        ]);

        return res.status(201).json(media);
      }

      return res.status(400).json({ message: "Invalid media upload payload." });
    } catch (error) {
      res.status(500).json({ message: "Failed to add media" });
    }
  });

  // PATCH - Update media metadata
  app.patch("/api/meets/:id/media/:mediaId", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid meet ID" });
      }

      const mediaId = req.params.mediaId;
      const caption = req.body?.caption;
      const positionRaw = req.body?.position;
      const focusXRaw = req.body?.focusX;
      const focusYRaw = req.body?.focusY;
      const position =
        positionRaw === undefined || positionRaw === null
          ? undefined
          : Number(positionRaw);
      const focusX =
        focusXRaw === undefined || focusXRaw === null
          ? undefined
          : Number(focusXRaw);
      const focusY =
        focusYRaw === undefined || focusYRaw === null
          ? undefined
          : Number(focusYRaw);

      if (position !== undefined && !Number.isFinite(position)) {
        return res.status(400).json({ message: "Position must be a number." });
      }

      if (focusX !== undefined && !Number.isFinite(focusX)) {
        return res.status(400).json({ message: "focusX must be a number." });
      }

      if (focusY !== undefined && !Number.isFinite(focusY)) {
        return res.status(400).json({ message: "focusY must be a number." });
      }

      if (focusX !== undefined && (focusX < 0 || focusX > 100)) {
        return res.status(400).json({ message: "focusX must be between 0 and 100." });
      }

      if (focusY !== undefined && (focusY < 0 || focusY > 100)) {
        return res.status(400).json({ message: "focusY must be between 0 and 100." });
      }

      const updated = await storage.updateMediaItem(id, mediaId, {
        caption,
        position,
        focusX,
        focusY,
      });

      if (!updated) {
        return res.status(404).json({ message: "Media not found" });
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update media" });
    }
  });

  // DELETE - Delete media item
  app.delete("/api/meets/:id/media/:mediaId", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid meet ID" });
      }

      const mediaId = req.params.mediaId;
      const result = await storage.deleteMediaItem(id, mediaId);

      if (!result.removed) {
        return res.status(404).json({ message: "Media not found" });
      }

      await removeLocalUpload(result.removed.url);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete media" });
    }
  });


  return;
}
