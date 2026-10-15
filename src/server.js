"use strict";

import express from "express";
import cors from "cors";
import path from "node:path";
import { config } from "./config.js";
import { apiRouter } from "./routes/apiRoutes.js";
import { sseRouter } from "./routes/sseRoutes.js";
import { logger } from "./utils/logger.js";
import { getDatabase } from "./db/database.js";

export function createServer() {
  // Initialize SQLite database
  getDatabase();

  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Request logger
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.url}`);
    next();
  });

  // Static web dashboard
  const publicDir = path.resolve(config.paths.root, "public");
  app.use(express.static(publicDir));

  // Serve captured screenshots
  app.use("/screenshots", express.static(config.paths.screenshots));

  // Mount API routes
  // Direct compatibility with TheAgenticBrowser route /execute_task
  app.use("/", apiRouter);
  app.use("/api", apiRouter);
  app.use("/api", sseRouter);

  // Global Error Handler
  app.use((err, req, res, next) => {
    logger.error(`Unhandled Express Error: ${err.message}`, { stack: err.stack });
    res.status(500).json({
      error: "Internal Server Error",
      message: err.message,
    });
  });

  return app;
}
