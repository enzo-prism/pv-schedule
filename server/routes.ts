import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMeetSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

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

  const httpServer = createServer(app);
  return httpServer;
}
