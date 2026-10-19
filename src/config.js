"use strict";

import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { appSettings } from "./core/settingsManager.js";

dotenv.config();

const ROOT_DIR = process.cwd();
const DATA_DIR = path.resolve(ROOT_DIR, "data");
const SCREENSHOTS_DIR = path.resolve(DATA_DIR, "screenshots");

// Ensure required runtime directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

export const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "8000", 10),
  host: process.env.HOST || "0.0.0.0",

  llm: {
    textModel: process.env.AGENTIC_BROWSER_TEXT_MODEL || "gpt-4o",
    textApiKey: process.env.AGENTIC_BROWSER_TEXT_API_KEY || process.env.NVIDIA_API_KEY || process.env.OPENAI_API_KEY || "",
    textBaseUrl: process.env.AGENTIC_BROWSER_TEXT_BASE_URL || "https://api.openai.com/v1",

    verificationMode: process.env.AGENTIC_BROWSER_VERIFICATION_MODE || "hybrid",
    visionEnabled: process.env.AGENTIC_BROWSER_SS_ENABLED !== "false",
    visionModel: process.env.AGENTIC_BROWSER_SS_MODEL || "gpt-4o",
    visionApiKey: process.env.AGENTIC_BROWSER_SS_API_KEY || process.env.NVIDIA_API_KEY || process.env.OPENAI_API_KEY || "",
    visionBaseUrl: process.env.AGENTIC_BROWSER_SS_BASE_URL || "https://api.openai.com/v1",
  },

  googleSearch: {
    apiKey: process.env.GOOGLE_API_KEY || "",
    cx: process.env.GOOGLE_CX || "",
  },

  browser: {
    headless: process.env.BROWSER_HEADLESS === "true",
    storageDir: path.resolve(ROOT_DIR, process.env.BROWSER_STORAGE_DIR || "./data/browser_storage"),
    slowMo: parseInt(process.env.BROWSER_SLOW_MO || "100", 10),
    maxSteps: parseInt(process.env.MAX_STEPS || "15", 10),
  },

  database: {
    path: path.resolve(ROOT_DIR, process.env.DATABASE_PATH || "./data/agentic_browser.db"),
  },

  paths: {
    root: ROOT_DIR,
    data: DATA_DIR,
    screenshots: SCREENSHOTS_DIR,
    get downloads() {
      return appSettings.getDownloadsDir();
    },
    get articles() {
      return appSettings.getDownloadsDir();
    },
  },

  getDownloadsDir() {
    return appSettings.getDownloadsDir();
  },
};
