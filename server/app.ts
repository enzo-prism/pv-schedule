import express, { type Request, Response, NextFunction } from "express";
import { MAX_MEDIA_BODY_BYTES } from "../shared/media.js";
import { registerRoutes } from "./routes.js";
import { getUploadsRoot, uploadsEnabled } from "./media.js";
import { log } from "./log.js";

export function createApp() {
  const app = express();

  app.use(express.json({ limit: MAX_MEDIA_BODY_BYTES }));
  app.use(express.urlencoded({ extended: false, limit: MAX_MEDIA_BODY_BYTES }));

  if (uploadsEnabled()) {
    app.use("/uploads", express.static(getUploadsRoot()));
  }

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }

        log(logLine);
      }
    });

    next();
  });

  registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  return app;
}
