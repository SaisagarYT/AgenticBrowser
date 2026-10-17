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

    // Expose process_task and model registry functions for the in-page chat overlay
    try {
      await this.context.exposeFunction("process_task", async (commandOrPayload, maybeModel) => {
        let command = commandOrPayload;
        let selectedModel = maybeModel || null;

        if (typeof commandOrPayload === "object" && commandOrPayload !== null) {
          command = commandOrPayload.command;
          selectedModel = commandOrPayload.model || selectedModel;
        }

        logger.info(`Received command from in-page chat overlay: "${command}" [Model: ${selectedModel || "default"}]`);
        const { orchestrator } = await import("./orchestrator.js");
        orchestrator.runTask(command, null, { model: selectedModel, fromOverlay: true }).catch((err) => {
          logger.error(`Task from overlay failed: ${err.message}`);
        });
      });

      const { modelRegistry } = await import("./modelRegistry.js");
      await this.context.exposeFunction("get_models", async () => {
        return {
          models: modelRegistry.getModels(),
          providers: modelRegistry.getProviders(),
        };
      });

      await this.context.exposeFunction("save_model", async (modelData) => {
        const added = modelRegistry.addModel(modelData);
        return { success: true, model: added };
      });

      await this.context.exposeFunction("delete_model", async (modelId) => {
        const success = modelRegistry.removeModel(modelId);
        return { success };
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
      logger.info(`[BrowserManager] Switching active focus to new tab: ${newPage.url()}`);
      this.page = newPage;
      attachPageOverlayListeners(newPage);

      try {
        await uiManager.injectOverlay(newPage);
      } catch {
        // Ignore
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
