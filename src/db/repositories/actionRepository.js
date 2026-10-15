"use strict";

import { getDatabase } from "../database.js";
import { randomUUID } from "node:crypto";

export class ActionRepository {
  static record({ taskId, stepNumber, toolName, parameters, result, screenshotPath = null, status = "SUCCESS" }) {
    const db = getDatabase();
    const id = randomUUID();
    const now = new Date().toISOString();
    const paramsStr = typeof parameters === "object" ? JSON.stringify(parameters) : String(parameters || "");
    const resultStr = typeof result === "object" ? JSON.stringify(result) : String(result || "");

    const stmt = db.prepare(`
      INSERT INTO actions (id, task_id, step_number, tool_name, parameters, result, screenshot_path, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, taskId, stepNumber, toolName, paramsStr, resultStr, screenshotPath, status, now);
    return { id, taskId, stepNumber, toolName, status, created_at: now };
  }

  static getByTask(taskId) {
    const db = getDatabase();
    const stmt = db.prepare(`SELECT * FROM actions WHERE task_id = ? ORDER BY step_number ASC, created_at ASC`);
    return stmt.all(taskId);
  }
}
