"use strict";

import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import { BrowserNavigationError } from "../utils/errors.js";

class BrowserManager {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  async initialize() {
    if (this.page && !this.page.isClosed()) {
      return this.page;
    }

    logger.info(`Launching Playwright Chromium (headless=${config.browser.headless})`);

    const launchOptions = {
      headless: config.browser.headless,
      slowMo: config.browser.slowMo,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-dev-shm-usage",
        "--start-maximized",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
      ],
    };

    if (config.browser.storageDir) {
      if (!fs.existsSync(config.browser.storageDir)) {
        fs.mkdirSync(config.browser.storageDir, { recursive: true });
      }

      this.context = await chromium.launchPersistentContext(config.browser.storageDir, {
        ...launchOptions,
        viewport: null,
        bypassCSP: true,
        ignoreHTTPSErrors: true,
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      });

      const pages = this.context.pages();
      this.page = pages.length > 0 ? pages[0] : await this.context.newPage();
    } else {
      this.browser = await chromium.launch(launchOptions);
      this.context = await this.browser.newContext({
        viewport: null,
        bypassCSP: true,
        ignoreHTTPSErrors: true,
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      });
      this.page = await this.context.newPage();
    }

    // Start local browser control server for MCP & external agents (agy)
    try {
      const { startControlServer } = await import("./controlServer.js");
      await startControlServer();
    } catch (err) {
      logger.warn(`[BrowserManager] Control server start notice: ${err.message}`);
    }

    // Auto-inject sidebar on every document context before any page scripts run
    const { uiManager } = await import("../utils/uiManager.js");
    const sidebarScript = uiManager.getSidebarScript();
    if (sidebarScript) {
      try {
        await this.context.addInitScript({ content: sidebarScript });
      } catch (err) {
        logger.debug(`Context addInitScript notice: ${err.message}`);
      }
    }

    // Expose process_task for the in-page chat overlay
    try {
      await this.context.exposeFunction("process_task", async (commandOrPayload, maybeModel, maybeSessionId) => {
        let command = commandOrPayload;
        let selectedModel = maybeModel || null;
        let sessionId = maybeSessionId || null;

        if (typeof commandOrPayload === "object" && commandOrPayload !== null) {
          command = commandOrPayload.command;
          selectedModel = commandOrPayload.model || selectedModel;
          sessionId = commandOrPayload.sessionId || sessionId;
        }

        logger.info(`Received command from in-page chat overlay: "${command}" [Model: ${selectedModel || "default"}, Session: ${sessionId || "new"}]`);
        const { orchestrator } = await import("./orchestrator.js");
        orchestrator.runTask(command, null, { model: selectedModel, sessionId, fromOverlay: true }).catch((err) => {
          logger.error(`Task from overlay failed: ${err.message}`);
        });
      });

      // Expose model management functions to bypass CORS/CSP on third-party sites
      await this.context.exposeFunction("get_models", async () => {
        const { modelRegistry } = await import("./modelRegistry.js");
        const { AntigravityCliClient } = await import("./antigravityCliClient.js");
        return {
          models: modelRegistry.getModels(),
          providers: modelRegistry.getProviders(),
          antigravityAvailable: AntigravityCliClient.isAvailable(),
        };
      });

      await this.context.exposeFunction("save_model", async (modelData) => {
        const { modelRegistry } = await import("./modelRegistry.js");
        const created = modelRegistry.addModel(modelData);
        return { success: true, model: created };
      });

      await this.context.exposeFunction("delete_model", async (modelId) => {
        const { modelRegistry } = await import("./modelRegistry.js");
        const removed = modelRegistry.removeModel(modelId);
        return { success: removed };
      });

      await this.context.exposeFunction("test_provider", async (providerId, apiKey, customBaseUrl) => {
        const { modelRegistry } = await import("./modelRegistry.js");
        return await modelRegistry.testProvider({ providerId, apiKey, customBaseUrl });
      });

      await this.context.exposeFunction("save_provider_config", async (config) => {
        const { modelRegistry } = await import("./modelRegistry.js");
        return modelRegistry.saveProviderConfig(config);
      });

      await this.context.exposeFunction("reset_antigravity_session", async () => {
        const { AntigravityCliClient } = await import("./antigravityCliClient.js");
        return AntigravityCliClient.resetSession();
      });

      // Expose session & multi-turn chat history management functions
      await this.context.exposeFunction("get_chat_history", async () => {
        const { SessionRepository } = await import("../db/repositories/sessionRepository.js");
        return SessionRepository.list({ limit: 50 });
      });

      await this.context.exposeFunction("get_chat_session", async (sessionId) => {
        const { SessionRepository } = await import("../db/repositories/sessionRepository.js");
        const { TaskRepository } = await import("../db/repositories/taskRepository.js");
        const fullSession = SessionRepository.getFullSession(sessionId);
        if (fullSession) return fullSession;
        // Fallback for single legacy task IDs
        return TaskRepository.getFullTaskDetails(sessionId);
      });

      await this.context.exposeFunction("delete_chat_session", async (sessionId) => {
        const { SessionRepository } = await import("../db/repositories/sessionRepository.js");
        const { TaskRepository } = await import("../db/repositories/taskRepository.js");
        SessionRepository.delete(sessionId);
        TaskRepository.delete(sessionId);
        return { success: true };
      });

      await this.context.exposeFunction("update_chat_session_title", async (sessionId, newTitle) => {
        const { SessionRepository } = await import("../db/repositories/sessionRepository.js");
        SessionRepository.updateTitle(sessionId, newTitle);
        return { success: true };
      });

      await this.context.exposeFunction("clear_chat_history", async () => {
        const { SessionRepository } = await import("../db/repositories/sessionRepository.js");
        return { success: SessionRepository.clearAll() };
      });
    } catch {
      // Ignore if already exposed
    }

    // Comprehensive lifecycle listeners: inject overlay on domcontentloaded, load, and frame navigation
    const attachPageOverlayListeners = (targetPage) => {
      targetPage.setDefaultTimeout(30000);
      targetPage.setDefaultNavigationTimeout(45000);

      targetPage.on("domcontentloaded", async () => {
        try {
          await uiManager.injectOverlay(targetPage);
        } catch { }
      });

      targetPage.on("load", async () => {
        try {
          await uiManager.injectOverlay(targetPage);
        } catch { }
      });

      targetPage.on("framenavigated", async (frame) => {
        if (frame === targetPage.mainFrame()) {
          try {
            await uiManager.injectOverlay(targetPage);
          } catch { }
        }
      });
    };

    attachPageOverlayListeners(this.page);

    // Auto-track new tabs and popups (e.g. e-commerce product links with target="_blank")
    this.context.on("page", async (newPage) => {
      let isPopup = false;
      try {
        isPopup = await newPage.evaluate(() => {
          return Boolean(window.opener) && (window.innerWidth < 700 || window.innerHeight < 600);
        });
      } catch {
        // Ignore
      }

      logger.info(`[BrowserManager] New page opened: ${newPage.url()} (isPopup: ${isPopup})`);
      this.page = newPage;

      newPage.on("close", () => {
        if (this.page === newPage && this.context) {
          const openPages = this.context.pages().filter((p) => !p.isClosed());
          if (openPages.length > 0) {
            this.page = openPages[openPages.length - 1];
          }
        }
      });

      if (!isPopup) {
        attachPageOverlayListeners(newPage);
        try {
          await uiManager.injectOverlay(newPage);
        } catch {
          // Ignore
        }
      }
    });

    // Navigate to Google by default if fresh page
    if (this.page.url() === "about:blank") {
      try {
        logger.info("Opening default homepage: https://www.google.com");
        await this.page.goto("https://www.google.com", { waitUntil: "domcontentloaded" });
        await uiManager.injectOverlay(this.page);
      } catch (err) {
        logger.warn(`Default navigation warning: ${err.message}`);
      }
    }

    return this.page;
  }

  async getPage() {
    if (!this.page || this.page.isClosed()) {
      if (this.context) {
        const openPages = this.context.pages().filter((p) => !p.isClosed());
        if (openPages.length > 0) {
          this.page = openPages[openPages.length - 1];
          return this.page;
        }
      }
      await this.initialize();
    }
    return this.page;
  }

  async captureScreenshot(name = "screenshot") {
    const page = await this.getPage();
    const timestamp = Date.now();
    const filename = `${name}_${timestamp}.jpg`;
    const filepath = path.join(config.paths.screenshots, filename);

    const buffer = await page.screenshot({
      type: "jpeg",
      quality: 80,
      fullPage: false,
    });

    fs.writeFileSync(filepath, buffer);

    return {
      filepath,
      filename,
      base64: buffer.toString("base64"),
    };
  }

  async close() {
    logger.info("Closing browser session");
    try {
      if (this.context) {
        await this.context.close();
      }
      if (this.browser) {
        await this.browser.close();
      }
      const { stopControlServer } = await import("./controlServer.js");
      stopControlServer();
    } catch (err) {
      logger.warn(`Error during browser teardown: ${err.message}`);
    } finally {
      this.page = null;
      this.context = null;
      this.browser = null;
    }
  }
}

export const browserManager = new BrowserManager();
