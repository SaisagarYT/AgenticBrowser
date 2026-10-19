"use strict";

import { createServer } from "./server.js";
import { config } from "./config.js";
import { logger } from "./utils/logger.js";
import { browserManager } from "./core/browserManager.js";
import { AntigravityCliClient } from "./core/antigravityCliClient.js";

const app = createServer();
AntigravityCliClient.warmup();

const server = app.listen(config.port, config.host, () => {
  logger.info("==========================================================");
  logger.info(`🚀 Agentic Browser Server listening on http://${config.host}:${config.port}`);
  logger.info(`📊 Web Dashboard available at: http://localhost:${config.port}`);
  logger.info(`🤖 LLM Model: ${config.llm.textModel} (${config.llm.textBaseUrl})`);
  logger.info(`👁️ Vision Critique: ${config.llm.visionEnabled ? config.llm.visionModel : "Disabled"}`);
  logger.info("==========================================================");

  // Automatically pop up the browser dashboard on startup
  if (process.env.AUTO_OPEN !== "false") {
    import("node:child_process").then(({ exec }) => {
      const openCmd = process.platform === "win32" ? "start" : process.platform === "darwin" ? "open" : "xdg-open";
      exec(`${openCmd} http://localhost:${config.port}`);
    }).catch(() => {});
  }
});

// Graceful shutdown
const shutdown = async () => {
  logger.info("Gracefully shutting down Agentic Browser...");
  server.close(async () => {
    await browserManager.close();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
