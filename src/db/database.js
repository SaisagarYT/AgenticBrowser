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
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      model TEXT,
      status TEXT DEFAULT 'ACTIVE',
      total_turns INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      command TEXT NOT NULL,
      status TEXT NOT NULL,
      final_response TEXT,
      error TEXT,
      total_steps INTEGER DEFAULT 0,
      duration_ms INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
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

  // Migration: Ensure session_id column exists on tasks table if already created previously
  try {
    const taskColumns = db.prepare("PRAGMA table_info(tasks)").all();
    const hasSessionId = taskColumns.some((col) => col.name === "session_id");
    if (!hasSessionId) {
      db.exec("ALTER TABLE tasks ADD COLUMN session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE;");
    }

    // Migrate any legacy orphan tasks into valid sessions so no past chat history is lost
    const orphanTasks = db.prepare("SELECT id, command, created_at, updated_at FROM tasks WHERE session_id IS NULL").all();
    if (orphanTasks.length > 0) {
      const insertSession = db.prepare(`
        INSERT OR IGNORE INTO sessions (id, title, status, total_turns, created_at, updated_at)
        VALUES (?, ?, 'COMPLETED', 1, ?, ?)
      `);
      const updateTask = db.prepare("UPDATE tasks SET session_id = ? WHERE id = ?");
      for (const t of orphanTasks) {
        const legacySessionId = `sess_legacy_${t.id}`;
        insertSession.run(legacySessionId, (t.command || "Previous Session").slice(0, 100), t.created_at, t.updated_at);
        updateTask.run(legacySessionId, t.id);
      }
    }

    // Indices for high-performance session lookups
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tasks_session ON tasks(session_id, created_at ASC);
      CREATE INDEX IF NOT EXISTS idx_sessions_updated ON sessions(updated_at DESC);
    `);
  } catch (err) {
    logger.warn(`Database migration notice: ${err.message}`);
  }
}
