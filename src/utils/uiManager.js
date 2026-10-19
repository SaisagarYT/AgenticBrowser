"use strict";

import fs from "node:fs";
import path from "node:path";
import { logger } from "./logger.js";

import { modelRegistry } from "../core/modelRegistry.js";
import { buildSidebarScript } from "./ui/sidebarOverlay.js";

const SIDEBAR_BUNDLE_PATH = path.resolve(process.cwd(), "src", "utils", "ui", "sidebar.bundle.js");

export class UIManager {
  constructor() {
    this.sidebarScript = null;
    this.conversationHistory = [];
    this.isCollapsed = false;
    this.statusText = "Ready. Type a prompt below to automate.";
    this.activeSessionId = null;
    this.activeSessionTitle = null;
  }

  setActiveSession(sessionId, title = null) {
    this.activeSessionId = sessionId;
    if (title) this.activeSessionTitle = title;
  }

  clearSession() {
    this.activeSessionId = null;
    this.activeSessionTitle = null;
    this.conversationHistory = [];
  }

  getSidebarScript() {
    let baseScript = null;
    try {
      baseScript = buildSidebarScript();
    } catch {
      if (fs.existsSync(SIDEBAR_BUNDLE_PATH)) {
        baseScript = fs.readFileSync(SIDEBAR_BUNDLE_PATH, "utf8");
      }
    }

    if (baseScript) {
      try {
        const initialModels = JSON.stringify(modelRegistry.getModels());
        const initialProviders = JSON.stringify(modelRegistry.getProviders());
        const activeSess = this.activeSessionId ? JSON.stringify(this.activeSessionId) : "null";
        const activeTitle = this.activeSessionTitle ? JSON.stringify(this.activeSessionTitle) : "null";
        const initScript = `
window.__INITIAL_MODELS__ = ${initialModels};
window.__INITIAL_PROVIDERS__ = ${initialProviders};
window.__ANTIGRAVITY_AVAILABLE__ = true;
window.__ACTIVE_SESSION_ID__ = window.__ACTIVE_SESSION_ID__ || ${activeSess};
window.__ACTIVE_SESSION_TITLE__ = window.__ACTIVE_SESSION_TITLE__ || ${activeTitle};
`;
        return initScript + "\n" + baseScript;
      } catch {
        return baseScript;
      }
    }
    logger.warn(`Sidebar script not found at: ${SIDEBAR_JS_PATH}`);
    return null;
  }

  async injectOverlay(page, retries = 2) {
    if (!page || page.isClosed()) return;

    try {
      // Avoid re-injecting if the sidebar is already mounted in this page
      const isAlreadyPresent = await page.evaluate(() => {
        return Boolean(document.getElementById("agentic-sidebar-wrapper"));
      }).catch(() => false);

      if (isAlreadyPresent) return;

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
            this.injectOverlay(page, retries - 1).catch(() => { });
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

  async streamToken(page, accumulatedText) {
    if (!page || page.isClosed()) return;
    try {
      await page.evaluate((text) => {
        window.agenticSidebar?.streamToken?.(text);
      }, accumulatedText);
    } catch {
      // Ignore
    }
  }

  async finalizeTokenStream(page, finalText) {
    if (!page || page.isClosed()) return;
    try {
      await page.evaluate((text) => {
        window.agenticSidebar?.finalizeTokenStream?.(text);
      }, finalText);
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
