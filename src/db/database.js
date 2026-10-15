"use strict";

import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";

let dbInstance = null;

export function getDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  const dbDir = path.dirname(config.database.path);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  logger.info(`Initializing SQLite database at: ${config.database.path}`);
  dbInstance = new DatabaseSync(config.database.path);

  // Enable WAL mode for high concurrency
  dbInstance.exec("PRAGMA journal_mode = WAL;");
  dbInstance.exec("PRAGMA foreign_keys = ON;");

  initSchema(dbInstance);

  return dbInstance;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      command TEXT NOT NULL,
      status TEXT NOT NULL,
      final_response TEXT,
      error TEXT,
      total_steps INTEGER DEFAULT 0,
      duration_ms INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      version INTEGER DEFAULT 1,
      plan_text TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS plan_steps (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      step_number INTEGER NOT NULL,
      instruction TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING',
      created_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS actions (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      step_number INTEGER NOT NULL,
      tool_name TEXT NOT NULL,
      parameters TEXT,
      result TEXT,
      screenshot_path TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS critiques (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      step_number INTEGER NOT NULL,
      feedback TEXT NOT NULL,
      terminate INTEGER NOT NULL DEFAULT 0,
      final_response TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_actions_task ON actions(task_id, step_number);
    CREATE INDEX IF NOT EXISTS idx_critiques_task ON critiques(task_id, step_number);
    CREATE INDEX IF NOT EXISTS idx_logs_task ON logs(task_id);
  `);
}
