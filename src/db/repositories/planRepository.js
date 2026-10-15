"use strict";

import { getDatabase } from "../database.js";
import { randomUUID } from "node:crypto";

export class PlanRepository {
  static savePlan({ taskId, planText, version = 1, steps = [] }) {
    const db = getDatabase();
    const now = new Date().toISOString();
    const planId = randomUUID();

    const insertPlan = db.prepare(`
      INSERT INTO plans (id, task_id, version, plan_text, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertPlan.run(planId, taskId, version, planText, now);

    if (steps.length > 0) {
      // Clear older steps if version > 1
      if (version > 1) {
        db.prepare(`DELETE FROM plan_steps WHERE task_id = ?`).run(taskId);
      }

      const insertStep = db.prepare(`
        INSERT INTO plan_steps (id, task_id, step_number, instruction, status, created_at)
        VALUES (?, ?, ?, ?, 'PENDING', ?)
      `);

      for (let i = 0; i < steps.length; i++) {
        insertStep.run(randomUUID(), taskId, i + 1, steps[i], now);
      }
    }

    return { id: planId, taskId, version, planText, steps };
  }

  static updateStepStatus(taskId, stepNumber, status) {
    const db = getDatabase();
    const now = status === "COMPLETED" ? new Date().toISOString() : null;
    const stmt = db.prepare(`
      UPDATE plan_steps 
      SET status = ?, completed_at = ?
      WHERE task_id = ? AND step_number = ?
    `);
    stmt.run(status, now, taskId, stepNumber);
  }

  static getLatestPlan(taskId) {
    const db = getDatabase();
    const stmt = db.prepare(`SELECT * FROM plans WHERE task_id = ? ORDER BY version DESC LIMIT 1`);
    return stmt.get(taskId) || null;
  }
}
