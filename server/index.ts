import { createServer } from "http";
import { createApp } from "./app";
import { setupVite, serveStatic } from "./vite";
import { log } from "./log";

(async () => {
  const app = createApp();
  const server = createServer(app);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client
  const port = Number(process.env.PORT) || 5000;
  const host = process.env.HOST ?? "0.0.0.0";
  server.listen({
    port,
    host,
    ...(process.env.REUSE_PORT === "true" ? { reusePort: true } : {}),
  }, () => {
    log(`serving on port ${port}`);
  });
})();
