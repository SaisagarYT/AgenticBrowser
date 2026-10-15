"use strict";

import { getDatabase } from "../database.js";
import { randomUUID } from "node:crypto";

export class CritiqueRepository {
  static record({ taskId, stepNumber, feedback, terminate, finalResponse = null }) {
    const db = getDatabase();
    const id = randomUUID();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO critiques (id, task_id, step_number, feedback, terminate, final_response, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, taskId, stepNumber, feedback, terminate ? 1 : 0, finalResponse, now);
    return { id, taskId, stepNumber, feedback, terminate, finalResponse, created_at: now };
  }

  static getByTask(taskId) {
    const db = getDatabase();
    const stmt = db.prepare(`SELECT * FROM critiques WHERE task_id = ? ORDER BY step_number ASC`);
    return stmt.all(taskId);
  }
}
