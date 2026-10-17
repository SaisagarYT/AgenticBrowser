"use strict";

import fs from "node:fs";
import path from "node:path";
import { logger } from "./logger.js";
import { modelRegistry } from "../core/modelRegistry.js";

const SIDEBAR_JS_PATH = path.resolve(process.cwd(), "src", "utils", "ui", "sidebarOverlay.js");

export class UIManager {
  constructor() {
    this.sidebarScript = null;
    this.conversationHistory = [];
    this.isCollapsed = false;
    this.statusText = "Ready. Type a prompt below to automate.";
  }

  getSidebarScript() {
    if (fs.existsSync(SIDEBAR_JS_PATH)) {
      const code = fs.readFileSync(SIDEBAR_JS_PATH, "utf8");
      let prelude = "";
      try {
        prelude = `window.__INITIAL_MODELS__ = ${JSON.stringify(modelRegistry.getModels())};\nwindow.__INITIAL_PROVIDERS__ = ${JSON.stringify(modelRegistry.getProviders())};\n`;
      } catch { }
      return prelude + code;
    }
    logger.warn(`Sidebar script not found at: ${SIDEBAR_JS_PATH}`);
    return null;
  }

  async injectOverlay(page, retries = 2) {
    if (!page || page.isClosed()) return;

    try {
      const script = this.getSidebarScript();
      if (!script) return;

      // Inject sidebar script into the current webpage DOM
      await page.evaluate(script);

      // Replay existing chat history if any
      await this.replayHistory(page);
    } catch (err) {
      const isNavigating = err.message.includes("Execution context was destroyed") ||
        err.message.includes("Frame was detached") ||
        err.message.includes("navigating") ||
        err.message.includes("Cannot find context");

      if (isNavigating && retries > 0) {
        setTimeout(() => {
          if (!page.isClosed()) {
            this.injectOverlay(page, retries - 1).catch(() => {});
          }
        }, 250);
      } else if (!isNavigating) {
        logger.debug(`Sidebar injection notice: ${err.message}`);
      }
    }
  }

  async addUserMessage(page, message, fromOverlay = false) {
    this.statusText = "Planning step-by-step strategy...";
    this.conversationHistory.push({ from: "user", message });
    if (!page || page.isClosed()) return;

    // If message originated from the in-page sidebar overlay, it's already rendered locally
    if (fromOverlay) return;

    try {
      await page.evaluate((msg) => {
        window.agenticSidebar?.addUserMessage(msg);
      }, message);
    } catch {
      // Ignore
    }
  }

  async addSystemMessage(page, message, messageType = "step") {
    this.conversationHistory.push({ from: "system", message, messageType });
    if (!page || page.isClosed()) return;

    try {
      await page.evaluate(({ msg, type }) => {
        window.agenticSidebar?.addSystemMessage(msg, type);
      }, { msg: message, type: messageType });
    } catch {
      // Ignore
    }
  }

  async updateState(page, state) {
    this.statusText = state;
    if (!page || page.isClosed()) return;

    try {
      await page.evaluate((st) => {
        window.agenticSidebar?.setStatus(st);
      }, state);
    } catch {
      // Ignore
    }
  }

  async commandCompleted(page) {
    this.statusText = "Task completed. Ready for next prompt.";
    if (!page || page.isClosed()) return;

    try {
      await page.evaluate(() => {
        window.agenticSidebar?.hideSkeleton?.();
        window.agenticSidebar?.setStatus("Task completed! Type your next instruction below.");
      });
    } catch {
      // Ignore
    }
  }

  async replayHistory(page) {
    if (!page || page.isClosed()) return;

    try {
      for (const item of this.conversationHistory) {
        if (item.from === "user") {
          await page.evaluate((msg) => window.agenticSidebar?.addUserMessage(msg), item.message);
        } else {
          await page.evaluate(
            ({ msg, type }) => window.agenticSidebar?.addSystemMessage(msg, type),
            { msg: item.message, type: item.messageType || "step" }
          );
        }
      }
      if (this.statusText) {
        await page.evaluate((st) => window.agenticSidebar?.setStatus(st), this.statusText);
      }
    } catch {
      // Ignore
    }
  }
}

export const uiManager = new UIManager();
