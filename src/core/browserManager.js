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
        "--use-fake-ui-for-media-stream",
      ],
    };

    const downloadDir = config.getDownloadsDir();

    if (config.browser.storageDir) {
      if (!fs.existsSync(config.browser.storageDir)) {
        fs.mkdirSync(config.browser.storageDir, { recursive: true });
      }

      this.context = await chromium.launchPersistentContext(config.browser.storageDir, {
        ...launchOptions,
        viewport: null,
        bypassCSP: true,
        ignoreHTTPSErrors: true,
        acceptDownloads: true,
        downloadsPath: downloadDir,
        permissions: ["microphone"],
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
        acceptDownloads: true,
        downloadsPath: downloadDir,
        permissions: ["microphone"],
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      });
      this.page = await this.context.newPage();
    }

    // Set Chromium download behavior to save directly with real filenames
    try {
      const client = await this.context.newCDPSession(this.page);
      await client.send("Browser.setDownloadBehavior", {
        behavior: "allowAndName",
        downloadPath: downloadDir,
        events: true,
      });
    } catch (cdpErr) {
      logger.debug(`CDP setDownloadBehavior notice: ${cdpErr.message}`);
    }

    this.context.on("page", async (newPage) => {
      try {
        const client = await this.context.newCDPSession(newPage);
        await client.send("Browser.setDownloadBehavior", {
          behavior: "allowAndName",
          downloadPath: config.getDownloadsDir(),
          events: true,
        });
      } catch {}
    });

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

      // Expose OS-level file opening and folder revealing for downloaded scholarly articles
      await this.context.exposeFunction("open_downloaded_file", async (filePath) => {
        try {
          if (!filePath || !fs.existsSync(filePath)) {
            logger.warn(`[BrowserManager] File does not exist to open: ${filePath}`);
            return { success: false, error: "File not found on disk" };
          }
          const { exec } = await import("node:child_process");
          if (process.platform === "win32") {
            exec(`start "" "${filePath}"`);
          } else if (process.platform === "darwin") {
            exec(`open "${filePath}"`);
          } else {
            exec(`xdg-open "${filePath}"`);
          }
          return { success: true };
        } catch (err) {
          logger.error(`[BrowserManager] Failed to open file: ${err.message}`);
          return { success: false, error: err.message };
        }
      });

      await this.context.exposeFunction("reveal_in_folder", async (filePath) => {
        try {
          if (!filePath || !fs.existsSync(filePath)) {
            logger.warn(`[BrowserManager] File does not exist to reveal: ${filePath}`);
            return { success: false, error: "File not found on disk" };
          }
          const { exec } = await import("node:child_process");
          if (process.platform === "win32") {
            exec(`explorer.exe /select,"${filePath}"`);
          } else if (process.platform === "darwin") {
            exec(`open -R "${filePath}"`);
          } else {
            exec(`xdg-open "${path.dirname(filePath)}"`);
          }
          return { success: true };
        } catch (err) {
          logger.error(`[BrowserManager] Failed to reveal folder: ${err.message}`);
          return { success: false, error: err.message };
        }
      });

      await this.context.exposeFunction("get_app_settings", async () => {
        const { appSettings } = await import("./settingsManager.js");
        return appSettings.getSettings();
      });

      await this.context.exposeFunction("save_app_settings", async (newSettings) => {
        const { appSettings } = await import("./settingsManager.js");
        const updated = appSettings.saveSettings(newSettings);
        try {
          if (this.page && !this.page.isClosed()) {
            const client = await this.context.newCDPSession(this.page);
            await client.send("Browser.setDownloadBehavior", {
              behavior: "allowAndName",
              downloadPath: updated.downloadsDir,
              events: true,
            });
          }
        } catch {}
        return updated;
      });

      await this.context.exposeFunction("reset_downloads_dir", async () => {
        const { appSettings } = await import("./settingsManager.js");
        const updated = appSettings.resetDownloadsDir();
        try {
          if (this.page && !this.page.isClosed()) {
            const client = await this.context.newCDPSession(this.page);
            await client.send("Browser.setDownloadBehavior", {
              behavior: "allowAndName",
              downloadPath: updated.downloadsDir,
              events: true,
            });
          }
        } catch {}
        return updated;
      });

      await this.context.exposeFunction("get_downloaded_artifacts", async () => {
        try {
          const dlDir = config.getDownloadsDir();
          const legacyDir = path.resolve(process.cwd(), "downloads", "articles");
          const dirsToCheck = [dlDir];
          if (fs.existsSync(legacyDir) && legacyDir !== dlDir) {
            dirsToCheck.push(legacyDir);
          }

          const artifacts = [];
          const seenFiles = new Set();

          for (const dir of dirsToCheck) {
            if (!fs.existsSync(dir)) continue;
            const files = fs.readdirSync(dir);
            const jsonFiles = files.filter((f) => f.endsWith(".json"));

            for (const jf of jsonFiles) {
              try {
                const fullJson = path.join(dir, jf);
                const content = JSON.parse(fs.readFileSync(fullJson, "utf8"));
                if (content.filePath && !seenFiles.has(content.filePath)) {
                  seenFiles.add(content.filePath);
                  artifacts.push(content);
                }
              } catch {}
            }

            // Also check for standalone PDF files without sidecars
            const pdfFiles = files.filter((f) => f.endsWith(".pdf"));
            for (const pf of pdfFiles) {
              const fullPdf = path.join(dir, pf);
              if (!seenFiles.has(fullPdf)) {
                seenFiles.add(fullPdf);
                let fileSizeMb = "0.0";
                try {
                  const stats = fs.statSync(fullPdf);
                  fileSizeMb = (stats.size / (1024 * 1024)).toFixed(2);
                } catch {}
                artifacts.push({
                  title: pf.replace(/\.pdf$/i, "").replace(/[_-]/g, " "),
                  filename: pf,
                  filePath: fullPdf,
                  fileSize: `${fileSizeMb} MB`,
                  downloadedAt: new Date(fs.statSync(fullPdf).mtime).toISOString(),
                  source: "Browser Download",
                });
              }
            }
          }

          return artifacts.sort((a, b) => new Date(b.downloadedAt) - new Date(a.downloadedAt));
        } catch (err) {
          logger.warn(`[BrowserManager] Failed to list artifacts: ${err.message}`);
          return [];
        }
      });

      // Expose Kira Voice synthesis and voice configuration functions
      await this.context.exposeFunction("kira_generate_voice_response", async (params) => {
        const { VoiceAgent } = await import("../agents/voiceAgent.js");
        return await VoiceAgent.generateVoiceResponse(params || {});
      });

      await this.context.exposeFunction("kira_synthesize_speech", async (text, options) => {
        const { voiceService } = await import("./voice/voiceService.js");
        return await voiceService.synthesize(text, options);
      });

      await this.context.exposeFunction("kira_get_voice_settings", async () => {
        const { voiceService } = await import("./voice/voiceService.js");
        return voiceService.getSettings();
      });

      await this.context.exposeFunction("kira_save_voice_settings", async (settings) => {
        const { voiceService } = await import("./voice/voiceService.js");
        return voiceService.saveSettings(settings);
      });

      await this.context.exposeFunction("kira_transcribe_audio", async (base64Audio) => {
        const { getSTTService } = await import("./voice/sttService.js");
        const stt = getSTTService();
        return await stt.transcribe(base64Audio);
      });

      // Background pre-warm Whisper ASR transcriber
      import("./voice/sttService.js").then(({ getSTTService }) => {
        getSTTService().getTranscriber().catch(() => {});
      }).catch(() => {});
    } catch {
      // Ignore if already exposed
    }

    // Comprehensive lifecycle listeners: inject overlay on domcontentloaded, load, frame navigation, and downloads
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

      // Capture native Playwright browser downloads (e.g. clicking direct PDF links)
      targetPage.on("download", async (download) => {
        try {
          const suggestedFilename = download.suggestedFilename() || `article_${Date.now()}.pdf`;
          const dlDir = config.getDownloadsDir();
          if (!fs.existsSync(dlDir)) {
            fs.mkdirSync(dlDir, { recursive: true });
          }
          const savePath = path.join(dlDir, suggestedFilename);
          await download.saveAs(savePath);
          logger.info(`[BrowserManager] Playwright caught download saved to: ${savePath}`);

          let fileSizeMb = "0.0";
          try {
            const stats = fs.statSync(savePath);
            fileSizeMb = (stats.size / (1024 * 1024)).toFixed(2);
          } catch {}

          const artifact = {
            title: suggestedFilename.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "),
            authors: "Academic Source",
            filename: suggestedFilename,
            filePath: savePath,
            fileSize: `${fileSizeMb} MB`,
            downloadedAt: new Date().toISOString(),
            source: targetPage.url(),
          };

          const sidecarPath = path.join(dlDir, `${suggestedFilename.replace(/\.[^/.]+$/, "")}.json`);
          try {
            fs.writeFileSync(sidecarPath, JSON.stringify(artifact, null, 2), "utf8");
          } catch {}

          await uiManager.addSystemMessage(targetPage, JSON.stringify(artifact), "artifact");
        } catch (err) {
          logger.error(`[BrowserManager] Error capturing download: ${err.message}`);
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
