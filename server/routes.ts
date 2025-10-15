import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMeetSchema, type MediaItem } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";

// Configure multer for file uploads
const storage_multer = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'client', 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
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
  fileFilter: (req, file, cb) => {
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
      const result = insertMeetSchema.safeParse(req.body);
      
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
      
      const result = insertMeetSchema.safeParse(req.body);
      
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

      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const newMediaItems: MediaItem[] = req.files.map((file: Express.Multer.File) => {
        const isVideo = file.mimetype.startsWith('video/');
        return {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: isVideo ? 'video' : 'photo',
          url: `/uploads/${file.filename}`,
          caption: req.body.caption || '',
          uploadedAt: new Date().toISOString()
        } as MediaItem;
      });

      // Add new media to existing media array
      const updatedMedia = [...(meet.media || []), ...newMediaItems];
      
      // Update the meet with new media
      const updatedMeet = await storage.updateMeet(id, {
        ...meet,
        media: updatedMedia
      });

      res.json({ media: newMediaItems, meet: updatedMeet });
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

      const meet = await storage.getMeetById(id);
      if (!meet) {
        return res.status(404).json({ message: "Meet not found" });
      }

      const mediaId = req.params.mediaId;
      const updatedMedia = (meet.media || []).filter((item: MediaItem) => item.id !== mediaId);

      // Update the meet with filtered media
      const updatedMeet = await storage.updateMeet(id, {
        ...meet,
        media: updatedMedia
      });

      res.json({ meet: updatedMeet });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete media" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
