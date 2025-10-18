import express, { type Express, type Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMeetSchema, mediaMetadataSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";

const UPLOADS_DIRECTORY = path.join(process.cwd(), "uploads");

interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

type ExpressRequestWithFiles = Request & {
  files?: UploadedFile[];
};

// Configure multer for file uploads
const storage_multer = multer.diskStorage({
  destination: async (
    _req: Request,
    _file: UploadedFile,
    cb: (error: Error | null, destination: string) => void,
  ) => {
    await fs.mkdir(UPLOADS_DIRECTORY, { recursive: true });
    cb(null, UPLOADS_DIRECTORY);
  },
  filename: (
    req: Request,
    file: UploadedFile,
    cb: (error: Error | null, filename: string) => void,
  ) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage_multer,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  },
  fileFilter: (
    req: Request,
    file: UploadedFile,
    cb: (error: Error | null, acceptFile?: boolean) => void,
  ) => {
    // Accept images and videos
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'video/webm'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure uploads directory exists and is served statically
  await fs.mkdir(UPLOADS_DIRECTORY, { recursive: true });
  app.use("/uploads", express.static(UPLOADS_DIRECTORY));

  // GET - Get all meets
  app.get("/api/meets", async (_req, res) => {
    try {
      const meets = await storage.getAllMeets();
      res.json(meets);
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

      res.json(meet);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve meet" });
    }
  });

  // POST - Create a new meet
  app.post("/api/meets", async (req, res) => {
    try {
      const payload = { ...req.body };
      if (payload && typeof payload === "object" && "media" in payload) {
        delete (payload as Record<string, unknown>).media;
      }

      const result = insertMeetSchema.safeParse(payload);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const meet = await storage.createMeet(result.data);
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
      
      const payload = { ...req.body };
      if (payload && typeof payload === "object" && "media" in payload) {
        delete (payload as Record<string, unknown>).media;
      }

      const result = insertMeetSchema.safeParse(payload);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const updatedMeet = await storage.updateMeet(id, result.data);
      
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

  // POST - Upload media for a meet
  app.post("/api/meets/:id/media", upload.array('media', 10), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid meet ID" });
      }

      const meet = await storage.getMeetById(id);
      if (!meet) {
        return res.status(404).json({ message: "Meet not found" });
      }

      const multerReq = req as ExpressRequestWithFiles;

      if (!multerReq.files || !Array.isArray(multerReq.files)) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const captions = Array.isArray(req.body.caption)
        ? req.body.caption
        : typeof req.body.caption === "string"
          ? [req.body.caption]
          : [];

      const newMediaInputs = multerReq.files.map((file: UploadedFile, index: number) => {
        const isVideo = file.mimetype.startsWith('video/');
        const type: 'photo' | 'video' = isVideo ? 'video' : 'photo';
        const rawCaption = captions[index] ?? captions[0];
        const caption = typeof rawCaption === "string" ? rawCaption : undefined;

        return {
          type,
          url: `/uploads/${file.filename}`,
          caption: caption ? caption.trim() : undefined,
          originalFilename: file.originalname,
          uploadedAt: new Date(),
        };
      });

      const updatedMedia = await storage.addMediaItems(id, newMediaInputs);
      const updatedMeet = await storage.getMeetById(id);

      if (!updatedMeet) {
        return res.status(500).json({ message: "Failed to refresh meet after uploading media" });
      }

      res.json({ media: updatedMedia, meet: updatedMeet });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: "Failed to upload media" });
    }
  });

  // DELETE - Delete media from a meet
  app.delete("/api/meets/:id/media/:mediaId", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid meet ID" });
      }

      const mediaId = parseInt(req.params.mediaId, 10);
      if (isNaN(mediaId)) {
        return res.status(400).json({ message: "Invalid media ID" });
      }

      const deletionResult = await storage.deleteMediaItem(id, mediaId);
      const updatedMeet = await storage.getMeetById(id);

      if (!updatedMeet) {
        return res.status(404).json({ message: "Meet not found" });
      }

      if (deletionResult.removed?.url) {
        const filename = path.basename(deletionResult.removed.url);
        const filePath = path.join(UPLOADS_DIRECTORY, filename);
        try {
          await fs.unlink(filePath);
        } catch {
          // Ignore unlink errors (file may already be gone)
        }
      }

      res.json({ media: deletionResult.media, meet: updatedMeet });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete media" });
    }
  });

  // PATCH - Update media metadata
  app.patch("/api/meets/:id/media/:mediaId", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid meet ID" });
      }

      const mediaId = parseInt(req.params.mediaId, 10);
      if (isNaN(mediaId)) {
        return res.status(400).json({ message: "Invalid media ID" });
      }

      const validation = mediaMetadataSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }

      const data = validation.data;
      const caption =
        data.caption === undefined ? undefined : data.caption.trim() === "" ? null : data.caption.trim();

      const updatedMedia = await storage.updateMediaItem(id, mediaId, {
        caption,
        position: data.position,
      });

      if (!updatedMedia) {
        return res.status(404).json({ message: "Media item not found" });
      }

      const updatedMeet = await storage.getMeetById(id);

      if (!updatedMeet) {
        return res.status(404).json({ message: "Meet not found" });
      }

      res.json({ media: updatedMedia, meet: updatedMeet });
    } catch (error) {
      console.error('Media metadata update error:', error);
      res.status(500).json({ message: "Failed to update media metadata" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
