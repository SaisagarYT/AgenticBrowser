"use strict";

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { logger } from "../utils/logger.js";

const ROOT_DIR = process.cwd();
const DATA_DIR = path.resolve(ROOT_DIR, "data");
const SETTINGS_FILE = path.resolve(DATA_DIR, "app_settings.json");

function getDefaultDownloadsDir() {
  try {
    const home = os.homedir();
    if (home) {
      const userDownloads = path.resolve(home, "Downloads");
      if (fs.existsSync(userDownloads)) {
        return userDownloads;
      }
    }
  } catch {}
  return path.resolve(ROOT_DIR, "downloads");
}

export class AppSettingsManager {
  constructor() {
    this.settings = null;
    this._load();
  }

  _load() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch {}
    }

    if (fs.existsSync(SETTINGS_FILE)) {
      try {
        const raw = fs.readFileSync(SETTINGS_FILE, "utf8");
        this.settings = JSON.parse(raw);
      } catch (err) {
        logger.warn(`[AppSettingsManager] Failed to parse settings file: ${err.message}. Using defaults.`);
        this.settings = null;
      }
    }

    if (!this.settings || typeof this.settings !== "object") {
      this.settings = {
        downloadsDir: getDefaultDownloadsDir(),
        somEnabled: true,
        visionResolution: "high",
        stepTimeout: 30000,
        updatedAt: new Date().toISOString(),
      };
      this._save();
    } else {
      // Ensure downloadsDir exists in loaded settings
      if (!this.settings.downloadsDir || typeof this.settings.downloadsDir !== "string") {
        this.settings.downloadsDir = getDefaultDownloadsDir();
        this._save();
      }
    }
  }

  _save() {
    try {
      this.settings.updatedAt = new Date().toISOString();
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(this.settings, null, 2), "utf8");
    } catch (err) {
      logger.error(`[AppSettingsManager] Failed to save settings: ${err.message}`);
    }
  }

  getSettings() {
    if (!this.settings) this._load();
    return {
      ...this.settings,
      defaultDownloadsDir: getDefaultDownloadsDir(),
      projectDownloadsDir: path.resolve(ROOT_DIR, "downloads"),
      articlesDownloadsDir: path.resolve(ROOT_DIR, "downloads", "articles"),
    };
  }

  getDownloadsDir() {
    if (!this.settings) this._load();
    const dir = this.settings.downloadsDir || getDefaultDownloadsDir();
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (err) {
      logger.warn(`[AppSettingsManager] Could not create downloadsDir: ${dir} (${err.message}). Falling back to project downloads.`);
      const fallback = path.resolve(ROOT_DIR, "downloads");
      if (!fs.existsSync(fallback)) fs.mkdirSync(fallback, { recursive: true });
      return fallback;
    }
    return dir;
  }

  setDownloadsDir(newPath) {
    if (!newPath || typeof newPath !== "string") {
      throw new Error("Invalid downloads directory path.");
    }
    const resolved = path.resolve(newPath.trim());
    if (!fs.existsSync(resolved)) {
      fs.mkdirSync(resolved, { recursive: true });
    }
    this.settings.downloadsDir = resolved;
    this._save();
    logger.info(`[AppSettingsManager] Updated downloads directory to: ${resolved}`);
    return this.getSettings();
  }

  saveSettings(partial) {
    if (typeof partial !== "object" || partial === null) {
      throw new Error("Settings payload must be an object.");
    }
    if (partial.downloadsDir) {
      const resolved = path.resolve(partial.downloadsDir.trim());
      if (!fs.existsSync(resolved)) {
        fs.mkdirSync(resolved, { recursive: true });
      }
      this.settings.downloadsDir = resolved;
    }
    if (typeof partial.somEnabled === "boolean") {
      this.settings.somEnabled = partial.somEnabled;
    }
    if (partial.visionResolution) {
      this.settings.visionResolution = partial.visionResolution;
    }
    if (typeof partial.stepTimeout === "number") {
      this.settings.stepTimeout = partial.stepTimeout;
    }
    this._save();
    return this.getSettings();
  }

  resetDownloadsDir() {
    const defaultDir = getDefaultDownloadsDir();
    this.settings.downloadsDir = defaultDir;
    this._save();
    logger.info(`[AppSettingsManager] Reset downloads directory to default: ${defaultDir}`);
    return this.getSettings();
  }
}

export const appSettings = new AppSettingsManager();
