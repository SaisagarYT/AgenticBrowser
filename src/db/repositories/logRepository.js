"use strict";

import { getDatabase } from "../database.js";

export class LogRepository {
  static log(taskId, level, message) {
    try {
      const db = getDatabase();
      const now = new Date().toISOString();
      const stmt = db.prepare(`
        INSERT INTO logs (task_id, level, message, created_at)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(taskId, level, message, now);
    } catch {
      // Ignore database logging errors to prevent cascading failures
    }
  }

  static getByTask(taskId, limit = 200) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM logs WHERE task_id = ? ORDER BY id ASC LIMIT ?
    `);
    return stmt.all(taskId, limit);
  }
}
